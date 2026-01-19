from sentence_transformers import SentenceTransformer
import numpy as np

_model = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("thenlper/gte-small")
    return _model

def get_embedding(text: str) -> list:
    model = get_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()
