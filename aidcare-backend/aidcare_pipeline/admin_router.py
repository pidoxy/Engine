# aidcare_pipeline/admin_router.py
"""
Admin API router — AidCare Copilot
====================================
Prefix: /admin

Endpoints:
  GET  /admin/dashboard/
  GET  /admin/doctor/{doctor_uuid}/detail
"""

import uuid as uuid_lib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from . import copilot_crud as crud
from .burnout_calculator import calculate_cls

router = APIRouter(prefix="/admin", tags=["Copilot - Admin"])


# ─────────────────────────────────────────────────────────────────────────────
# GET /admin/dashboard/
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/dashboard/")
def admin_dashboard(db: Session = Depends(get_db)):
    """
    Returns the admin overview dashboard:
    - team-level aggregates
    - per-doctor CLS cards
    - red-zone alerts
    """
    doctors = crud.get_all_doctors(db)
    doctor_cards = []
    red_zone_alerts = []

    for doc in doctors:
        active_shift = crud.get_active_shift(db, doc.id)
        consultations = (
            crud.get_shift_consultations(db, active_shift.id) if active_shift else []
        )

        cls_result = calculate_cls(
            db=db,
            doctor_id_int=doc.id,
            shift_id_int=active_shift.id if active_shift else None,
            consultations=consultations,
            shift_start=active_shift.shift_start if active_shift else None,
        )

        # Persist the score so history is populated
        crud.save_burnout_score(
            db=db,
            score_uuid=str(uuid_lib.uuid4()),
            doctor_id_int=doc.id,
            shift_id_int=active_shift.id if active_shift else None,
            cls=cls_result["cognitive_load_score"],
            status=cls_result["status"],
            breakdown_dict=cls_result["breakdown"],
            patients_seen=cls_result["patients_seen"],
            hours_active=cls_result["hours_active"],
            avg_complexity=cls_result["avg_complexity"],
        )

        card = {
            "doctor_id":     doc.doctor_uuid,
            "name":          doc.full_name,
            "specialty":     doc.specialty or "",
            "ward":          active_shift.ward if active_shift else (doc.ward or ""),
            "cls":           cls_result["cognitive_load_score"],
            "status":        cls_result["status"],
            "patients_seen": cls_result["patients_seen"],
            "hours_active":  cls_result["hours_active"],
        }
        doctor_cards.append(card)

        if cls_result["status"] == "red":
            red_zone_alerts.append({
                "doctor_id": doc.doctor_uuid,
                "name":      doc.full_name,
                "cls":       cls_result["cognitive_load_score"],
                "message":   cls_result["recommendation"],
            })

    # Team aggregates
    total_active  = len([d for d in doctor_cards if d["patients_seen"] > 0 or True])  # all are "active"
    red_count     = sum(1 for d in doctor_cards if d["status"] == "red")
    amber_count   = sum(1 for d in doctor_cards if d["status"] == "amber")
    green_count   = sum(1 for d in doctor_cards if d["status"] == "green")
    avg_cls       = (
        sum(d["cls"] for d in doctor_cards) / len(doctor_cards)
        if doctor_cards else 0
    )
    total_patients = sum(d["patients_seen"] for d in doctor_cards)

    from datetime import datetime, timezone
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "team_stats": {
            "total_active":       total_active,
            "red_count":          red_count,
            "amber_count":        amber_count,
            "green_count":        green_count,
            "avg_cls":            round(avg_cls, 1),
            "total_patients_today": total_patients,
        },
        "doctors":          doctor_cards,
        "red_zone_alerts":  red_zone_alerts,
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET /admin/doctor/{doctor_uuid}/detail
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/doctor/{doctor_uuid}/detail")
def admin_doctor_detail(doctor_uuid: str, db: Session = Depends(get_db)):
    """Full detail for a single doctor — current shift + 7-day burnout history."""
    doc = crud.get_doctor_by_uuid(db, doctor_uuid)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Doctor {doctor_uuid!r} not found.")

    active_shift  = crud.get_active_shift(db, doc.id)
    consultations = (
        crud.get_shift_consultations(db, active_shift.id) if active_shift else []
    )

    cls_result = calculate_cls(
        db=db,
        doctor_id_int=doc.id,
        shift_id_int=active_shift.id if active_shift else None,
        consultations=consultations,
        shift_start=active_shift.shift_start if active_shift else None,
    )

    history_objs = crud.get_burnout_history(db, doc.id, days=7)
    history_7_days = [
        {"date": h.recorded_at.strftime("%Y-%m-%d %H:%M"), "cls": h.cognitive_load_score, "status": h.status}
        for h in history_objs
    ]

    consultation_list = [
        {
            "consultation_id":  c.consultation_uuid,
            "patient_ref":      c.patient_ref or "",
            "timestamp":        c.created_at.isoformat(),
            "complexity_score": c.complexity_score or 1,
            "flags":            c.flags or [],
            "patient_summary":  c.patient_summary or "",
        }
        for c in consultations
    ]

    return {
        "doctor_id":   doc.doctor_uuid,
        "doctor_name": doc.full_name,
        "specialty":   doc.specialty or "",
        "ward":        doc.ward or "",
        "current_shift": (
            {
                "shift_id":      active_shift.shift_uuid,
                "start":         active_shift.shift_start.isoformat(),
                "patients_seen": cls_result["patients_seen"],
                "hours_active":  cls_result["hours_active"],
            }
            if active_shift else None
        ),
        "cognitive_load_score": cls_result["cognitive_load_score"],
        "status":               cls_result["status"],
        "score_breakdown":      cls_result["breakdown"],
        "history_7_days":       history_7_days,
        "recommendation":       cls_result["recommendation"],
        "consultations":        consultation_list,
    }
