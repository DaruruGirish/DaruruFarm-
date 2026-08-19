import os
import joblib
import pandas as pd


# --------------------------------------------------
# Load trained model
# --------------------------------------------------

current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "model.pkl") if os.path.exists(os.path.join(current_dir, "model.pkl")) else "model.pkl"

artifact = joblib.load(model_path)

model = artifact["model"]
features = artifact["features"]


def predict_disease_risk(data):

    df = pd.DataFrame([data])

    X = df[features]

    probability = model.predict_proba(X)[0][1]

    risk_percentage = round(probability * 100, 2)

    if risk_percentage >= 70:
        risk_level = "HIGH"
    elif risk_percentage >= 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "risk_percentage": risk_percentage,
        "risk_level": risk_level
    }


if __name__ == "__main__":

    sample = {
        "rainfall_mm": 85,
        "humidity": 82,
        "temperature": 28,
        "recent_disease_count": 2,
        "recent_high_severity_count": 1,
        "irrigation_liters": 1800,
        "pesticide_spray_count": 0,
        "disease_log_count": 3,
        "pest_inspection_count": 1
    }

    result = predict_disease_risk(sample)

    print(result)
