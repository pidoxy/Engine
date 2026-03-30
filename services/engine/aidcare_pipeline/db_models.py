import os
import uuid as uuid_lib
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base, engine


# --- Patient Model ---
# Mirrors Prisma Patient model (@@map("patients"))
# id is the UUID string primary key — matches Prisma's @id @default(uuid())
class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, index=True)
    first_name = Column(String(255), nullable=True)
    last_name = Column(String(255), nullable=True)
    phone_number = Column(String(50), nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    gender = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    organization_id = Column(String(36), nullable=True)
    created_by_id = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    documents = relationship(
        "PatientDocument", back_populates="patient",
        cascade="all, delete-orphan", lazy="selectin"
    )
    consultations = relationship(
        "Consultation", back_populates="patient",
        cascade="all, delete-orphan", lazy="selectin"
    )

    @property
    def full_name(self) -> str:
        parts = [p for p in [self.first_name, self.last_name] if p]
        return " ".join(parts) if parts else ""

    def __repr__(self):
        return f"<Patient(id='{self.id}', name='{self.full_name}')>"


# --- Patient Document Model ---
# Mirrors Prisma PatientDocument model (@@map("patient_documents"))
class PatientDocument(Base):
    __tablename__ = "patient_documents"

    id = Column(String(36), primary_key=True, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    consultation_id = Column(String(36), ForeignKey("consultations.id"), nullable=True)
    original_filename = Column(String(255), nullable=False)
    storage_path = Column(String(512), nullable=False)
    file_type = Column(String(100), nullable=True)
    extracted_text = Column(Text, nullable=True)
    processing_status = Column(String(50), default="queued", nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="documents")
    consultation = relationship("Consultation", back_populates="documents")

    def __repr__(self):
        return f"<PatientDocument(id='{self.id}', filename='{self.original_filename}')>"


# --- Consultation Model ---
# Mirrors Prisma Consultation model (@@map("consultations"))
# Replaces the old ConsultationSession model (was @@tablename "consultation_sessions")
class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(String(36), primary_key=True, index=True)
    title = Column(String(255), default="New Consultation")
    consultant_id = Column(String(36), nullable=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    mode = Column(String(50), nullable=False)  # 'CHW_TRIAGE' | 'CLINICAL_SUPPORT'
    is_active = Column(Boolean, default=True, nullable=False)

    # AI pipeline fields
    audio_file_path = Column(String(512), nullable=True)
    transcript_text = Column(Text, nullable=True)
    manual_context_input = Column(Text, nullable=True)
    extracted_info_json = Column(JSON, nullable=True)
    retrieved_docs_summary_json = Column(JSON, nullable=True)
    final_recommendation_json = Column(JSON, nullable=True)

    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    patient = relationship("Patient", back_populates="consultations")
    documents = relationship("PatientDocument", back_populates="consultation")

    def __repr__(self):
        return f"<Consultation(id='{self.id}', mode='{self.mode}')>"


# Alias for backward compatibility within the Engine codebase
ConsultationSession = Consultation


# Function to create tables (for initial setup — Prisma handles migrations in production)
def create_db_and_tables():
    print(f"Attempting to create database tables on engine: {engine.url}...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables checked/created successfully.")
    except Exception as e:
        print(f"Error creating database tables: {e}")
        print("Please ensure the database exists and the user has permissions.")
        print("DATABASE_URL used:", os.environ.get("DATABASE_URL"))


if __name__ == "__main__":
    print("Running db_models.py directly to create tables...")
    create_db_and_tables()
