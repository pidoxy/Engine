# aidcare_pipeline/burnout_calculator.py
"""
Cognitive Load Score (CLS) Calculator — AidCare Copilot
========================================================
Computes a 0-100 burnout risk score for a doctor based on:
  - Volume     : patients seen this shift (max 30 pts)
  - Complexity : average consultation complexity (max 30 pts)
  - Duration   : hours the shift has been active (max 20 pts)
  - Consecutive: number of recent shifts in past 24 h (max 20 pts)

Status thresholds:
  green  → CLS 0-39   (safe)
  amber  → CLS 40-69  (moderate — consider a break)
  red    → CLS 70-100 (high — relief recommended)
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from . import copilot_crud as crud


# ---------------------------------------------------------------------------
# Pure computation helpers
# ---------------------------------------------------------------------------

def _volume_score(patients_seen: int) -> int:
    """30 pts at 10 patients; capped at 30."""
    return min(30, patients_seen * 3)


def _complexity_score(avg_complexity: float) -> int:
    """30 pts at avg_complexity = 5.0; linear."""
    return min(30, round((avg_complexity / 5.0) * 30))


def _duration_score(hours_active: float) -> int:
    """20 pts at 8 hours; capped at 20."""
    return min(20, round((hours_active / 8.0) * 20))


def _consecutive_score(recent_shift_count: int) -> int:
    """5 pts per shift in the past 24 h; capped at 20."""
    return min(20, recent_shift_count * 5)


def _status(cls: int) -> str:
    if cls >= 70:
        return "red"
    if cls >= 40:
        return "amber"
    return "green"


def _recommendation(cls: int, status: str) -> str:
    if status == "red":
        return (
            "⚠️ Critical cognitive load detected. "
            "This doctor should be relieved or given an immediate rest break. "
            "Consider redistributing patients urgently."
        )
    if status == "amber":
        return (
            "⚡ Moderate load. Consider a 15-minute break soon. "
            "Monitor closely — another busy hour could push into the red zone."
        )
    return (
        "✅ Cognitive load is within safe limits. "
        "Continue regular monitoring. Encourage hydration and short micro-breaks."
    )


# ---------------------------------------------------------------------------
# Main public function
# ---------------------------------------------------------------------------

def calculate_cls(
    db: Session,
    doctor_id_int: int,
    shift_id_int: int | None,
    consultations: list,          # list of Consultation ORM objects
    shift_start: datetime | None,
) -> dict:
    """
    Calculate the Cognitive Load Score for a doctor.

    Args:
        db             : Active SQLAlchemy session (used for consecutive-shift lookup).
        doctor_id_int  : Integer PK of the doctor.
        shift_id_int   : Integer PK of the active shift (None if no active shift).
        consultations  : List of Consultation ORM objects for this shift.
        shift_start    : datetime the current shift started (UTC-aware).

    Returns:
        dict with keys:
            cognitive_load_score, status, breakdown,
            patients_seen, hours_active, avg_complexity, recommendation
    """
    # ── 1. Patients seen ─────────────────────────────────────────────────────
    patients_seen = len(consultations)

    # ── 2. Average complexity ─────────────────────────────────────────────────
    if patients_seen > 0:
        avg_complexity = sum(
            (c.complexity_score or 1) for c in consultations
        ) / patients_seen
    else:
        avg_complexity = 0.0

    # ── 3. Hours active ──────────────────────────────────────────────────────
    if shift_start:
        now = datetime.now(timezone.utc)
        # Ensure shift_start is tz-aware
        if shift_start.tzinfo is None:
            shift_start = shift_start.replace(tzinfo=timezone.utc)
        hours_active = max(0.0, (now - shift_start).total_seconds() / 3600)
    else:
        hours_active = 0.0

    # ── 4. Consecutive recent shifts (past 24 h, excluding current) ──────────
    cutoff_24h = datetime.now(timezone.utc) - timedelta(hours=24)
    # Import here to avoid circular; copilot_models is already imported in crud
    from . import copilot_models as models
    recent_shifts = (
        db.query(models.Shift)
        .filter(
            models.Shift.doctor_id == doctor_id_int,
            models.Shift.shift_start >= cutoff_24h,
        )
        .all()
    )
    # Exclude the current active shift from the count
    recent_count = sum(
        1 for s in recent_shifts
        if (shift_id_int is None or s.id != shift_id_int) and not s.is_active
    )

    # ── 5. Component scores ───────────────────────────────────────────────────
    v_score = _volume_score(patients_seen)
    c_score = _complexity_score(avg_complexity)
    d_score = _duration_score(hours_active)
    q_score = _consecutive_score(recent_count)

    cls = v_score + c_score + d_score + q_score

    breakdown = {
        "volume":      v_score,
        "complexity":  c_score,
        "duration":    d_score,
        "consecutive": q_score,
    }

    status = _status(cls)
    recommendation = _recommendation(cls, status)

    print(
        f"CLS Calculation → doctor={doctor_id_int}, "
        f"patients={patients_seen}, avg_complexity={avg_complexity:.2f}, "
        f"hours={hours_active:.2f}, recent_shifts={recent_count}, "
        f"CLS={cls} [{status}]"
    )

    return {
        "cognitive_load_score": cls,
        "status":               status,
        "breakdown":            breakdown,
        "patients_seen":        patients_seen,
        "hours_active":         round(hours_active, 2),
        "avg_complexity":       round(avg_complexity, 2),
        "recommendation":       recommendation,
    }
