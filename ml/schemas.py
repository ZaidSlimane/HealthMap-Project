"""Pydantic request/response models for the Bed Occupancy Prediction ML Service."""

from typing import Union

from pydantic import BaseModel, Field


class PatientFeatures(BaseModel):
    """Input features for a single patient admission.

    Contains the admission datetime (for discharge date computation) and all 34
    model features. Features that may not be available at inference time default to 0.

    The model expects pre-encoded categorical values (integers). Laravel sends raw
    string values for categoricals; the preprocessing pipeline encodes them using
    mapping.json.
    """

    # Admission datetime for discharge date computation (not a model feature itself)
    admission_datetime: str = Field(
        ..., description="ISO datetime string of the admission (e.g. 2025-01-15T08:30:00)"
    )

    # --- Patient demographics (features 1-4) ---
    age: float = Field(default=0, ge=0)
    gender: Union[str, int] = Field(default=0, description="Raw string (M/F) or pre-encoded int")
    marital_status: Union[str, int] = Field(default=0, description="Raw string or pre-encoded int")
    nationality: Union[str, int] = Field(default=0, description="Raw string or pre-encoded int")

    # --- Admission context (features 5-6) ---
    mode: Union[str, int] = Field(default=0, description="Admission mode raw string or pre-encoded int")
    service_name: Union[str, int] = Field(default=0, description="Service name raw string or pre-encoded int")

    # --- Temporal features (features 7-13) ---
    admit_hour: int = Field(default=0, ge=0, le=23)
    admit_day_of_week: int = Field(default=0, ge=0, le=6)
    admit_month: int = Field(default=1, ge=1, le=12)
    admit_day_of_month: int = Field(default=1, ge=1, le=31)
    is_weekend: int = Field(default=0, ge=0, le=1)
    admit_season: Union[str, int] = Field(default=0, description="Season raw string or pre-encoded int")
    admit_period: Union[str, int] = Field(default=0, description="Period raw string or pre-encoded int")

    # --- Clinical indicators (features 14-21) ---
    is_urgent: int = Field(default=0, ge=0, le=1)
    is_elective: int = Field(default=0, ge=0, le=1)
    has_triage: int = Field(default=0, ge=0, le=1)
    has_death: int = Field(default=0, ge=0, le=1)
    has_icu_stay: int = Field(default=0, ge=0, le=1)
    n_icu_stays: int = Field(default=0, ge=0)
    icu_los_total: float = Field(default=0, ge=0)
    icu_los_max: float = Field(default=0, ge=0)

    # --- Operational complexity (features 22-24) ---
    n_movements: int = Field(default=0, ge=0)
    n_rooms: int = Field(default=0, ge=0)
    n_service_changes: int = Field(default=0, ge=0)

    # --- Clinical volume (features 25-32) ---
    n_diagnoses: int = Field(default=0, ge=0)
    n_performed_procedures: int = Field(default=0, ge=0)
    n_labo_items: int = Field(default=0, ge=0)
    n_abnormal_results: int = Field(default=0, ge=0)
    n_prescriptions: int = Field(default=0, ge=0)
    n_unique_medications: int = Field(default=0, ge=0)
    n_vital_signs: int = Field(default=0, ge=0)
    n_surgical_procedures: int = Field(default=0, ge=0)

    # --- Intensity ratios (features 33-34) ---
    lab_per_day: float = Field(default=0, ge=0)
    rx_per_day: float = Field(default=0, ge=0)


class OccupancyRequest(BaseModel):
    """Request body for POST /predict/occupancy."""

    patients: list[PatientFeatures] = Field(..., min_length=1)
    service_capacity: int = Field(..., gt=0)


class ForecastDay(BaseModel):
    """A single day entry in the 30-day occupancy forecast response."""

    day: int
    date: str
    occupancy_pct: float
