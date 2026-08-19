import os
import json
import torch

from torch import nn, optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from torchvision.models import EfficientNet_B0_Weights
from sklearn.metrics import classification_report


DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

IMAGE_SIZE = 224
BATCH_SIZE = int(os.environ.get("TRAIN_BATCH", "8"))
EPOCHS = int(os.environ.get("TRAIN_EPOCHS", "5"))
LEARNING_RATE = 1e-4

ROOT = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(ROOT, "dataset")
MODEL_DIR = os.path.join(ROOT, "models")

os.makedirs(MODEL_DIR, exist_ok=True)

NUM_WORKERS = 0 if os.name == "nt" else 2
IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".bmp")


class ImageFolderNonEmpty(datasets.ImageFolder):
    def find_classes(self, directory):
        classes = []
        for entry in os.scandir(directory):
            if not entry.is_dir():
                continue
            has_image = any(
                child.is_file() and child.name.lower().endswith(IMAGE_EXTS)
                for child in os.scandir(entry.path)
            )
            if has_image:
                classes.append(entry.name)
        classes.sort()
        if not classes:
            raise FileNotFoundError(f"No class folders with images under {directory}")
        return classes, {name: idx for idx, name in enumerate(classes)}



train_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(
        brightness=0.2,
        contrast=0.2,
        saturation=0.2
    ),
    transforms.RandomResizedCrop(
        IMAGE_SIZE,
        scale=(0.8, 1.0)
    ),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


val_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


def train_model(plant_part):

    print("\n===================================")
    print(f"Training {plant_part} model")
    print("===================================\n")

    train_path = os.path.join(BASE_DIR, plant_part, "train")
    val_path = os.path.join(BASE_DIR, plant_part, "val")
    test_path = os.path.join(BASE_DIR, plant_part, "test")

    train_dataset = ImageFolderNonEmpty(
        train_path,
        transform=train_transform
    )

    if len(train_dataset) == 0:
        raise RuntimeError(
            f"No training images found in {train_path}. "
            "Run python prepare_dataset.py first, or add labeled images. "
            "Gallery demo photos are not a training set."
        )

    try:
        val_dataset = ImageFolderNonEmpty(
            val_path,
            transform=val_transform
        )
    except FileNotFoundError:
        val_dataset = None

    try:
        test_dataset = ImageFolderNonEmpty(
            test_path,
            transform=val_transform
        )
    except FileNotFoundError:
        test_dataset = None

    train_loader = DataLoader(
        train_dataset,
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=NUM_WORKERS
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=NUM_WORKERS
    ) if val_dataset and len(val_dataset) else None

    test_loader = DataLoader(
        test_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=NUM_WORKERS
    ) if test_dataset and len(test_dataset) else None

    classes = train_dataset.classes

    print("Classes:")
    for i, cls in enumerate(classes):
        print(i, cls)

    weights = EfficientNet_B0_Weights.DEFAULT

    model = models.efficientnet_b0(weights=weights)

    # Freeze pretrained feature extractor initially.
    for param in model.features.parameters():
        param.requires_grad = False

    number_classes = len(classes)

    model.classifier[1] = nn.Linear(
        model.classifier[1].in_features,
        number_classes
    )

    model = model.to(DEVICE)

    criterion = nn.CrossEntropyLoss()

    optimizer = optim.AdamW(
        model.classifier.parameters(),
        lr=LEARNING_RATE,
        weight_decay=1e-4
    )

    best_val_accuracy = 0

    for epoch in range(EPOCHS):

        model.train()

        total_loss = 0
        correct = 0
        total = 0

        for images, labels in train_loader:

            images = images.to(DEVICE)
            labels = labels.to(DEVICE)

            optimizer.zero_grad()

            outputs = model(images)

            loss = criterion(outputs, labels)

            loss.backward()

            optimizer.step()

            total_loss += loss.item()

            predictions = outputs.argmax(dim=1)

            correct += (
                predictions == labels
            ).sum().item()

            total += labels.size(0)

        train_accuracy = correct / total if total else 0

        val_accuracy = 0
        if val_loader:
            model.eval()
            correct = 0
            total = 0
            with torch.no_grad():
                for images, labels in val_loader:
                    images = images.to(DEVICE)
                    labels = labels.to(DEVICE)
                    outputs = model(images)
                    predictions = outputs.argmax(dim=1)
                    correct += (predictions == labels).sum().item()
                    total += labels.size(0)
            val_accuracy = correct / total if total else 0
        else:
            val_accuracy = train_accuracy

        print(
            f"Epoch {epoch + 1}/{EPOCHS} "
            f"| Loss: {total_loss / max(len(train_loader), 1):.4f} "
            f"| Train Acc: {train_accuracy:.4f} "
            f"| Val Acc: {val_accuracy:.4f}"
        )

        if val_accuracy >= best_val_accuracy:

            best_val_accuracy = val_accuracy

            torch.save(
                model.state_dict(),
                f"{MODEL_DIR}/{plant_part}_best.pth"
            )

    weights_file = f"{MODEL_DIR}/{plant_part}_best.pth"
    if not os.path.isfile(weights_file):
        torch.save(model.state_dict(), weights_file)

    model.load_state_dict(
        torch.load(
            weights_file,
            map_location=DEVICE,
            weights_only=True
        )
    )

    if test_loader:
        model.eval()
        predictions = []
        actual = []
        with torch.no_grad():
            for images, labels in test_loader:
                images = images.to(DEVICE)
                outputs = model(images)
                preds = outputs.argmax(dim=1)
                predictions.extend(preds.cpu().numpy())
                actual.extend(labels.numpy())
        print("\nTEST RESULTS")
        print(
            classification_report(
                actual,
                predictions,
                target_names=classes,
                zero_division=0
            )
        )
    else:
        print("No test images. Skipping classification report.")

    with open(
        f"{MODEL_DIR}/{plant_part}_classes.json",
        "w"
    ) as f:

        json.dump(classes, f, indent=4)

    print(f"\nSaved {plant_part} model.")


if __name__ == "__main__":

    train_model("leaf")
    train_model("fruit")
