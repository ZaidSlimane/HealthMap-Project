"""Feature engineering pipeline for the Bed Occupancy Prediction ML Service.

Transforms raw admission records into 34-feature vectors expected by the XGBoost model.
The model uses pre-encoded categorical features (integers), temporal features derived
from the admission datetime, and clinical volume/intensity metrics.
"""

from datetime import datetime


def extract_temporal_features(admission_datetime: datetime) -> dict:
    """Extract temporal features from an admission datetime.

    Args:
        admission_datetime: The datetime of patient admission.

    Returns:
        A dict with temporal keys matching the model's expected feature names.
    """
    day_of_week = admission_datetime.weekday()  # 0=Monday, 6=Sunday
    return {
        "admit_hour": admission_datetime.hour,
        "admit_day_of_week": day_of_week,
        "admit_month": admission_datetime.month,
        "admit_day_of_month": admission_datetime.day,
        "is_weekend": 1 if day_of_week >= 5 else 0,
    }


def encode_categorical(value, mapping: dict) -> int:
    """Encode a categorical value to its integer mapping, with 0 as fallback.

    Args:
        value: The categorical string value (e.g. "M", "F", service name),
               or an already-encoded integer.
        mapping: A dict mapping string values to integer codes.

    Returns:
        The mapped integer if value is found, the value itself if already an int,
        otherwise 0.
    """
    if isinstance(value, int):
        return value
    return mapping.get(value, 0)


def get_season(month: int) -> str:
    """Get the season name from a month number."""
    if month in (12, 1, 2):
        return "Winter"
    elif month in (3, 4, 5):
        return "Spring"
    elif month in (6, 7, 8):
        return "Summer"
    else:
        return "Fall"


def get_period(hour: int) -> str:
    """Get the time period from an hour."""
    if 6 <= hour < 12:
        return "Morning"
    elif 12 <= hour < 18:
        return "Afternoon"
    elif 18 <= hour < 22:
        return "Evening"
    else:
        return "Night"


def compute_los(admission_datetime: datetime, now: datetime) -> float:
    """Compute the length of stay so far in fractional days.

    Args:
        admission_datetime: The datetime of patient admission.
        now: The current datetime.

    Returns:
        Elapsed fractional days since admission. Returns 0.5 when the admission
        is on the current calendar day and elapsed time is less than 1 hour.
        Result is never negative (clamped to 0.5 minimum).
    """
    # Strip timezone info to avoid naive/aware comparison issues
    if admission_datetime.tzinfo is not None:
        admission_datetime = admission_datetime.replace(tzinfo=None)
    if now.tzinfo is not None:
        now = now.replace(tzinfo=None)

    elapsed_seconds = (now - admission_datetime).total_seconds()
    elapsed_days = elapsed_seconds / 86400.0

    # Same calendar day and less than 1 hour elapsed
    same_day = admission_datetime.date() == now.date()
    less_than_one_hour = elapsed_seconds < 3600

    if same_day and less_than_one_hour:
        return 0.5

    # Clamp to 0.5 minimum if negative
    if elapsed_days < 0:
        return 0.5

    return elapsed_days


def build_feature_vector(
    raw: dict,
    mapping: dict,
    feature_list: list,
    now: datetime = None,
) -> dict:
    """Assemble a complete 34-feature vector from raw admission data.

    The model expects these 34 features (in order from model_features.txt):
      age, gender_encoded, marital_status_encoded, nationality_encoded,
      mode_encoded, service_name_encoded,
      admit_hour, admit_day_of_week, admit_month, admit_day_of_month,
      is_weekend, admit_season_encoded, admit_period_encoded,
      is_urgent, is_elective, has_triage, has_death,
      has_icu_stay, n_icu_stays, icu_los_total, icu_los_max,
      n_movements, n_rooms, n_service_changes,
      n_diagnoses, n_performed_procedures,
      n_labo_items, n_abnormal_results,
      n_prescriptions, n_unique_medications,
      n_vital_signs, n_surgical_procedures,
      lab_per_day, rx_per_day

    Args:
        raw: Raw admission data containing keys like admission_datetime (ISO str),
             gender, service_name, n_labo_items, n_prescriptions, and other features.
        mapping: Dict of categorical mappings from mapping.json.
        feature_list: Ordered list of 34 feature names from model_features.txt.
        now: Current datetime (defaults to datetime.now() if not provided).

    Returns:
        A dict with keys matching feature_list in order, with 0 substituted
        for any NULL/missing value.
    """
    if now is None:
        now = datetime.now()

    # Parse admission_datetime from ISO string
    admission_dt_str = raw.get("admission_datetime", "")
    try:
        admission_dt = datetime.fromisoformat(admission_dt_str)
        # Strip timezone info for consistent handling
        if admission_dt.tzinfo is not None:
            admission_dt = admission_dt.replace(tzinfo=None)
    except (ValueError, TypeError):
        admission_dt = now

    # Extract temporal features
    temporal = extract_temporal_features(admission_dt)

    # Derive season and period from temporal data
    season = get_season(admission_dt.month)
    period = get_period(admission_dt.hour)

    # Encode categorical features using mapping.json
    gender_encoded = encode_categorical(
        raw.get("gender", ""), mapping.get("gender", {})
    )
    marital_status_encoded = encode_categorical(
        raw.get("marital_status", ""), mapping.get("marital_status", {})
    )
    nationality_encoded = encode_categorical(
        raw.get("nationality", ""), mapping.get("nationality", {})
    )
    mode_encoded = encode_categorical(
        raw.get("mode", ""), mapping.get("mode", {})
    )
    service_name_encoded = encode_categorical(
        raw.get("service_name", ""), mapping.get("service_name", {})
    )
    admit_season_encoded = encode_categorical(
        raw.get("admit_season", season), mapping.get("admit_season", {})
    )
    admit_period_encoded = encode_categorical(
        raw.get("admit_period", period), mapping.get("admit_period", {})
    )

    # Compute LOS so far for rate calculations
    los_so_far_days = compute_los(admission_dt, now)

    # Get counts (default to 0 for missing/None)
    n_labo_items = raw.get("n_labo_items") or 0
    n_prescriptions = raw.get("n_prescriptions") or 0

    # Calculate rate features
    lab_per_day = n_labo_items / los_so_far_days if los_so_far_days > 0 else 0.0
    rx_per_day = n_prescriptions / los_so_far_days if los_so_far_days > 0 else 0.0

    # Build the computed features dict
    computed = {
        # Demographics
        "age": raw.get("age") or 0,
        "gender_encoded": gender_encoded,
        "marital_status_encoded": marital_status_encoded,
        "nationality_encoded": nationality_encoded,
        # Admission context
        "mode_encoded": mode_encoded,
        "service_name_encoded": service_name_encoded,
        # Temporal
        **temporal,
        "admit_season_encoded": admit_season_encoded,
        "admit_period_encoded": admit_period_encoded,
        # Clinical indicators
        "is_urgent": raw.get("is_urgent") or 0,
        "is_elective": raw.get("is_elective") or 0,
        "has_triage": raw.get("has_triage") or 0,
        "has_death": raw.get("has_death") or 0,
        "has_icu_stay": raw.get("has_icu_stay") or 0,
        "n_icu_stays": raw.get("n_icu_stays") or 0,
        "icu_los_total": raw.get("icu_los_total") or 0,
        "icu_los_max": raw.get("icu_los_max") or 0,
        # Operational complexity
        "n_movements": raw.get("n_movements") or 0,
        "n_rooms": raw.get("n_rooms") or 0,
        "n_service_changes": raw.get("n_service_changes") or 0,
        # Clinical volume
        "n_diagnoses": raw.get("n_diagnoses") or 0,
        "n_performed_procedures": raw.get("n_performed_procedures") or 0,
        "n_labo_items": n_labo_items,
        "n_abnormal_results": raw.get("n_abnormal_results") or 0,
        "n_prescriptions": n_prescriptions,
        "n_unique_medications": raw.get("n_unique_medications") or 0,
        "n_vital_signs": raw.get("n_vital_signs") or 0,
        "n_surgical_procedures": raw.get("n_surgical_procedures") or 0,
        # Intensity ratios
        "lab_per_day": lab_per_day,
        "rx_per_day": rx_per_day,
    }

    # Assemble final feature vector in the order of feature_list
    feature_vector = {}
    for feature_name in feature_list:
        if feature_name in computed:
            value = computed[feature_name]
        else:
            value = raw.get(feature_name)

        # Substitute 0 for any NULL/None/missing value
        if value is None:
            value = 0

        feature_vector[feature_name] = value

    return feature_vector
