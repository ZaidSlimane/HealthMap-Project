"""XGBoost inference and occupancy aggregation for the Bed Occupancy Prediction ML Service.

Provides functions to:
- Run LOS predictions through the XGBoost model
- Compute predicted discharge dates from admission datetimes and predicted LOS
- Aggregate discharge dates into a 30-day occupancy forecast
"""

from datetime import date, datetime, timedelta

import pandas as pd

from schemas import ForecastDay


def predict_los(model, feature_vectors: list[dict]) -> list[float]:
    """Pass each feature vector through the XGBoost model to obtain predicted LOS in days.

    Args:
        model: A trained XGBoost model (loaded via joblib) with a .predict() method.
        feature_vectors: A list of dicts, each containing the 34 model features for one patient.

    Returns:
        A list of predicted LOS values (floats) in the same order as the input vectors.
    """
    if not feature_vectors:
        return []

    df = pd.DataFrame(feature_vectors)
    predictions = model.predict(df)
    return [float(p) for p in predictions]


def compute_discharge_dates(
    admission_datetimes: list[datetime], los_days: list[float]
) -> list[datetime]:
    """Calculate predicted discharge dates from admission datetimes and predicted LOS.

    Args:
        admission_datetimes: List of admission datetime objects.
        los_days: List of predicted LOS in fractional days (same length as admission_datetimes).

    Returns:
        A list of predicted discharge datetimes, where each is
        admission_datetime + timedelta(days=los).
    """
    return [
        admission_dt + timedelta(days=los)
        for admission_dt, los in zip(admission_datetimes, los_days)
    ]


def aggregate_occupancy(
    discharge_dates: list[datetime], service_capacity: int, today: date
) -> list[ForecastDay]:
    """Aggregate predicted discharge dates into a 30-day occupancy forecast.

    For each of the 30 forecast days (today+1 through today+30), counts the number
    of patients whose predicted discharge date is strictly after that day, then
    computes the occupancy percentage relative to service capacity.

    Args:
        discharge_dates: List of predicted discharge datetimes for all patients.
        service_capacity: Total number of beds in the service.
        today: The current date (forecast starts from today+1).

    Returns:
        A list of 30 ForecastDay entries with day (1-30), date (ISO string),
        and occupancy_pct (rounded to 2 decimal places).
    """
    forecast: list[ForecastDay] = []

    for day_offset in range(1, 31):
        forecast_date = today + timedelta(days=day_offset)
        # Compare discharge datetimes against the start of the forecast day
        day_start = datetime(forecast_date.year, forecast_date.month, forecast_date.day)

        # Count patients whose discharge date is strictly after this day
        # Strip timezone info from discharge dates for consistent comparison
        count = sum(
            1 for d in discharge_dates
            if (d.replace(tzinfo=None) if d.tzinfo else d) > day_start
        )

        # Compute occupancy percentage
        if service_capacity == 0:
            occupancy_pct = 0.0
        else:
            occupancy_pct = round((count / service_capacity) * 100, 2)

        forecast.append(
            ForecastDay(
                day=day_offset,
                date=forecast_date.isoformat(),
                occupancy_pct=occupancy_pct,
            )
        )

    return forecast
