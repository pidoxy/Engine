# aidcare_pipeline/crud.py
from sqlalchemy.orm import Session
import uuid
from . import db_models as models
from datetime import datetime, timezone


# --- Patient CRUD ---

def create_patient(
    db: Session,
    patient_id: str,
    first_name: str = None,
    last_name: str = None,
    phone_number: str = None,
    dob: datetime = None,
    gender: str = None,
    organization_id: str = None,
    created_by_id: str = None,
) -> models.Patient:
    """Create a patient record. patient_id must be the UUID assigned by the TypeScript API."""
    db_patient = models.Patient(
        id=patient_id,
        first_name=first_name,
        last_name=last_name,
        phone_number=phone_number,
        date_of_birth=dob,
        gender=gender,
        organization_id=organization_id,
        created_by_id=created_by_id,
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


def get_patient_by_id(db: Session, patient_id: str) -> models.Patient | None:
    """Look up a patient by their UUID primary key."""
    return db.query(models.Patient).filter(models.Patient.id == patient_id).first()


# Legacy alias — kept so any existing call to get_patient_by_uuid still works
def get_patient_by_uuid(db: Session, patient_uuid: str) -> models.Patient | None:
    return get_patient_by_id(db, patient_uuid)


def get_patients(db: Session, skip: int = 0, limit: int = 100) -> list[models.Patient]:
    return db.query(models.Patient).offset(skip).limit(limit).all()


# --- PatientDocument CRUD ---

def create_patient_document(
    db: Session,
    patient_id: str,
    original_filename: str,
    storage_path: str,
    file_type: str,
    consultation_id: str = None,
) -> models.PatientDocument:
    doc_id = str(uuid.uuid4())
    db_document = models.PatientDocument(
        id=doc_id,
        patient_id=patient_id,
        consultation_id=consultation_id,
        original_filename=original_filename,
        storage_path=storage_path,
        file_type=file_type,
        processing_status="queued",
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document


def get_patient_documents(
    db: Session, patient_id: str, limit: int = 10
) -> list[models.PatientDocument]:
    return (
        db.query(models.PatientDocument)
        .filter(models.PatientDocument.patient_id == patient_id)
        .order_by(models.PatientDocument.uploaded_at.desc())
        .limit(limit)
        .all()
    )


def update_document_processing_status(
    db: Session,
    document_id: str,
    status: str,
    extracted_text: str = None,
    error_msg: str = None,
):
    db_document = (
        db.query(models.PatientDocument)
        .filter(models.PatientDocument.id == document_id)
        .first()
    )
    if db_document:
        db_document.processing_status = status
        db_document.processed_at = datetime.now(timezone.utc)
        if extracted_text:
            db_document.extracted_text = extracted_text
        if error_msg:
            db_document.error_message = error_msg
        db.commit()
        db.refresh(db_document)
        return db_document
    return None


# --- Consultation CRUD ---
# (Previously named ConsultationSession — now mapped to unified "consultations" table)

def create_consultation(
    db: Session,
    patient_id: str,
    mode: str,
    consultation_id: str = None,
    consultant_id: str = None,
    audio_path: str = None,
    transcript: str = None,
    manual_context: str = None,
) -> models.Consultation:
    """Create a consultation record in the unified consultations table."""
    c_id = consultation_id or str(uuid.uuid4())
    db_consultation = models.Consultation(
        id=c_id,
        patient_id=patient_id,
        consultant_id=consultant_id,
        mode=mode,
        audio_file_path=audio_path,
        transcript_text=transcript,
        manual_context_input=manual_context,
    )
    db.add(db_consultation)
    db.commit()
    db.refresh(db_consultation)
    return db_consultation


# Legacy alias so existing calls to create_consultation_session still work
def create_consultation_session(
    db: Session,
    patient_id: str,
    mode: str,
    audio_path: str = None,
    transcript: str = None,
    manual_context_input: str = None,
    session_uuid: str = None,
) -> models.Consultation:
    return create_consultation(
        db=db,
        patient_id=patient_id,
        mode=mode,
        consultation_id=session_uuid,
        audio_path=audio_path,
        transcript=transcript,
        manual_context=manual_context_input,
    )


def update_consultation_results(
    db: Session,
    consultation_id: str,
    extracted_info: dict = None,
    retrieved_docs: list = None,
    final_recommendation: dict = None,
):
    db_consultation = (
        db.query(models.Consultation)
        .filter(models.Consultation.id == consultation_id)
        .first()
    )
    if db_consultation:
        if extracted_info:
            db_consultation.extracted_info_json = extracted_info
        if retrieved_docs:
            db_consultation.retrieved_docs_summary_json = retrieved_docs
        if final_recommendation:
            db_consultation.final_recommendation_json = final_recommendation
        db.commit()
        db.refresh(db_consultation)
        return db_consultation
    return None


# Legacy alias
def update_consultation_session_results(
    db: Session,
    session_uuid: str,
    extracted_info: dict = None,
    retrieved_docs: list = None,
    final_recommendation: dict = None,
):
    return update_consultation_results(
        db=db,
        consultation_id=session_uuid,
        extracted_info=extracted_info,
        retrieved_docs=retrieved_docs,
        final_recommendation=final_recommendation,
    )


def get_patient_consultation_history(
    db: Session, patient_id: str, limit: int = 5
) -> list[models.Consultation]:
    return (
        db.query(models.Consultation)
        .filter(models.Consultation.patient_id == patient_id)
        .order_by(models.Consultation.started_at.desc())
        .limit(limit)
        .all()
    )
