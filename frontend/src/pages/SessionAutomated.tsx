import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { getApi } from '../api';

interface ComparisonResult {
  recall_score: number;
  missed_points: Array<{ text: string; similarity: number }>;
}

export default function SessionAutomated() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [point, setPoint] = useState('');
  const [points, setPoints] = useState<string[]>([]);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addPoint = () => {
    if (point.trim()) {
      setPoints((prev) => [...prev, point.trim()]);
      setPoint('');
    }
  };

  const removePoint = (index: number) => {
    setPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addPoint();
    }
  };

  const submitNotes = async () => {
    if (points.length === 0) {
      setError('Please add at least one bullet point');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const api = getApi();
      
      await api.post(`/sessions/${id}/notes`, { points });
      const res = await api.post(`/sessions/${id}/compare`, {});
      
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit notes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center"
      >
        ← Back
      </button>

      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Automated Session</h1>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!result ? (
          <div className="space-y-6">
            <div>
              <label htmlFor="point" className="block text-sm font-medium text-gray-700 mb-2">
                Add Bullet Points
              </label>
              <div className="flex space-x-2">
                <input
                  id="point"
                  type="text"
                  value={point}
                  onChange={(e) => setPoint(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a bullet point and press Enter"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />
                <button
                  onClick={addPoint}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                  disabled={loading}
                >
                  Add
                </button>
              </div>
            </div>

            {points.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Your Notes ({points.length})
                </h2>
                <ul className="space-y-2">
                  {points.map((p, i) => (
                    <li
                      key={i}
                      className="flex items-start space-x-3 bg-gray-50 p-3 rounded-lg"
                    >
                      <span className="flex-1 text-gray-700">{p}</span>
                      <button
                        onClick={() => removePoint(i)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={submitNotes}
              disabled={loading || points.length === 0}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Comparing...' : 'Submit & Compare'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Results</h2>
              <div className="text-4xl font-bold text-indigo-600">
                {result.recall_score.toFixed(1)}%
              </div>
              <p className="text-gray-600 mt-1">Recall Score</p>
            </div>

            {result.missed_points.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Missed Points ({result.missed_points.length})
                </h3>
                <ul className="space-y-3">
                  {result.missed_points.map((missed, i) => (
                    <li
                      key={i}
                      className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg"
                    >
                      <p className="text-gray-800">{missed.text}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Similarity: {(missed.similarity * 100).toFixed(1)}%
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Back to Topic
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
