"""Download a public pomegranate fruit-disease subset and split it for training.

Source: Project-AgML/pomegranate_disease_classification_india (Pakruddin & Hemavathy).
Gallery demo photos are never copied into this dataset.
"""

from __future__ import annotations

import random
from collections import defaultdict
from pathlib import Path

from PIL import Image

BASE = Path(__file__).resolve().parent
DATASET = BASE / "dataset"
PER_CLASS = 40
SEED = 42

# HuggingFace labels -> our fruit / leaf folders
FRUIT_MAP = {
    "Healthy": "healthy",
    "Anthracnose": "anthracnose",
    "Cercospora": "fruit_spot",
    "Alternaria": "fruit_rot",
    "Bacterial_Blight": "fruit_rot",
}
LEAF_MAP = {
    "Healthy": "healthy",
    "Anthracnose": "anthracnose",
    "Bacterial_Blight": "bacterial_blight",
    "Cercospora": "leaf_spot",
    "Alternaria": "leaf_spot",
}


def clear_images(root: Path) -> None:
    for path in root.rglob("*"):
        if path.is_file() and path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
            path.unlink()


def save_jpeg(image: Image.Image, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    rgb = image.convert("RGB")
    rgb.thumbnail((256, 256))
    rgb.save(dest, format="JPEG", quality=85)


def split_indices(n: int) -> tuple[str, ...]:
    labels = ["train"] * n
    n_val = max(1, int(n * 0.15))
    n_test = max(1, int(n * 0.15))
    n_train = n - n_val - n_test
    if n_train < 1:
        n_train, n_val, n_test = n, 0, 0
    parts = ["train"] * n_train + ["val"] * n_val + ["test"] * n_test
    random.shuffle(parts)
    return tuple(parts)


def collect_from_huggingface() -> dict[str, list[Image.Image]]:
    from datasets import load_dataset

    print("Streaming public pomegranate disease images from Hugging Face...")
    ds = load_dataset(
        "Project-AgML/pomegranate_disease_classification_india",
        split="train",
        streaming=True,
    )
    buckets: dict[str, list[Image.Image]] = defaultdict(list)
    needed = set(FRUIT_MAP.keys())
    for row in ds:
        label = row.get("label") or row.get("disease") or row.get("class")
        if hasattr(label, "item"):
            label = label.item()
        names = row.get("label_name")
        if isinstance(label, int) and "label" in getattr(ds, "features", {}):
            try:
                label = ds.features["label"].int2str(label)
            except Exception:
                pass
        if not isinstance(label, str):
            # common imagefolder layout: image + label name in path
            image = row.get("image")
            path = getattr(image, "filename", None) or row.get("path") or ""
            for name in needed:
                if name.lower() in str(path).lower().replace(" ", "_"):
                    label = name
                    break
        if label not in FRUIT_MAP:
            # try title-case / underscore variants
            key = str(label).replace(" ", "_")
            match = next((k for k in FRUIT_MAP if k.lower() == key.lower()), None)
            label = match
        if label not in FRUIT_MAP:
            continue
        if len(buckets[label]) >= PER_CLASS:
            if all(len(buckets[k]) >= PER_CLASS for k in needed):
                break
            continue
        image = row.get("image")
        if image is None:
            continue
        if not isinstance(image, Image.Image):
            image = Image.open(image).convert("RGB") if not hasattr(image, "convert") else image.convert("RGB")
        else:
            image = image.convert("RGB")
        buckets[label].append(image.copy())
        counts = ", ".join(f"{k}={len(buckets[k])}" for k in sorted(needed))
        print(f"  collected {counts}", end="\r")
    print()
    return buckets


def write_splits(buckets: dict[str, list[Image.Image]]) -> None:
    random.seed(SEED)
    clear_images(DATASET / "fruit")
    clear_images(DATASET / "leaf")
    written = 0
    for src_label, images in buckets.items():
        random.shuffle(images)
        parts = split_indices(len(images))
        for i, (image, split) in enumerate(zip(images, parts)):
            fruit_cls = FRUIT_MAP[src_label]
            leaf_cls = LEAF_MAP[src_label]
            save_jpeg(image, DATASET / "fruit" / split / fruit_cls / f"{src_label}_{i:03d}.jpg")
            save_jpeg(image, DATASET / "leaf" / split / leaf_cls / f"{src_label}_{i:03d}.jpg")
            written += 2
    print(f"Wrote {written} resized images under dataset/")


def main() -> None:
    buckets = collect_from_huggingface()
    missing = [k for k in FRUIT_MAP if len(buckets.get(k, [])) < 8]
    if missing:
        raise SystemExit(
            "Could not download enough labeled images for: "
            + ", ".join(missing)
            + ". Check network access to Hugging Face."
        )
    write_splits(buckets)
    print("Dataset ready. Run: python train.py")


if __name__ == "__main__":
    main()
