# aidcare_pipeline/copilot_router.py
"""
Doctor-facing API router — AidCare Copilot
==========================================
Prefix: /doctor

Endpoints:
  GET  /doctor/list/
  GET  /doctor/profile/{doctor_uuid}
  POST /doctor/shifts/start/
  POST /doctor/shifts/end/
  POST /doctor/scribe/                  (multipart audio → transcript + SOAP)
  POST /doctor/consultations/           (save a consultation)
  GET  /doctor/consultations/{doctor_uuid}
  POST /doctor/handover/
  GET  /doctor/burnout/{doctor_uuid}
"""

import os
import shutil
import time
import uuid as uuid_lib

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import get_db
from . import copilot_crud as crud
from . import copilot_models as models
from .transcription import transcribe_audio_local
from .soap_generation import generate_soap_note
from .handover_generation import generate_handover_report, generate_plain_text_report
from .burnout_calculator import calculate_cls

TEMP_AUDIO_DIR = "temp_audio"
os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)

router = APIRouter(prefix="/doctor", tags=["Copilot - Doctor"])


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────────────────────────────────────────

class StartShiftRequest(BaseModel):
    doctor_uuid: str
    ward: str


class EndShiftRequest(BaseModel):
    doctor_uuid: str
    shift_uuid: str


class SOAPNoteSchema(BaseModel):
    subjective: str = ""
    objective: str  = ""
    assessment: str = ""
    plan: str       = ""


class SaveConsultationRequest(BaseModel):
    doctor_uuid:      str
    shift_uuid:       str
    patient_ref:      str
    transcript:       str
    soap_note:        SOAPNoteSchema
    patient_summary:  str
    complexity_score: int
    flags:            list[str] = []
    language:         str = "en"


class GenerateHandoverRequest(BaseModel):
    doctor_uuid:    str
    shift_uuid:     str
    handover_notes: str = ""


# ─────────────────────────────────────────────────────────────────────────────
# Helper: resolve doctor or 404
# ─────────────────────────────────────────────────────────────────────────────

def _get_doctor_or_404(db: Session, doctor_uuid: str) -> models.Doctor:
    doc = crud.get_doctor_by_uuid(db, doctor_uuid)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Doctor {doctor_uuid!r} not found.")
    return doc


def _get_shift_or_404(db: Session, shift_uuid: str) -> models.Shift:
    shift = crud.get_shift_by_uuid(db, shift_uuid)
    if not shift:
        raise HTTPException(status_code=404, detail=f"Shift {shift_uuid!r} not found.")
    return shift


# ─────────────────────────────────────────────────────────────────────────────
# GET /doctor/list/
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/list/")
def list_doctors(db: Session = Depends(get_db)):
    """Return all active doctors (for the login/selector screen)."""
    doctors = crud.get_all_doctors(db)
    return {
        "doctors": [
            {
                "doctor_id":  d.doctor_uuid,
                "name":       d.full_name,
                "specialty":  d.specialty or "",
                "ward":       d.ward or "",
                "hospital":   d.hospital or "",
                "role":       d.role,
            }
            for d in doctors
        ]
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET /doctor/profile/{doctor_uuid}
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/profile/{doctor_uuid}")
def get_doctor_profile(doctor_uuid: str, db: Session = Depends(get_db)):
    doc = _get_doctor_or_404(db, doctor_uuid)
    return {
        "doctor_id": doc.doctor_uuid,
        "name":      doc.full_name,
        "specialty": doc.specialty or "",
        "ward":      doc.ward or "",
        "hospital":  doc.hospital or "",
        "role":      doc.role,
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /doctor/shifts/start/
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/shifts/start/")
def start_shift(body: StartShiftRequest, db: Session = Depends(get_db)):
    """Start a new shift for a doctor (auto-closes any existing active shift)."""
    doc = _get_doctor_or_404(db, body.doctor_uuid)
    shift_uuid = str(uuid_lib.uuid4())
    db_shift = crud.start_shift(
        db=db,
        shift_uuid=shift_uuid,
        doctor_id_int=doc.id,
        ward=body.ward or doc.ward or "",
    )
    return {
        "shift_id":   db_shift.shift_uuid,
        "started_at": db_shift.shift_start.isoformat(),
        "ward":       db_shift.ward,
        "doctor_name": doc.full_name,
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /doctor/shifts/end/
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/shifts/end/")
def end_shift(body: EndShiftRequest, db: Session = Depends(get_db)):
    """Mark a shift as ended and compute the final CLS."""
    doc = _get_doctor_or_404(db, body.doctor_uuid)
    db_shift = crud.end_shift(db=db, shift_uuid=body.shift_uuid)
    if not db_shift:
        raise HTTPException(status_code=404, detail=f"Shift {body.shift_uuid!r} not found.")

    consultations = crud.get_shift_consultations(db, db_shift.id)
    cls_result = calculate_cls(
        db=db,
        doctor_id_int=doc.id,
        shift_id_int=db_shift.id,
        consultations=consultations,
        shift_start=db_shift.shift_start,
    )

    score_uuid = str(uuid_lib.uuid4())
    crud.save_burnout_score(
        db=db,
        score_uuid=score_uuid,
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
        "ended_at":  db_shift.shift_end.isoformat() if db_shift.shift_end else None,
        "final_cls": cls_result["cognitive_load_score"],
        "status":    cls_result["status"],
        "patients_seen": cls_result["patients_seen"],
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /doctor/scribe/   (multipart)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/scribe/")
async def scribe(
    audio_file:  UploadFile = File(...),
    doctor_uuid: str        = Form(...),
    patient_ref: str        = Form(""),
    language:    str        = Form("en"),
    db:          Session    = Depends(get_db),
):
    """
    Transcribe a consultation audio recording and generate a SOAP note.
    Does NOT save to DB — call POST /doctor/consultations/ to persist.
    """
    _get_doctor_or_404(db, doctor_uuid)  # validate doctor exists

    unique_suffix = f"{int(time.time() * 1000)}_copilot_{audio_file.filename}"
    file_path = os.path.join(TEMP_AUDIO_DIR, unique_suffix)

    try:
        with open(file_path, "wb") as buf:
            shutil.copyfileobj(audio_file.file, buf)
        print(f"Copilot Scribe — audio saved to {file_path}")

        # Transcription (Whisper)
        print("Copilot Scribe — transcribing...")
        lang_hint = None if language == "pcm" else language
        transcript = transcribe_audio_local(file_path, language=lang_hint)
        if not transcript:
            raise HTTPException(status_code=500, detail="Transcription returned empty.")
        print(f"Copilot Scribe — transcript ({len(transcript)} chars): {transcript[:120]}...")

        # SOAP generation (Gemini)
        print("Copilot Scribe — generating SOAP note...")
        soap_result = generate_soap_note(transcript, language=language)
        if "error" in soap_result and not soap_result.get("soap_note"):
            print(f"SOAP generation error: {soap_result['error']}")
            # Still return partial result — don't block the doctor

        soap = soap_result.get("soap_note", {})
        return {
            "transcript":       transcript,
            "soap_note": {
                "subjective": soap.get("subjective", ""),
                "objective":  soap.get("objective",  ""),
                "assessment": soap.get("assessment", ""),
                "plan":       soap.get("plan",       ""),
            },
            "patient_summary":  soap_result.get("patient_summary", ""),
            "complexity_score": soap_result.get("complexity_score", 1),
            "flags":            soap_result.get("flags", []),
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Scribe error: {str(e)}")
    finally:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass


# ─────────────────────────────────────────────────────────────────────────────
# POST /doctor/consultations/
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/consultations/")
def save_consultation(body: SaveConsultationRequest, db: Session = Depends(get_db)):
    """Save a completed consultation and recalculate the doctor's CLS."""
    doc   = _get_doctor_or_404(db, body.doctor_uuid)
    shift = _get_shift_or_404(db, body.shift_uuid)

    if shift.doctor_id != doc.id:
        raise HTTPException(status_code=403, detail="Shift does not belong to this doctor.")

    consultation_uuid = str(uuid_lib.uuid4())
    crud.create_consultation(
        db=db,
        consultation_uuid=consultation_uuid,
        doctor_id_int=doc.id,
        shift_id_int=shift.id,
        patient_ref=body.patient_ref,
        transcript_text=body.transcript,
        soap_note_dict={
            "soap_note": {
                "subjective": body.soap_note.subjective,
                "objective":  body.soap_note.objective,
                "assessment": body.soap_note.assessment,
                "plan":       body.soap_note.plan,
            }
        },
        patient_summary=body.patient_summary,
        complexity_score=body.complexity_score,
        flags=body.flags,
        language=body.language,
    )

    # Recalculate CLS after saving consultation
    consultations = crud.get_shift_consultations(db, shift.id)
    cls_result = calculate_cls(
        db=db,
        doctor_id_int=doc.id,
        shift_id_int=shift.id,
        consultations=consultations,
        shift_start=shift.shift_start,
    )

    score_uuid = str(uuid_lib.uuid4())
    crud.save_burnout_score(
        db=db,
        score_uuid=score_uuid,
        doctor_id_int=doc.id,
        shift_id_int=shift.id,
        cls=cls_result["cognitive_load_score"],
        status=cls_result["status"],
        breakdown_dict=cls_result["breakdown"],
        patients_seen=cls_result["patients_seen"],
        hours_active=cls_result["hours_active"],
        avg_complexity=cls_result["avg_complexity"],
    )

    return {
        "consultation_id": consultation_uuid,
        "saved_at":        consultations[-1].created_at.isoformat() if consultations else None,
        "burnout_score": {
            "cls":    cls_result["cognitive_load_score"],
            "status": cls_result["status"],
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET /doctor/consultations/{doctor_uuid}?shift_uuid=
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/consultations/{doctor_uuid}")
def get_consultations(
    doctor_uuid: str,
    shift_uuid:  str,
    db: Session = Depends(get_db),
):
    doc   = _get_doctor_or_404(db, doctor_uuid)
    shift = _get_shift_or_404(db, shift_uuid)

    if shift.doctor_id != doc.id:
        raise HTTPException(status_code=403, detail="Shift does not belong to this doctor.")

    consultations = crud.get_shift_consultations(db, shift.id)

    return {
        "consultations_count": len(consultations),
        "consultations": [
            {
                "consultation_id":  c.consultation_uuid,
                "patient_ref":      c.patient_ref or "",
                "timestamp":        c.created_at.isoformat(),
                "transcript":       c.transcript_text or "",
                "soap_note": {
                    "subjective": c.soap_subjective or "",
                    "objective":  c.soap_objective  or "",
                    "assessment": c.soap_assessment or "",
                    "plan":       c.soap_plan       or "",
                },
                "patient_summary":  c.patient_summary or "",
                "complexity_score": c.complexity_score or 1,
                "flags":            c.flags or [],
                "language":         c.language or "en",
            }
            for c in consultations
        ],
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /doctor/handover/
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/handover/")
def generate_handover(body: GenerateHandoverRequest, db: Session = Depends(get_db)):
    """Generate a shift handover report using Gemini."""
    doc   = _get_doctor_or_404(db, body.doctor_uuid)
    shift = _get_shift_or_404(db, body.shift_uuid)

    if shift.doctor_id != doc.id:
        raise HTTPException(status_code=403, detail="Shift does not belong to this doctor.")

    consultations = crud.get_shift_consultations(db, shift.id)

    # Build consultation dicts for the LLM
    consultation_dicts = [
        {
            "patient_ref":    c.patient_ref or "Unknown",
            "patient_summary": c.patient_summary or "",
            "complexity_score": c.complexity_score or 1,
            "flags":           c.flags or [],
            "soap_note": {
                "subjective": c.soap_subjective or "",
                "objective":  c.soap_objective  or "",
                "assessment": c.soap_assessment or "",
                "plan":       c.soap_plan       or "",
            },
        }
        for c in consultations
    ]

    shift_start_str = (
        shift.shift_start.strftime("%Y-%m-%d %H:%M UTC")
        if shift.shift_start else "Unknown start"
    )
    shift_end_str = (
        shift.shift_end.strftime("%Y-%m-%d %H:%M UTC")
        if shift.shift_end else "Ongoing"
    )

    report_json = generate_handover_report(
        consultations=consultation_dicts,
        doctor_name=doc.full_name,
        ward=shift.ward or "Unknown ward",
        shift_start=shift_start_str,
        shift_end=shift_end_str,
    )

    plain_text = generate_plain_text_report(
        report_json=report_json,
        doctor_name=doc.full_name,
        ward=shift.ward or "Unknown ward",
        shift_start=shift_start_str,
        shift_end=shift_end_str,
        patients_seen=len(consultations),
    )

    # Save to DB
    report_uuid = str(uuid_lib.uuid4())
    db_report = crud.save_handover_report(
        db=db,
        report_uuid=report_uuid,
        doctor_id_int=doc.id,
        shift_id_int=shift.id,
        report_json=report_json,
        plain_text=plain_text,
    )

    # Compute shift stats
    avg_complexity = (
        sum((c.complexity_score or 1) for c in consultations) / len(consultations)
        if consultations else 0.0
    )

    return {
        "handover_id":   db_report.report_uuid,
        "generated_at":  db_report.generated_at.isoformat(),
        "doctor_name":   doc.full_name,
        "shift_summary": {
            "start":          shift_start_str,
            "end":            shift_end_str,
            "patients_seen":  len(consultations),
            "avg_complexity": round(avg_complexity, 1),
        },
        "critical_patients":   report_json.get("critical_patients", []),
        "stable_patients":     report_json.get("stable_patients", []),
        "discharged_patients": report_json.get("discharged_patients", []),
        "handover_notes":      body.handover_notes,
        "plain_text_report":   plain_text,
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET /doctor/burnout/{doctor_uuid}
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/burnout/{doctor_uuid}")
def get_burnout(doctor_uuid: str, db: Session = Depends(get_db)):
    """Calculate and return the live CLS for a doctor."""
    doc = _get_doctor_or_404(db, doctor_uuid)

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

    # Persist the fresh score
    score_uuid = str(uuid_lib.uuid4())
    crud.save_burnout_score(
        db=db,
        score_uuid=score_uuid,
        doctor_id_int=doc.id,
        shift_id_int=active_shift.id if active_shift else None,
        cls=cls_result["cognitive_load_score"],
        status=cls_result["status"],
        breakdown_dict=cls_result["breakdown"],
        patients_seen=cls_result["patients_seen"],
        hours_active=cls_result["hours_active"],
        avg_complexity=cls_result["avg_complexity"],
    )

    # 7-day history
    history_objs = crud.get_burnout_history(db, doc.id, days=7)
    history_7_days = [
        {
            "date":   h.recorded_at.strftime("%Y-%m-%d %H:%M"),
            "cls":    h.cognitive_load_score,
            "status": h.status,
        }
        for h in history_objs
    ]

    return {
        "doctor_id":   doc.doctor_uuid,
        "doctor_name": doc.full_name,
        "current_shift": (
            {
                "shift_id":     active_shift.shift_uuid,
                "start":        active_shift.shift_start.isoformat(),
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
    }
