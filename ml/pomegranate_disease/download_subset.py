"""Download Hugging Face parquet shards and extract a small training subset."""

from __future__ import annotations

import json
import os
from collections import Counter, defaultdict
from io import BytesIO
from pathlib import Path

import pyarrow.parquet as pq
from PIL import Image
from huggingface_hub import hf_hub_download

from prepare_dataset import FRUIT_MAP, PER_CLASS, write_splits

os.environ.setdefault("HF_HUB_DOWNLOAD_TIMEOUT", "180")

REPO = "Project-AgML/pomegranate_disease_classification_india"
SHARDS = [f"data/train-{i:05d}-of-00011.parquet" for i in range(11)]


def class_names(table) -> list[str]:
    raw = table.schema.metadata.get(b"huggingface", b"{}").decode()
    info = json.loads(raw)
    return info["info"]["features"]["label"]["names"]


def extract_needed(path: str, buckets: dict[str, list[Image.Image]]) -> None:
    labels_only = pq.read_table(path, columns=["label"])
    names = class_names(labels_only)
    counts = Counter(labels_only.column("label").to_pylist())
    print("  labels:", {names[i]: n for i, n in sorted(counts.items()) if i < len(names)})
    needed_ids = {
        idx for idx, name in enumerate(names)
        if name in FRUIT_MAP and len(buckets[name]) < PER_CLASS
    }
    if not needed_ids.intersection(counts):
        print("  skip (no remaining classes)")
        return

    pf = pq.ParquetFile(path)
    for batch in pf.iter_batches(batch_size=16):
        if all(len(buckets[name]) >= PER_CLASS for name in FRUIT_MAP):
            return
        for row in batch.to_pylist():
            idx = row["label"]
            if idx not in needed_ids:
                continue
            name = names[idx]
            if len(buckets[name]) >= PER_CLASS:
                continue
            payload = row.get("image") or {}
            blob = payload.get("bytes") if isinstance(payload, dict) else None
            if not blob:
                continue
            image = Image.open(BytesIO(blob)).convert("RGB")
            buckets[name].append(image)
        print("  collected", {k: len(buckets[k]) for k in sorted(FRUIT_MAP)}, flush=True)
        if all(len(buckets[name]) >= PER_CLASS for name in FRUIT_MAP):
            return
        needed_ids = {
            idx for idx, name in enumerate(names)
            if name in FRUIT_MAP and len(buckets[name]) < PER_CLASS
        }
        if not needed_ids.intersection(counts):
            return


def main() -> None:
    buckets: dict[str, list[Image.Image]] = defaultdict(list)
    for shard in SHARDS:
        if all(len(buckets[k]) >= PER_CLASS for k in FRUIT_MAP):
            break
        print(f"Downloading {shard} ...", flush=True)
        local = hf_hub_download(repo_id=REPO, filename=shard, repo_type="dataset")
        extract_needed(local, buckets)
    missing = [k for k in FRUIT_MAP if len(buckets.get(k, [])) < 8]
    if missing:
        raise SystemExit("Not enough images for: " + ", ".join(missing))
    write_splits(buckets)
    print("Dataset ready. Run: python train.py")


if __name__ == "__main__":
    main()
