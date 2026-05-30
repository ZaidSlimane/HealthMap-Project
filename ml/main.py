"""
FastAPI ML Service for bed occupancy prediction.

Loads XGBoost model artifacts at startup and exposes a /health endpoint
and a POST /predict/occupancy endpoint for bed occupancy forecasting.
"""

import json
import logging
import sys
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path
from typing import Any

import joblib
from fastapi import FastAPI, Request

from predictor import aggregate_occupancy, compute_discharge_dates, predict_los
from preprocessing import build_feature_vector
from schemas import ForecastDay, OccupancyRequest

logger = logging.getLogger(__name__)

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"


@dataclass
class AppState:
    """Holds loaded ML artifacts for the application lifetime."""

    model: Any = None
    mapping: dict = field(default_factory=dict)
    feature_list: list[str] = field(default_factory=list)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model artifacts at startup; exit if any file is missing."""
    state = AppState()

    model_path = ARTIFACTS_DIR / "model_xgboost_occupancy.pkl"
    mapping_path = ARTIFACTS_DIR / "mapping.json"
    features_path = ARTIFACTS_DIR / "model_features.txt"

    # Load XGBoost model
    if not model_path.exists():
        logger.error("Artifact missing: %s", model_path)
        sys.exit(1)
    try:
        state.model = joblib.load(model_path)
    except Exception as exc:
        logger.error("Failed to load model from %s: %s", model_path, exc)
        sys.exit(1)

    # Load mapping.json
    if not mapping_path.exists():
        logger.error("Artifact missing: %s", mapping_path)
        sys.exit(1)
    try:
        with open(mapping_path, "r", encoding="utf-8") as f:
            state.mapping = json.load(f)
    except Exception as exc:
        logger.error("Failed to load mapping from %s: %s", mapping_path, exc)
        sys.exit(1)

    # Load model_features.txt
    if not features_path.exists():
        logger.error("Artifact missing: %s", features_path)
        sys.exit(1)
    try:
        with open(features_path, "r", encoding="utf-8") as f:
            state.feature_list = [
                line.strip() for line in f if line.strip()
            ]
    except Exception as exc:
        logger.error("Failed to load feature list from %s: %s", features_path, exc)
        sys.exit(1)

    logger.info(
        "Artifacts loaded: model=%s, mapping keys=%d, features=%d",
        type(state.model).__name__,
        len(state.mapping),
        len(state.feature_list),
    )

    app.state.app_state = state
    yield


app = FastAPI(title="HealthMap ML Service", lifespan=lifespan)


@app.get("/health")
async def health():
    """Return OK status when model is loaded and ready."""
    return {"status": "ok"}


@app.post("/predict/occupancy", response_model=list[ForecastDay])
async def predict_occupancy(request: Request, body: OccupancyRequest):
    """Accept patient features, predict LOS, and return 30-day occupancy forecast."""
    state: AppState = request.app.state.app_state

    # Build feature vectors for each patient using the preprocessing pipeline
    feature_vectors: list[dict] = []
    admission_datetimes: list[datetime] = []

    for patient in body.patients:
        # Build a raw dict from the patient's fields
        raw = patient.model_dump()

        # Call preprocessing pipeline to assemble the feature vector
        feature_vector = build_feature_vector(raw, state.mapping, state.feature_list)
        feature_vectors.append(feature_vector)

        # Parse admission datetime for discharge date computation
        # Strip timezone info for consistent naive datetime handling
        parsed_dt = datetime.fromisoformat(patient.admission_datetime)
        if parsed_dt.tzinfo is not None:
            parsed_dt = parsed_dt.replace(tzinfo=None)
        admission_datetimes.append(parsed_dt)

    # Run XGBoost inference to predict LOS for each patient
    los_predictions = predict_los(state.model, feature_vectors)

    # Compute predicted discharge dates
    discharge_dates = compute_discharge_dates(admission_datetimes, los_predictions)

    # Aggregate into 30-day occupancy forecast
    forecast = aggregate_occupancy(discharge_dates, body.service_capacity, date.today())

    return forecast
