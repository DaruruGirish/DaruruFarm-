"""Pre-push integrity checks for Daruru Farm CI."""
from __future__ import annotations

import pickle
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []


def ok(msg: str) -> None:
    print(f"OK  {msg}")


def fail(msg: str) -> None:
    errors.append(msg)
    print(f"FAIL  {msg}")


required = [
    ".github/workflows/ci.yml",
    "docker-compose.yml",
    "backend/Dockerfile",
    "backend/.dockerignore",
    "backend/package.json",
    "backend/package-lock.json",
    "backend/nest-cli.json",
    "backend/tsconfig.build.json",
    "frontend/Dockerfile",
    "frontend/.dockerignore",
    "frontend/nginx.conf",
    "frontend/package.json",
    "frontend/package-lock.json",
    "ml/pomegranate/Dockerfile",
    "ml/pomegranate/infer.py",
    "ml/pomegranate/serve.py",
    "ml/pomegranate/requirements.docker.txt",
    "ml/pomegranate/requirements.ci.txt",
    "ml/pomegranate/models/DenseNet_Model.keras",
    "ml/pomegranate/models/feature_extractor.keras",
    "ml/pomegranate/models/healthy_mean.npy",
    "ml/pomegranate/models/healthy_std.npy",
    "ml/pomegranate/models/scaler_dict.pkl",
    "ml/pomegranate/models/gmm_dict.pkl",
]

print("=== required paths ===")
for rel in required:
    path = ROOT / rel
    if path.is_file():
        ok(rel)
    else:
        fail(f"missing {rel}")

models = ROOT / "ml/pomegranate/models"
print("\n=== model integrity ===")
limit = 100 * 1024 * 1024
for name in ("DenseNet_Model.keras", "feature_extractor.keras"):
    path = models / name
    if not path.is_file():
        fail(f"missing {name}")
        continue
    size = path.stat().st_size
    if size >= limit:
        fail(f"{name} >= 100MB ({size/1024/1024:.1f} MB)")
    elif not zipfile.is_zipfile(path):
        fail(f"{name} is not a valid .keras zip")
    else:
        with zipfile.ZipFile(path) as zf:
            names = zf.namelist()
        if not names:
            fail(f"{name} zip is empty")
        else:
            ok(f"{name} zip entries={len(names)} size_mb={size/1024/1024:.1f}")

try:
    import numpy as np
except ImportError:
    fail("numpy not installed for npy checks")
    np = None

if np is not None:
    for name in ("healthy_mean.npy", "healthy_std.npy", "healthy_features.npy"):
        path = models / name
        try:
            arr = np.load(path)
            ok(f"{name} shape={arr.shape} dtype={arr.dtype}")
        except Exception as exc:
            fail(f"{name}: {exc}")

for name in ("scaler_dict.pkl", "gmm_dict.pkl", "thresholds_dict.pkl"):
    path = models / name
    try:
        with open(path, "rb") as fh:
            obj = pickle.load(fh)
        detail = list(obj)[:5] if hasattr(obj, "keys") else type(obj).__name__
        ok(f"{name} loaded ({detail})")
    except Exception as exc:
        fail(f"{name}: {exc}")

print("\n=== waste / do-not-push checks ===")
waste_globs = [
    "**/node_modules/**",
    "**/__pycache__/**",
    "ml/pomegranate/pomegranate_dataset/**",
    "ml/pomegranate/_train_split/**",
    "ARR-2023-Pomegranate-Disease-Using-DL-and-RAG-Based-LLM-950c5d3/Pomegranate Diseases Dataset.rar",
    "backend/.env",
    ".env",
]
# only report if these would be force-added; informational
for pattern in (
    "Desktop/**",
    "improve_the_quality_of_the_vid.mp4",
    "ARR-2023-Pomegranate-Disease-Using-DL-and-RAG-Based-LLM-950c5d3/**",
):
    matches = list(ROOT.glob(pattern))
    if matches:
        print(f"NOTE  leave untracked/ignored: {pattern} ({len(matches)} matches)")

ci = (ROOT / ".github/workflows/ci.yml").read_text(encoding="utf-8")
for needle in (
    "npm run build",
    "docker compose build backend frontend ml",
    "py_compile",
    "requirements.ci.txt",
):
    if needle in ci:
        ok(f"ci.yml contains {needle!r}")
    else:
        fail(f"ci.yml missing {needle!r}")

if errors:
    print("\nRESULT: FAILED")
    for item in errors:
        print(" -", item)
    sys.exit(1)

print("\nRESULT: PASSED — safe to push CI-critical files")
sys.exit(0)
