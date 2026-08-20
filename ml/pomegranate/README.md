# Production pomegranate fruit AI (inference only)

## Required models
- `models/DenseNet_Model.keras`
- `models/feature_extractor.keras`
- `models/healthy_mean.npy`
- `models/healthy_std.npy`
- `models/scaler_dict.pkl`
- `models/gmm_dict.pkl`
- `models/healthy_features.npy` (kept; not loaded by current infer)
- `models/thresholds_dict.pkl` (kept; not loaded by current infer)

## Runtime
- `infer.py` — DenseNet121 + Grad-CAM++ + HBDS severity
- `serve.py` — warm HTTP server
- `requirements.txt`
- `rag_recommend.py` — unused for now (RAG/LLM later)

## Environment (no hardcoded machine paths in code)
| Variable | Purpose | Local default |
|----------|---------|---------------|
| `POMEGRANATE_ML_ROOT` | Folder containing `infer.py` + `models/` | `../ml/pomegranate` from backend cwd |
| `POMEGRANATE_PYTHON` | Python executable | `python` (use `python3` on Linux) |
| `POMEGRANATE_INFER_URL` | Nest → warm server | `http://127.0.0.1:8001` |
| `POMEGRANATE_INFER_HOST` | Warm server bind | `127.0.0.1` (use `0.0.0.0` in private containers) |
| `POMEGRANATE_INFER_PORT` | Warm server port | `8001` |

```bash
# warm server
python serve.py
# or on AWS Linux AMI:
# POMEGRANATE_INFER_HOST=127.0.0.1 POMEGRANATE_PYTHON=python3 python3 serve.py
```

## API
- `POST /api/disease-management/analyze-fruit`
- `POST /api/disease-management/analyze-gallery/:id`
