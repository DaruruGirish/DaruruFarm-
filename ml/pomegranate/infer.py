"""Pomegranate fruit pipeline: DenseNet121 + Grad-CAM++ + HBDS + RAG.

Authors' inference: ARR-2023 prediction-checkpoint.py + chatbot-checkpoint.py
"""

from __future__ import annotations

import argparse
import json
import os
import pickle
import sys
import warnings
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
warnings.filterwarnings("ignore")

import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image

ROOT = Path(__file__).resolve().parent
MODELS = ROOT / "models"
CLASS_NAMES = [
    "Alternaria",
    "Anthracnose",
    "Bacterial_Blight",
    "Cercospora",
    "Healthy",
]
GRADCAM_LAYER = "conv5_block16_concat"

_model = None
_feature_extractor = None
_healthy_mean = None
_healthy_std = None
_scaler_dict = None
_gmm_dict = None


def _require(path: Path, label: str) -> Path:
    if not path.exists():
        raise FileNotFoundError(f"Missing {label}: {path}")
    return path


def load_artifacts():
    global _model, _feature_extractor, _healthy_mean, _healthy_std, _scaler_dict, _gmm_dict
    if _model is not None:
        return
    _model = load_model(str(_require(MODELS / "DenseNet_Model.keras", "DenseNet121 checkpoint")), compile=False)
    _feature_extractor = load_model(
        str(_require(MODELS / "feature_extractor.keras", "HBDS feature extractor")),
        compile=False,
    )
    _healthy_mean = np.load(str(_require(MODELS / "healthy_mean.npy", "healthy_mean.npy")))
    _healthy_std = np.load(str(_require(MODELS / "healthy_std.npy", "healthy_std.npy")))
    with open(_require(MODELS / "scaler_dict.pkl", "scaler_dict.pkl"), "rb") as f:
        _scaler_dict = pickle.load(f)
    with open(_require(MODELS / "gmm_dict.pkl", "gmm_dict.pkl"), "rb") as f:
        _gmm_dict = pickle.load(f)


def grad_cam_plus_plus(keras_model, img_array, layer_name=GRADCAM_LAYER):
    grad_model = tf.keras.Model(
        inputs=keras_model.input,
        outputs=[keras_model.get_layer(layer_name).output, keras_model.output],
    )
    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(np.expand_dims(img_array / 255.0, axis=0))
        pred_index = tf.argmax(predictions[0])
        loss = predictions[:, pred_index]
    grads = tape.gradient(loss, conv_outputs)[0]
    weights = tf.reduce_mean(grads, axis=(0, 1))
    cam = tf.reduce_sum(tf.multiply(conv_outputs[0], weights), axis=-1).numpy()
    cam = np.maximum(cam, 0)
    cam = cam / (np.max(cam) + 1e-8)
    return cv2.resize(cam, (img_array.shape[1], img_array.shape[0]))


def overlay_gradcam(original_img, heatmap):
    heatmap_color = cv2.applyColorMap(np.uint8(255 * heatmap), cv2.COLORMAP_JET)
    return cv2.addWeighted(cv2.cvtColor(original_img, cv2.COLOR_RGB2BGR), 0.6, heatmap_color, 0.4, 0)


def compute_severity_score(img_array, roi_mask):
    roi_bool = (roi_mask > 0).astype(np.float32)
    masked_img = img_array * np.expand_dims(roi_bool, axis=-1)
    masked_img = masked_img / 255.0
    masked_img = np.expand_dims(masked_img, axis=0)
    roi_features = _feature_extractor.predict(masked_img, verbose=0)[0]
    return float(np.sqrt(np.sum(((roi_features - _healthy_mean) ** 2) / (_healthy_std ** 2))))


def hbds_severity(predicted_class, img_array):
    heatmap = grad_cam_plus_plus(_model, img_array)
    heatmap_8bit = (heatmap * 255).astype(np.uint8)
    _, binary_mask = cv2.threshold(heatmap_8bit, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    raw_score = compute_severity_score(img_array, binary_mask)
    scaler = _scaler_dict[predicted_class]
    normalized_score = float(scaler.transform([[raw_score]])[0][0] * 100)
    gmm = _gmm_dict[predicted_class]
    cluster = int(gmm.predict([[normalized_score]])[0])
    means = gmm.means_.flatten()
    order = np.argsort(means)
    severity_mapping = {int(order[0]): "LOW", int(order[1]): "MEDIUM", int(order[2]): "HIGH"}
    return severity_mapping[cluster], normalized_score, heatmap


def empty_recommendations(explanation: str):
    return {
        "explanation": explanation,
        "immediateActions": [],
        "treatmentOptions": [],
        "bestPractices": [],
        "monitoring": [],
    }


def run_pipeline(image_path: str, heatmap_dir: str | None = None) -> dict:
    load_artifacts()
    img = image.load_img(image_path, target_size=(224, 224))
    img_array = image.img_to_array(img).astype(np.uint8)
    img_input = np.expand_dims(img_array / 255.0, axis=0)
    pred_probs = _model.predict(img_input, verbose=0)[0]
    pred_idx = int(np.argmax(pred_probs))
    disease = CLASS_NAMES[pred_idx]
    confidence = float(pred_probs[pred_idx])

    heatmap_name = None
    severity = None
    if disease != "Healthy":
        severity, _score, heatmap = hbds_severity(disease, img_array)
        if heatmap_dir:
            os.makedirs(heatmap_dir, exist_ok=True)
            stem = Path(image_path).stem
            heatmap_name = f"gradcam_{stem}.jpg"
            out_path = Path(heatmap_dir) / heatmap_name
            cv2.imwrite(str(out_path), overlay_gradcam(img_array, heatmap))

    # RAG + LLM recommendations disabled for now; schema kept empty for API compatibility.
    recommendations = empty_recommendations("")

    return {
        "disease": disease,
        "confidence": round(confidence, 4),
        "severity": severity,
        "heatmap": heatmap_name,
        "recommendations": recommendations,
        "classes": CLASS_NAMES,
        "classProbabilities": {
            name: round(float(pred_probs[i]), 4) for i, name in enumerate(CLASS_NAMES)
        },
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("image")
    parser.add_argument("--heatmap-dir", default="")
    args = parser.parse_args()
    try:
        result = run_pipeline(args.image, args.heatmap_dir or None)
        print(json.dumps(result))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
