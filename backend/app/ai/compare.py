import numpy as np
from typing import List

def compare_notes(prev_points: List[dict], curr_points: List[dict], threshold: float = 0.80) -> dict:
    """
    Compare previous session notes with current session notes.
    
    Args:
        prev_points: List of dicts with {text, embedding}
        curr_points: List of dicts with {text, embedding}
        threshold: Similarity threshold for matching (default 0.80)
    
    Returns:
        dict with {recall_score: float (0-100), missed_points: List[dict with text]}
    """
    if not prev_points:
        return {"recall_score": 100.0, "missed_points": []}
    
    if not curr_points:
        return {
            "recall_score": 0.0,
            "missed_points": [{"text": point["text"]} for point in prev_points]
        }
    
    prev_embeddings = np.array([point["embedding"] for point in prev_points])
    curr_embeddings = np.array([point["embedding"] for point in curr_points])
    
    # Compute cosine similarity matrix
    # Since embeddings are normalized, dot product gives cosine similarity
    similarity_matrix = np.dot(prev_embeddings, curr_embeddings.T)
    
    # For each previous point, find best match in current points
    best_matches = np.max(similarity_matrix, axis=1)
    
    # Identify missed points (below threshold)
    missed_points = []
    for i, best_sim in enumerate(best_matches):
        if best_sim < threshold:
            missed_points.append({"text": prev_points[i]["text"]})
    
    # Calculate recall score
    num_recalled = len(prev_points) - len(missed_points)
    recall_score = (num_recalled / len(prev_points)) * 100.0
    
    return {
        "recall_score": recall_score,
        "missed_points": missed_points
    }
