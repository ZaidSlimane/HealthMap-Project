"""
Train the XGBoost LOS prediction model and save artifacts.

This script replicates the training from bed_occupancy_model_executed2.ipynb.
Run from the project root: python ml/train_model.py
"""

import os
import sys

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

# Paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(PROJECT_ROOT, "healthmap-dataset-clean2.csv")
ARTIFACTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "artifacts")

# Feature columns (exactly as defined in the notebook)
FEATURE_COLS = [
    # Patient demographics
    'age', 'gender_encoded', 'marital_status_encoded', 'nationality_encoded',
    # Admission context
    'mode_encoded', 'service_name_encoded',
    # Temporal (when was the patient admitted)
    'admit_hour', 'admit_day_of_week', 'admit_month', 'admit_day_of_month',
    'is_weekend', 'admit_season_encoded', 'admit_period_encoded',
    # Clinical indicators
    'is_urgent', 'is_elective', 'has_triage', 'has_death',
    'has_icu_stay', 'n_icu_stays', 'icu_los_total', 'icu_los_max',
    # Operational complexity
    'n_movements', 'n_rooms', 'n_service_changes',
    # Clinical volume (how sick is the patient)
    'n_diagnoses', 'n_performed_procedures',
    'n_labo_items', 'n_abnormal_results',
    'n_prescriptions', 'n_unique_medications',
    'n_vital_signs', 'n_surgical_procedures',
    # Intensity ratios
    'lab_per_day', 'rx_per_day',
]

TARGET_COL = 'los_days'


def main():
    print(f"Loading dataset from: {DATASET_PATH}")
    if not os.path.exists(DATASET_PATH):
        print(f"ERROR: Dataset not found at {DATASET_PATH}")
        sys.exit(1)

    df = pd.read_csv(DATASET_PATH)
    print(f"Dataset: {df.shape[0]} rows x {df.shape[1]} columns")
    print(f"Missing values: {df.isnull().sum().sum()}")
    print(f"Services: {df['service_name'].nunique()} departments")
    print(f"Target (los_days): mean={df[TARGET_COL].mean():.2f}, median={df[TARGET_COL].median():.2f}")

    # Prepare features and target
    X = df[FEATURE_COLS].values
    y = df[TARGET_COL].values
    print(f"\nFeatures: {len(FEATURE_COLS)}")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"Training: {X_train.shape[0]} patients")
    print(f"Testing:  {X_test.shape[0]} patients")

    # Train XGBoost model (same hyperparameters as notebook)
    print("\nTraining XGBoost model...")
    model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42,
        verbosity=0
    )
    model.fit(X_train, y_train)
    print("Model trained successfully")

    # Evaluate
    y_pred = model.predict(X_test)
    y_pred = np.clip(y_pred, 0, None)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print(f"\n=== XGBoost LOS Prediction Results ===")
    print(f"  MAE:  {mae:.3f} days ({mae*24:.1f} hours)")
    print(f"  RMSE: {rmse:.3f} days")
    print(f"  R2:   {r2:.4f} (model explains {r2*100:.1f}% of variation)")

    # Save artifacts
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)

    model_path = os.path.join(ARTIFACTS_DIR, "model_xgboost_occupancy.pkl")
    joblib.dump(model, model_path)
    print(f"\nSaved model: {model_path}")

    features_path = os.path.join(ARTIFACTS_DIR, "model_features.txt")
    with open(features_path, 'w') as f:
        f.write('\n'.join(FEATURE_COLS))
    print(f"Saved features: {features_path}")

    # Generate mapping.json from the dataset's unique encoded values
    import json
    mapping = {}

    # Extract gender mapping
    if 'gender' in df.columns and 'gender_encoded' in df.columns:
        gender_map = df[['gender', 'gender_encoded']].drop_duplicates()
        mapping['gender'] = {str(row['gender']): int(row['gender_encoded']) for _, row in gender_map.iterrows()}

    # Extract service_name mapping
    if 'service_name' in df.columns and 'service_name_encoded' in df.columns:
        service_map = df[['service_name', 'service_name_encoded']].drop_duplicates()
        mapping['service_name'] = {str(row['service_name']): int(row['service_name_encoded']) for _, row in service_map.iterrows()}

    # Extract mode mapping
    if 'mode' in df.columns and 'mode_encoded' in df.columns:
        mode_map = df[['mode', 'mode_encoded']].drop_duplicates()
        mapping['mode'] = {str(row['mode']): int(row['mode_encoded']) for _, row in mode_map.iterrows()}

    # Extract marital_status mapping
    if 'marital_status' in df.columns and 'marital_status_encoded' in df.columns:
        ms_map = df[['marital_status', 'marital_status_encoded']].drop_duplicates()
        mapping['marital_status'] = {str(row['marital_status']): int(row['marital_status_encoded']) for _, row in ms_map.iterrows()}

    # Extract nationality mapping
    if 'nationality' in df.columns and 'nationality_encoded' in df.columns:
        nat_map = df[['nationality', 'nationality_encoded']].drop_duplicates()
        mapping['nationality'] = {str(row['nationality']): int(row['nationality_encoded']) for _, row in nat_map.iterrows()}

    # Extract admit_season mapping
    if 'admit_season' in df.columns and 'admit_season_encoded' in df.columns:
        season_map = df[['admit_season', 'admit_season_encoded']].drop_duplicates()
        mapping['admit_season'] = {str(row['admit_season']): int(row['admit_season_encoded']) for _, row in season_map.iterrows()}

    # Extract admit_period mapping
    if 'admit_period' in df.columns and 'admit_period_encoded' in df.columns:
        period_map = df[['admit_period', 'admit_period_encoded']].drop_duplicates()
        mapping['admit_period'] = {str(row['admit_period']): int(row['admit_period_encoded']) for _, row in period_map.iterrows()}

    mapping_path = os.path.join(ARTIFACTS_DIR, "mapping.json")
    with open(mapping_path, 'w') as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)
    print(f"Saved mapping: {mapping_path}")

    print("\n✓ All artifacts saved successfully!")


if __name__ == "__main__":
    main()
