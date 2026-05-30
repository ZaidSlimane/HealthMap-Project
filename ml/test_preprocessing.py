"""Unit tests for ml/preprocessing.py — feature engineering functions."""

from datetime import datetime, timedelta

from preprocessing import (
    build_feature_vector,
    compute_los,
    encode_categorical,
    extract_temporal_features,
)

# --- Feature list matching model_features.txt ---
FEATURE_LIST = [
    "admission_hour", "admission_day", "admission_month", "admission_year",
    "admission_dayofweek", "admission_weekofyear", "admission_quarter",
    "gender", "service_name", "los_so_far_days", "n_labo_items",
    "n_prescriptions", "lab_per_day", "rx_per_day", "age", "weight",
    "height", "bmi", "blood_pressure_systolic", "blood_pressure_diastolic",
    "heart_rate", "temperature", "oxygen_saturation", "respiratory_rate",
    "hemoglobin", "white_blood_cell_count", "platelet_count", "creatinine",
    "glucose", "sodium", "potassium", "previous_admissions_count",
    "comorbidity_count", "surgical_flag",
]

MAPPING = {
    "gender": {"M": 1, "F": 2},
    "service_name": {"Cardiology": 3, "Neurology": 5},
}


class TestExtractTemporalFeatures:
    def test_basic_extraction(self):
        dt = datetime(2025, 3, 15, 14, 30, 0)  # Saturday, week 11, Q1
        result = extract_temporal_features(dt)

        assert result["admission_hour"] == 14
        assert result["admission_day"] == 15
        assert result["admission_month"] == 3
        assert result["admission_year"] == 2025
        assert result["admission_dayofweek"] == 5  # Saturday = 5
        assert result["admission_weekofyear"] == 11
        assert result["admission_quarter"] == 1

    def test_all_7_keys_present(self):
        dt = datetime(2024, 6, 1, 0, 0, 0)
        result = extract_temporal_features(dt)
        expected_keys = {
            "admission_hour", "admission_day", "admission_month",
            "admission_year", "admission_dayofweek", "admission_weekofyear",
            "admission_quarter",
        }
        assert set(result.keys()) == expected_keys

    def test_quarter_boundaries(self):
        assert extract_temporal_features(datetime(2025, 1, 1))["admission_quarter"] == 1
        assert extract_temporal_features(datetime(2025, 3, 31))["admission_quarter"] == 1
        assert extract_temporal_features(datetime(2025, 4, 1))["admission_quarter"] == 2
        assert extract_temporal_features(datetime(2025, 7, 1))["admission_quarter"] == 3
        assert extract_temporal_features(datetime(2025, 10, 1))["admission_quarter"] == 4
        assert extract_temporal_features(datetime(2025, 12, 31))["admission_quarter"] == 4


class TestEncodeCategorical:
    def test_value_in_mapping(self):
        assert encode_categorical("M", {"M": 1, "F": 2}) == 1
        assert encode_categorical("F", {"M": 1, "F": 2}) == 2

    def test_value_not_in_mapping(self):
        assert encode_categorical("X", {"M": 1, "F": 2}) == 0

    def test_empty_mapping(self):
        assert encode_categorical("anything", {}) == 0

    def test_empty_value(self):
        assert encode_categorical("", {"M": 1, "F": 2}) == 0


class TestComputeLos:
    def test_multi_day_stay(self):
        admission = datetime(2025, 1, 10, 8, 0, 0)
        now = datetime(2025, 1, 12, 8, 0, 0)
        result = compute_los(admission, now)
        assert abs(result - 2.0) < 1e-9

    def test_same_day_less_than_one_hour(self):
        admission = datetime(2025, 1, 15, 10, 0, 0)
        now = datetime(2025, 1, 15, 10, 30, 0)  # 30 minutes later
        result = compute_los(admission, now)
        assert result == 0.5

    def test_same_day_more_than_one_hour(self):
        admission = datetime(2025, 1, 15, 8, 0, 0)
        now = datetime(2025, 1, 15, 10, 0, 0)  # 2 hours later
        result = compute_los(admission, now)
        expected = 2 * 3600 / 86400.0
        assert abs(result - expected) < 1e-9

    def test_negative_elapsed_returns_half(self):
        admission = datetime(2025, 1, 15, 10, 0, 0)
        now = datetime(2025, 1, 14, 10, 0, 0)  # now is before admission
        result = compute_los(admission, now)
        assert result == 0.5

    def test_fractional_days(self):
        admission = datetime(2025, 1, 10, 0, 0, 0)
        now = datetime(2025, 1, 10, 12, 0, 0)  # 12 hours = 0.5 days, same day but > 1h
        result = compute_los(admission, now)
        assert abs(result - 0.5) < 1e-9


class TestBuildFeatureVector:
    def test_produces_all_34_features(self):
        raw = {
            "admission_datetime": "2025-01-15T08:30:00",
            "gender": "M",
            "service_name": "Cardiology",
            "n_labo_items": 4,
            "n_prescriptions": 2,
            "age": 55,
        }
        now = datetime(2025, 1, 17, 8, 30, 0)
        result = build_feature_vector(raw, MAPPING, FEATURE_LIST, now=now)

        assert len(result) == 34
        assert list(result.keys()) == FEATURE_LIST

    def test_temporal_features_correct(self):
        raw = {"admission_datetime": "2025-03-15T14:30:00", "gender": "F", "service_name": "Neurology"}
        now = datetime(2025, 3, 17, 14, 30, 0)
        result = build_feature_vector(raw, MAPPING, FEATURE_LIST, now=now)

        assert result["admission_hour"] == 14
        assert result["admission_day"] == 15
        assert result["admission_month"] == 3
        assert result["admission_year"] == 2025
        assert result["admission_dayofweek"] == 5  # Saturday
        assert result["admission_quarter"] == 1

    def test_categorical_encoding(self):
        raw = {"admission_datetime": "2025-01-15T08:30:00", "gender": "F", "service_name": "Cardiology"}
        now = datetime(2025, 1, 17, 8, 30, 0)
        result = build_feature_vector(raw, MAPPING, FEATURE_LIST, now=now)

        assert result["gender"] == 2
        assert result["service_name"] == 3

    def test_categorical_fallback(self):
        raw = {"admission_datetime": "2025-01-15T08:30:00", "gender": "X", "service_name": "Unknown"}
        now = datetime(2025, 1, 17, 8, 30, 0)
        result = build_feature_vector(raw, MAPPING, FEATURE_LIST, now=now)

        assert result["gender"] == 0
        assert result["service_name"] == 0

    def test_los_and_rate_features(self):
        raw = {
            "admission_datetime": "2025-01-15T08:30:00",
            "gender": "M",
            "service_name": "Cardiology",
            "n_labo_items": 4,
            "n_prescriptions": 2,
        }
        now = datetime(2025, 1, 17, 8, 30, 0)  # 2 days later
        result = build_feature_vector(raw, MAPPING, FEATURE_LIST, now=now)

        assert abs(result["los_so_far_days"] - 2.0) < 1e-9
        assert abs(result["lab_per_day"] - 2.0) < 1e-9  # 4 / 2
        assert abs(result["rx_per_day"] - 1.0) < 1e-9   # 2 / 2

    def test_null_values_substituted_with_zero(self):
        raw = {
            "admission_datetime": "2025-01-15T08:30:00",
            "gender": "M",
            "service_name": "Cardiology",
            "n_labo_items": None,
            "n_prescriptions": None,
            "age": None,
        }
        now = datetime(2025, 1, 17, 8, 30, 0)
        result = build_feature_vector(raw, MAPPING, FEATURE_LIST, now=now)

        assert result["n_labo_items"] == 0
        assert result["n_prescriptions"] == 0
        assert result["age"] == 0
        # No None values in the output
        assert all(v is not None for v in result.values())

    def test_missing_keys_default_to_zero(self):
        raw = {
            "admission_datetime": "2025-01-15T08:30:00",
            "gender": "M",
            "service_name": "Cardiology",
        }
        now = datetime(2025, 1, 17, 8, 30, 0)
        result = build_feature_vector(raw, MAPPING, FEATURE_LIST, now=now)

        # Features not in raw and not computed should be 0
        assert result["age"] == 0
        assert result["weight"] == 0
        assert result["surgical_flag"] == 0
