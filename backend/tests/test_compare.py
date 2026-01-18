import pytest
import numpy as np
from app.ai.compare import compare_notes

def create_mock_embedding(values):
    """Create a normalized mock embedding vector."""
    vec = np.array(values, dtype=np.float32)
    return (vec / np.linalg.norm(vec)).tolist()

def test_identical_notes():
    """Test 100% recall when previous and current notes are identical."""
    prev_points = [
        {"text": "Python is a programming language", "embedding": create_mock_embedding([1, 0, 0])},
        {"text": "FastAPI is a web framework", "embedding": create_mock_embedding([0, 1, 0])},
    ]
    curr_points = [
        {"text": "Python is a programming language", "embedding": create_mock_embedding([1, 0, 0])},
        {"text": "FastAPI is a web framework", "embedding": create_mock_embedding([0, 1, 0])},
    ]
    
    result = compare_notes(prev_points, curr_points)
    
    assert result["recall_score"] == 100.0
    assert len(result["missed_points"]) == 0

def test_completely_different():
    """Test 0% recall when notes have no matches."""
    prev_points = [
        {"text": "Topic A", "embedding": create_mock_embedding([1, 0, 0])},
        {"text": "Topic B", "embedding": create_mock_embedding([0, 1, 0])},
    ]
    curr_points = [
        {"text": "Topic C", "embedding": create_mock_embedding([0, 0, 1])},
        {"text": "Topic D", "embedding": create_mock_embedding([1, 1, 0])},
    ]
    
    result = compare_notes(prev_points, curr_points, threshold=0.90)
    
    assert result["recall_score"] == 0.0
    assert len(result["missed_points"]) == 2
    assert result["missed_points"][0]["text"] == "Topic A"
    assert result["missed_points"][1]["text"] == "Topic B"

def test_partial_match():
    """Test correct recall calculation with some matches."""
    prev_points = [
        {"text": "Point 1", "embedding": create_mock_embedding([1, 0, 0])},
        {"text": "Point 2", "embedding": create_mock_embedding([0, 1, 0])},
        {"text": "Point 3", "embedding": create_mock_embedding([0, 0, 1])},
        {"text": "Point 4", "embedding": create_mock_embedding([1, 1, 0])},
    ]
    # Current has matches for points 1 and 2, misses 3 and 4
    curr_points = [
        {"text": "Point 1 similar", "embedding": create_mock_embedding([1, 0, 0])},
        {"text": "Point 2 similar", "embedding": create_mock_embedding([0, 1, 0])},
        {"text": "Unrelated", "embedding": create_mock_embedding([0.5, 0.5, 0.5])},
    ]
    
    result = compare_notes(prev_points, curr_points, threshold=0.90)
    
    # 2 out of 4 points recalled = 50%
    assert result["recall_score"] == 50.0
    assert len(result["missed_points"]) == 2

def test_threshold_boundary():
    """Test behavior at threshold edge cases."""
    # Create points with controlled similarity
    prev_points = [
        {"text": "Point A", "embedding": create_mock_embedding([1, 0, 0])},
    ]
    # Create a point that's slightly below threshold (cos_sim ~0.79)
    curr_points = [
        {"text": "Point B", "embedding": create_mock_embedding([0.79, 0.61, 0])},
    ]
    
    # With threshold 0.80, should be missed
    result = compare_notes(prev_points, curr_points, threshold=0.80)
    assert result["recall_score"] == 0.0
    assert len(result["missed_points"]) == 1
    
    # With threshold 0.75, should match
    result = compare_notes(prev_points, curr_points, threshold=0.75)
    assert result["recall_score"] == 100.0
    assert len(result["missed_points"]) == 0

def test_empty_previous():
    """Test handling of empty previous notes."""
    prev_points = []
    curr_points = [
        {"text": "Some note", "embedding": create_mock_embedding([1, 0, 0])},
    ]
    
    result = compare_notes(prev_points, curr_points)
    
    # No previous points means 100% recall (nothing to miss)
    assert result["recall_score"] == 100.0
    assert len(result["missed_points"]) == 0

def test_empty_current():
    """Test handling of empty current notes."""
    prev_points = [
        {"text": "Previous note 1", "embedding": create_mock_embedding([1, 0, 0])},
        {"text": "Previous note 2", "embedding": create_mock_embedding([0, 1, 0])},
    ]
    curr_points = []
    
    result = compare_notes(prev_points, curr_points)
    
    # No current points means 0% recall (all missed)
    assert result["recall_score"] == 0.0
    assert len(result["missed_points"]) == 2
    assert result["missed_points"][0]["text"] == "Previous note 1"
    assert result["missed_points"][1]["text"] == "Previous note 2"

def test_both_empty():
    """Test handling when both previous and current are empty."""
    prev_points = []
    curr_points = []
    
    result = compare_notes(prev_points, curr_points)
    
    # Both empty should return 100% (nothing to miss)
    assert result["recall_score"] == 100.0
    assert len(result["missed_points"]) == 0

def test_missing_embedding_key():
    """Test error handling for missing embedding key."""
    prev_points = [
        {"text": "Point 1", "no_embedding": [1, 0, 0]},
    ]
    curr_points = [
        {"text": "Point 2", "embedding": create_mock_embedding([1, 0, 0])},
    ]
    
    with pytest.raises(ValueError, match="missing required key"):
        compare_notes(prev_points, curr_points)
