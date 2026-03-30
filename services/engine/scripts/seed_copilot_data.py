#!/usr/bin/env python3
"""
Seed script — AidCare Copilot
==============================
Populates the database with 5 sample doctors and realistic consultation data
for the hackathon demo.

Usage:
    cd aidcare-backend
    python scripts/seed_copilot_data.py

Requires DATABASE_URL to be set in .env or environment.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from aidcare_pipeline.database import SessionLocal, engine
from aidcare_pipeline.copilot_models import Base, Doctor, Shift, Consultation, BurnoutScore
from aidcare_pipeline.burnout_calculator import calculate_cls
import aidcare_pipeline.copilot_crud as crud

# ── Create tables ────────────────────────────────────────────────────────────
print("Creating copilot tables...")
Base.metadata.create_all(bind=engine)
print("Tables ready.")

db: Session = SessionLocal()

try:
    # ── Check if already seeded ──────────────────────────────────────────────
    existing = db.query(Doctor).count()
    if existing > 0:
        print(f"Database already has {existing} doctors. Skipping seed.")
        sys.exit(0)

    # ── Seed doctors ─────────────────────────────────────────────────────────
    DOCTORS = [
        {
            "doctor_uuid": str(uuid.uuid4()),
            "full_name":   "Dr. Amaka Okafor",
            "specialty":   "General Medicine",
            "ward":        "Ward A",
            "hospital":    "General Hospital Lagos",
            "role":        "doctor",
        },
        {
            "doctor_uuid": str(uuid.uuid4()),
            "full_name":   "Dr. Emeka Nwosu",
            "specialty":   "Emergency Medicine",
            "ward":        "A&E",
            "hospital":    "General Hospital Lagos",
            "role":        "doctor",
        },
        {
            "doctor_uuid": str(uuid.uuid4()),
            "full_name":   "Dr. Fatima Usman",
            "specialty":   "Paediatrics",
            "ward":        "Paeds Ward",
            "hospital":    "General Hospital Lagos",
            "role":        "doctor",
        },
        {
            "doctor_uuid": str(uuid.uuid4()),
            "full_name":   "Dr. Chukwudi Eze",
            "specialty":   "Surgery",
            "ward":        "Surgical Ward",
            "hospital":    "General Hospital Lagos",
            "role":        "doctor",
        },
        {
            "doctor_uuid": str(uuid.uuid4()),
            "full_name":   "Dr. Ngozi Adeyemi",
            "specialty":   "Obstetrics & Gynaecology",
            "ward":        "Maternity",
            "hospital":    "General Hospital Lagos",
            "role":        "admin",
        },
    ]

    db_doctors = []
    for d in DOCTORS:
        doc = crud.create_doctor(
            db=db,
            doctor_uuid=d["doctor_uuid"],
            full_name=d["full_name"],
            specialty=d["specialty"],
            ward=d["ward"],
            hospital=d["hospital"],
            role=d["role"],
        )
        db_doctors.append(doc)
        print(f"  Created doctor: {doc.full_name} ({doc.role})")

    # ── Seed shifts + consultations for first 4 doctors ──────────────────────
    SAMPLE_CONSULTATIONS = [
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

    shift_start_base = datetime.now(timezone.utc) - timedelta(hours=6)

    for i, doc in enumerate(db_doctors[:4]):  # only non-admin doctors get seeded shifts
        shift_uuid = str(uuid.uuid4())
        db_shift = crud.start_shift(
            db=db,
            shift_uuid=shift_uuid,
            doctor_id_int=doc.id,
            ward=doc.ward or "General Ward",
        )
        print(f"  Started shift for {doc.full_name}")

        # Give each doctor 1–3 consultations from the sample set
        doc_consultations = SAMPLE_CONSULTATIONS[i:i + 2]
        for j, cons_data in enumerate(doc_consultations):
            cons_uuid = str(uuid.uuid4())
            crud.create_consultation(
                db=db,
                consultation_uuid=cons_uuid,
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
            print(f"    Consultation saved: {cons_data['patient_ref']} (complexity {cons_data['complexity_score']})")

        # Calculate and save burnout score
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
            score_uuid=str(uuid.uuid4()),
            doctor_id_int=doc.id,
            shift_id_int=db_shift.id,
            cls=cls_result["cognitive_load_score"],
            status=cls_result["status"],
            breakdown_dict=cls_result["breakdown"],
            patients_seen=cls_result["patients_seen"],
            hours_active=cls_result["hours_active"],
            avg_complexity=cls_result["avg_complexity"],
        )
        print(f"    CLS: {cls_result['cognitive_load_score']} ({cls_result['status']})")

    print("\n✅ Seed complete! Doctor list:")
    for d in db_doctors:
        print(f"   {d.full_name} (UUID: {d.doctor_uuid}) — {d.role}")

finally:
    db.close()
