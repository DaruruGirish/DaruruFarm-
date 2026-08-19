import os
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

# --------------------------------------------------
# Path configuration
# --------------------------------------------------

current_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(current_dir, "training_data.csv")
if not os.path.exists(csv_path):
    # Fallback to dataset file if named pomegranate_disease_prediction_dataset.csv
    alt_csv = os.path.join(current_dir, "pomegranate_disease_prediction_dataset.csv")
    if os.path.exists(alt_csv):
        csv_path = alt_csv

# --------------------------------------------------
# Load training data
# --------------------------------------------------

df = pd.read_csv(csv_path)


# --------------------------------------------------
# Features
# --------------------------------------------------

features = [
    "rainfall_mm",
    "humidity",
    "temperature",
    "recent_disease_count",
    "recent_high_severity_count",
    "irrigation_liters",
    "pesticide_spray_count",
    "disease_log_count",
    "pest_inspection_count"
]

X = df[features]
y = df["disease_risk"]


# --------------------------------------------------
# Train / test split
# --------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


# --------------------------------------------------
# Model
# --------------------------------------------------

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    random_state=42,
    class_weight="balanced"
)

model.fit(X_train, y_train)


# --------------------------------------------------
# Evaluation
# --------------------------------------------------

predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("Accuracy:", accuracy)

print(
    classification_report(
        y_test,
        predictions,
        target_names=["Low Risk", "High Risk"]
    )
)


# --------------------------------------------------
# Save model
# --------------------------------------------------

model_output_path = os.path.join(current_dir, "model.pkl")

joblib.dump(
    {
        "model": model,
        "features": features
    },
    model_output_path
)

print("Model saved successfully.")
