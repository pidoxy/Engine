# aidcare_pipeline/admin_router.py
"""
Admin API router — AidCare Copilot
====================================
Prefix: /admin

Endpoints:
  GET  /admin/dashboard/
  GET  /admin/doctor/{doctor_uuid}/detail
  POST /admin/seed-demo/
"""

import uuid as uuid_lib
from datetime import datetime, timedelta, timezone
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


# ─────────────────────────────────────────────────────────────────────────────
# POST /admin/seed-demo/
# ─────────────────────────────────────────────────────────────────────────────

_SEED_DOCTORS = [
    {
        "full_name": "Dr. Amaka Okafor",
        "specialty": "General Medicine",
        "ward":      "Ward A",
        "hospital":  "General Hospital Lagos",
        "role":      "doctor",
    },
    {
        "full_name": "Dr. Emeka Nwosu",
        "specialty": "Emergency Medicine",
        "ward":      "A&E",
        "hospital":  "General Hospital Lagos",
        "role":      "doctor",
    },
    {
        "full_name": "Dr. Fatima Usman",
        "specialty": "Paediatrics",
        "ward":      "Paeds Ward",
        "hospital":  "General Hospital Lagos",
        "role":      "doctor",
    },
    {
        "full_name": "Dr. Chukwudi Eze",
        "specialty": "Surgery",
        "ward":      "Surgical Ward",
        "hospital":  "General Hospital Lagos",
        "role":      "doctor",
    },
    {
        "full_name": "Dr. Ngozi Adeyemi",
        "specialty": "Obstetrics & Gynaecology",
        "ward":      "Maternity",
        "hospital":  "General Hospital Lagos",
        "role":      "admin",
    },
]

_SEED_CONSULTATIONS = [
    {
        "patient_ref": "Bed 2B",
        "soap": {
            "subjective": "40-year-old male presenting with 3 days of progressive chest pain, worse on exertion, mild SOB. No previous cardiac history. Takes metformin for T2DM.",
            "objective":  "BP 145/92, HR 98, RR 20, SpO2 96% RA. Mild diaphoresis. ECG shows ST changes in leads II, III, aVF.",
            "assessment": "Possible NSTEMI. Rule out ACS. Differential: unstable angina, GERD.",
            "plan":       "Admit. Dual antiplatelet therapy initiated. Troponin q6h. Cardiology referral urgent. NPO for now.",
        },
        "patient_summary": "40M with possible NSTEMI — admitted for cardiology review and troponin monitoring.",
        "complexity_score": 4,
        "flags": ["Urgent referral", "Abnormal vital signs", "ECG changes"],
        "language": "en",
    },
    {
        "patient_ref": "OPD 14",
        "soap": {
            "subjective": "28-year-old female with 5-day history of fever, rigors, and generalised body ache. Lives in malaria-endemic area. No mosquito net.",
            "objective":  "Temp 38.9°C, HR 104, RR 18, SpO2 98%. Mild pallor, no jaundice. Spleen not palpably enlarged.",
            "assessment": "Presumptive malaria. Rapid malaria RDT positive (P. falciparum).",
            "plan":       "Co-artemether 4 tabs stat, then BD x 3 days. Paracetamol 1g TDS for fever. Oral fluids. RV in 48h if not improving.",
        },
        "patient_summary": "28F with confirmed P. falciparum malaria — started co-artemether, review in 48h.",
        "complexity_score": 2,
        "flags": [],
        "language": "en",
    },
    {
        "patient_ref": "Bed 5A",
        "soap": {
            "subjective": "Brought in by relative. 65M found unresponsive at home. Unknown duration. PMH: HTN, epilepsy on phenytoin.",
            "objective":  "GCS 8 (E2V2M4). BP 210/130, HR 88. Left facial droop, right-sided weakness. PEARL (3mm, sluggish). RBS 7.2.",
            "assessment": "Acute ischaemic stroke. Hypertensive emergency. ?Status epilepticus prior to collapse.",
            "plan":       "Airway — position, suction, O2. IV access x2. CT head urgent. Labetalol infusion titrated. Neurology referral ASAP. NIHSS score 18.",
        },
        "patient_summary": "65M with GCS 8 and right-sided weakness — acute stroke protocol initiated, awaiting CT head.",
        "complexity_score": 5,
        "flags": ["Critical — immediate intervention", "Altered consciousness", "Urgent referral", "Abnormal vital signs"],
        "language": "en",
    },
    {
        "patient_ref": "OPD 7",
        "soap": {
            "subjective": "22-year-old male with 2-week itchy skin rash on both arms and trunk. No systemic symptoms. Used new detergent recently.",
            "objective":  "Erythematous papular rash, bilateral antecubital fossa and anterior trunk. No vesicles, no weeping. Dermographism positive.",
            "assessment": "Contact dermatitis / atopic eczema flare. Low suspicion for systemic cause.",
            "plan":       "Hydrocortisone 1% cream BD x 7 days. Cetirizine 10mg OD for itch. Avoid identified allergen. Emollient regularly. Review if no improvement.",
        },
        "patient_summary": "22M with contact dermatitis — topical steroids and antihistamine prescribed, review PRN.",
        "complexity_score": 1,
        "flags": [],
        "language": "en",
    },
    {
        "patient_ref": "Bed 1C",
        "soap": {
            "subjective": "34F G3P2, 32/40 weeks gestation. Referred from PHC for decreased fetal movements since yesterday. No PV bleed. On iron + folic acid.",
            "objective":  "BP 138/88, HR 86. Fundal height 30cm. FHR 140 bpm. CTG reactive. Urine protein 1+.",
            "assessment": "Pre-eclampsia with mild features at 32 weeks. Reduced fetal movements — CTG reassuring for now.",
            "plan":       "Admit for monitoring. 24h urine protein. USS biophysical profile. MgSO4 loading if seizure develops. Betamethasone x2 doses for lung maturity. Nifedipine for BP. Obstetrics review at 8am.",
        },
        "patient_summary": "34F 32-week pregnancy with pre-eclampsia and reduced fetal movements — admitted for monitoring and steroids.",
        "complexity_score": 4,
        "flags": ["Obstetric emergency", "Abnormal vital signs", "Fetal concern"],
        "language": "en",
    },
]


@router.post("/seed-demo/")
def seed_demo(db: Session = Depends(get_db)):
    """
    Idempotent demo seeder.  Only runs if no doctors exist yet.
    Creates 5 doctors, opens a shift for each of the first 4,
    adds realistic consultations, and computes CLS scores.

    Returns the list of created doctor UUIDs (or existing ones if already seeded).
    """
    from .copilot_models import Doctor  # local import to avoid circular

    existing_count = db.query(Doctor).count()
    if existing_count > 0:
        existing_doctors = crud.get_all_doctors(db)
        return {
            "seeded": False,
            "message": f"Already seeded ({existing_count} doctors found). No changes made.",
            "doctors": [
                {"uuid": d.doctor_uuid, "name": d.full_name, "role": d.role}
                for d in existing_doctors
            ],
        }

    shift_start_base = datetime.now(timezone.utc) - timedelta(hours=6)
    created_doctors = []

    for i, d in enumerate(_SEED_DOCTORS):
        doc = crud.create_doctor(
            db=db,
            doctor_uuid=str(uuid_lib.uuid4()),
            full_name=d["full_name"],
            specialty=d["specialty"],
            ward=d["ward"],
            hospital=d["hospital"],
            role=d["role"],
        )
        created_doctors.append(doc)

        # Only non-admin doctors get seeded shifts (first 4)
        if i >= 4:
            continue

        db_shift = crud.start_shift(
            db=db,
            shift_uuid=str(uuid_lib.uuid4()),
            doctor_id_int=doc.id,
            ward=doc.ward or "General Ward",
        )

        # Give each doctor 2 consultations from the sample set (rolling window)
        doc_consultations = _SEED_CONSULTATIONS[i : i + 2]
        for cons_data in doc_consultations:
            crud.create_consultation(
                db=db,
                consultation_uuid=str(uuid_lib.uuid4()),
                doctor_id_int=doc.id,
                shift_id_int=db_shift.id,
                patient_ref=cons_data["patient_ref"],
                transcript_text=f"[Demo transcript for {cons_data['patient_ref']}]",
                soap_note_dict={"soap_note": cons_data["soap"]},
                patient_summary=cons_data["patient_summary"],
                complexity_score=cons_data["complexity_score"],
                flags=cons_data["flags"],
                language=cons_data["language"],
            )

        # Compute and save CLS
        consultations = crud.get_shift_consultations(db, db_shift.id)
        cls_result = calculate_cls(
            db=db,
            doctor_id_int=doc.id,
            shift_id_int=db_shift.id,
            consultations=consultations,
            shift_start=shift_start_base,
        )
        crud.save_burnout_score(
            db=db,
            score_uuid=str(uuid_lib.uuid4()),
            doctor_id_int=doc.id,
            shift_id_int=db_shift.id,
            cls=cls_result["cognitive_load_score"],
            status=cls_result["status"],
            breakdown_dict=cls_result["breakdown"],
            patients_seen=cls_result["patients_seen"],
            hours_active=cls_result["hours_active"],
            avg_complexity=cls_result["avg_complexity"],
        )

    return {
        "seeded": True,
        "message": f"Successfully seeded {len(created_doctors)} doctors with demo data.",
        "doctors": [
            {"uuid": d.doctor_uuid, "name": d.full_name, "role": d.role}
            for d in created_doctors
        ],
    }
