import json
import os
import torch

from PIL import Image, UnidentifiedImageError
from torchvision import transforms, models
from torch import nn


DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

IMAGE_SIZE = 224
UNCERTAIN_THRESHOLD = 55.0

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")


transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


def model_paths(plant_part):
    weights = os.path.join(MODEL_DIR, f"{plant_part}_best.pth")
    classes = os.path.join(MODEL_DIR, f"{plant_part}_classes.json")
    return weights, classes


def models_ready(plant_part):
    weights, classes = model_paths(plant_part)
    return os.path.isfile(weights) and os.path.isfile(classes)


def load_model(plant_part):

    weights_path, classes_path = model_paths(plant_part)

    if not models_ready(plant_part):
        raise FileNotFoundError(
            f"Trained {plant_part} weights were not found. "
            "Run python train.py after filling dataset/ with labeled images."
        )

    with open(classes_path) as f:

        classes = json.load(f)

    model = models.efficientnet_b0(weights=None)

    model.classifier[1] = nn.Linear(
        model.classifier[1].in_features,
        len(classes)
    )

    model.load_state_dict(
        torch.load(
            weights_path,
            map_location=DEVICE,
            weights_only=True
        )
    )

    model = model.to(DEVICE)
    model.eval()

    return model, classes


def predict(image_path, plant_part):

    model, classes = load_model(plant_part)

    try:
        image = Image.open(image_path).convert("RGB")
    except UnidentifiedImageError as exc:
        raise ValueError("Could not decode this file as an image.") from exc

    image = transform(image)
    image = image.unsqueeze(0)
    image = image.to(DEVICE)

    with torch.no_grad():

        outputs = model(image)

        probabilities = torch.softmax(
            outputs,
            dim=1
        )

    confidence, index = torch.max(
        probabilities,
        dim=1
    )

    disease = classes[index.item()]

    confidence = confidence.item() * 100

    top_probabilities, top_indices = torch.topk(
        probabilities,
        min(3, len(classes))
    )

    top_predictions = []

    for probability, index in zip(
        top_probabilities[0],
        top_indices[0]
    ):

        top_predictions.append({
            "disease": classes[index.item()],
            "confidence": round(
                probability.item() * 100,
                2
            )
        })

    return {
        "plant_part": plant_part,
        "disease": disease,
        "confidence": round(confidence, 2),
        "uncertain": round(confidence, 2) < UNCERTAIN_THRESHOLD,
        "top_predictions": top_predictions,
        "trained": True
    }


if __name__ == "__main__":

    result = predict(
        "test_image.jpg",
        "leaf"
    )

    print(result)
