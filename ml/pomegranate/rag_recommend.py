"""RAG + LLM recommendations from the ARR-2023 chatbot implementation.

Uses Qdrant + OpenRouter when configured. Does not invent pesticide names
or dosages: the model is instructed to use only retrieved context.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any

EMPTY = {
    "explanation": "",
    "immediateActions": [],
    "treatmentOptions": [],
    "bestPractices": [],
    "monitoring": [],
}


def _parse_structured(text: str) -> dict[str, Any]:
    result = dict(EMPTY)
    result["explanation"] = text.strip()
    try:
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            data = json.loads(match.group(0))
            result["explanation"] = str(data.get("explanation") or result["explanation"])
            for key in ("immediateActions", "treatmentOptions", "bestPractices", "monitoring"):
                value = data.get(key) or data.get(key[0].lower() + key[1:]) or []
                if isinstance(value, str):
                    value = [line.strip(" -•") for line in value.split("\n") if line.strip()]
                if isinstance(value, list):
                    result[key] = [str(item).strip() for item in value if str(item).strip()]
    except json.JSONDecodeError:
        pass
    return result


def retrieve_context(query: str) -> str:
    url = os.environ.get("QDRANT_URL", "").strip()
    api_key = os.environ.get("QDRANT_API_KEY", "").strip()
    collection = os.environ.get("QDRANT_COLLECTION", "chatbot_documents").strip() or "chatbot_documents"
    if not url or not api_key:
        return ""

    from qdrant_client import QdrantClient
    from sentence_transformers import SentenceTransformer

    qdrant = QdrantClient(url, api_key=api_key)
    embedding_model = SentenceTransformer("intfloat/e5-base-v2")
    expanded = f"{query} symptoms treatment pomegranate disease management"
    vector = embedding_model.encode(expanded).tolist()
    hits = qdrant.search(
        collection_name=collection,
        query_vector=vector,
        limit=5,
        with_payload=True,
    )
    chunks = []
    for hit in hits:
        payload = hit.payload or {}
        text = payload.get("text") or ""
        source = payload.get("source") or "knowledge base"
        if text:
            chunks.append(f"Source: {source}\n{text}")
    return "\n\n".join(chunks)


def generate_llm_answer(query: str, context: str) -> str:
    api_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        return ""
    from openai import OpenAI

    client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=api_key)
    prompt = (
        "Use ONLY the retrieved agricultural context below. "
        "Do not invent pesticide names, dosages, or application instructions. "
        "If the context does not contain a specific product or dose, omit it.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {query}\n\n"
        "Return JSON with keys: explanation (string), immediateActions (string array), "
        "treatmentOptions (string array), bestPractices (string array), monitoring (string array)."
    )
    response = client.chat.completions.create(
        model=os.environ.get("OPENROUTER_MODEL", "mistralai/mistral-7b-instruct:free"),
        messages=[
            {"role": "system", "content": "You are an agronomy assistant. Use retrieved sources only."},
            {"role": "user", "content": prompt},
        ],
    )
    return response.choices[0].message.content or ""


def recommend_for_disease(disease: str, severity: str) -> dict[str, Any]:
    query = (
        f"Describe management of {disease} in pomegranate fruit at {severity} severity. "
        "Include cultural practices, monitoring, and only treatments present in the sources."
    )
    try:
        context = retrieve_context(query)
    except Exception as exc:
        return {
            **EMPTY,
            "explanation": (
                f"{disease} at {severity} severity was detected. "
                f"Agricultural retrieval failed ({exc}). Configure QDRANT_URL and QDRANT_API_KEY."
            ),
        }

    if not context.strip():
        return {
            **EMPTY,
            "explanation": (
                f"{disease} at {severity} severity was detected. "
                "No RAG documents were retrieved. Set QDRANT_URL, QDRANT_API_KEY, and QDRANT_COLLECTION "
                "to the authors' pomegranate knowledge base. Treatment products were not generated."
            ),
        }

    try:
        answer = generate_llm_answer(query, context)
    except Exception as exc:
        return {
            **EMPTY,
            "explanation": (
                f"{disease} at {severity} severity was detected. Retrieved source text is available, "
                f"but the LLM call failed ({exc}). Set OPENROUTER_API_KEY. "
                "Retrieved context was not turned into product recommendations."
            ),
        }

    if not answer.strip():
        return {
            **EMPTY,
            "explanation": (
                f"{disease} at {severity} severity was detected. Retrieved context exists, "
                "but no LLM answer was produced."
            ),
        }

    parsed = _parse_structured(answer)
    if not parsed["explanation"]:
        parsed["explanation"] = answer.strip()
    return parsed
