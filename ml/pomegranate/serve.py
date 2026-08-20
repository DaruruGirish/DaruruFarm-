"""Warm pomegranate fruit inference server (models loaded once)."""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("OMP_NUM_THREADS", "4")
os.environ.setdefault("TF_NUM_INTRAOP_THREADS", "4")
os.environ.setdefault("TF_NUM_INTEROP_THREADS", "2")

from flask import Flask, jsonify, request

from infer import run_pipeline

app = Flask(__name__)
HEATMAP_DIR = Path(__file__).resolve().parent / "heatmaps"
HEATMAP_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "pomegranate-fruit-infer"})


@app.post("/analyze")
def analyze():
    payload = request.get_json(silent=True) or {}
    heatmap_dir = (
        request.form.get("heatmapDir")
        or payload.get("heatmapDir")
        or str(HEATMAP_DIR)
    )

    if "image" in request.files:
        upload = request.files["image"]
        suffix = Path(upload.filename or "fruit.jpg").suffix or ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            upload.save(tmp.name)
            image_path = tmp.name
        try:
            result = run_pipeline(image_path, heatmap_dir)
        finally:
            try:
                os.unlink(image_path)
            except OSError:
                pass
        return jsonify(result)

    image_path = payload.get("imagePath")
    if not image_path:
        return jsonify({"error": "Send multipart file field 'image' or JSON {imagePath}"}), 400
    result = run_pipeline(image_path, heatmap_dir)
    return jsonify(result)


if __name__ == "__main__":
    # Preload models at startup
    from infer import load_artifacts

    print("Loading DenseNet + HBDS artifacts...", flush=True)
    load_artifacts()
    host = os.environ.get("POMEGRANATE_INFER_HOST", "127.0.0.1").strip() or "127.0.0.1"
    port = int(os.environ.get("POMEGRANATE_INFER_PORT", "8001"))
    print(f"Ready on http://{host}:{port}", flush=True)
    app.run(host=host, port=port, threaded=False)
