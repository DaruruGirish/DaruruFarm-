import os
from tempfile import NamedTemporaryFile

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from predict import models_ready, predict


app = FastAPI(
    title="Daruru Farms Disease Detection API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():

    return {
        "service": "Daruru Farms Disease Detection",
        "status": "running",
        "leaf_model_ready": models_ready("leaf"),
        "fruit_model_ready": models_ready("fruit"),
    }


@app.post("/predict/{plant_part}")
async def predict_disease(
    plant_part: str,
    file: UploadFile = File(...)
):

    if plant_part not in ["leaf", "fruit"]:

        raise HTTPException(
            status_code=400,
            detail="plant_part must be 'leaf' or 'fruit'"
        )

    if not models_ready(plant_part):
        raise HTTPException(
            status_code=503,
            detail=(
                f"The {plant_part} model has not been trained yet. "
                "Add labeled images under dataset/ then run python train.py. "
                "Gallery photos are for inference testing, not training."
            )
        )

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")

    content_type = (file.content_type or "").lower()
    looks_like_image = (
        not content_type
        or content_type.startswith("image/")
        or content_type in ("application/octet-stream", "binary/octet-stream")
    )
    if not looks_like_image:
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    suffix = os.path.splitext(file.filename or "")[1] or ".jpg"
    temp = NamedTemporaryFile(suffix=suffix, delete=False)
    try:
        temp.write(contents)
        temp.close()
        result = predict(temp.name, plant_part)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        try:
            os.unlink(temp.name)
        except OSError:
            pass

    return result
