import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getApi } from '../api';

interface SoloMetric {
  session_id?: number;
  day_index?: number;
  scheduled_for?: string;
  percent_covered: number;
  percent_remembered: number;
  created_at?: string;
}

interface TrendData {
  metrics: SoloMetric[];
  suggestion: string;
}

export default function SessionSolo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [covered, setCovered] = useState('');
  const [remembered, setRemembered] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [trend, setTrend] = useState<TrendData | null>(null);
  
  // Get topic_id from location state (passed from TopicDetail)
  const topicId = (location.state as any)?.topicId;

  const fetchTrend = async () => {
    if (!topicId) return;
    
    try {
      const api = getApi();
      const res = await api.get(`/topics/${topicId}/solo/trend`);
      setTrend(res.data);
    } catch (err: any) {
      console.error('Failed to load trend:', err);
    }
  };

  useEffect(() => {
    if (topicId) {
      fetchTrend();
    }
  }, [topicId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const coveredNum = parseFloat(covered);
    const rememberedNum = parseFloat(remembered);

    if (isNaN(coveredNum) || coveredNum < 0 || coveredNum > 100) {
      setError('Coverage must be between 0 and 100');
      return;
    }

    if (isNaN(rememberedNum) || rememberedNum < 0 || rememberedNum > 100) {
      setError('Remembered must be between 0 and 100');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const api = getApi();
      
      await api.post(`/sessions/${id}/solo`, {
        percent_covered: coveredNum,
        percent_remembered: rememberedNum,
      });

      setSubmitted(true);
      await fetchTrend();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit metrics');
    } finally {
      setLoading(false);
    }
  };

  const chartData = trend?.metrics.map((m, idx) => ({
    index: idx + 1,
    coverage: m.percent_covered,
    remembered: m.percent_remembered,
  })).reverse() || [];

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center"
      >
        ← Back
      </button>

      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Solo Session</h1>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="covered" className="block text-sm font-medium text-gray-700 mb-2">
                Coverage (0-100%)
              </label>
              <input
                id="covered"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={covered}
                onChange={(e) => setCovered(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="How much did you cover?"
                disabled={loading}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                What percentage of the material did you review?
              </p>
            </div>

            <div>
              <label htmlFor="remembered" className="block text-sm font-medium text-gray-700 mb-2">
                Retention (0-100%)
              </label>
              <input
                id="remembered"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={remembered}
                onChange={(e) => setRemembered(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="How much did you remember?"
                disabled={loading}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                What percentage of the material did you remember?
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              Metrics submitted successfully!
            </div>

            {trend && (
              <>
                {chartData.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Progress Trend</h2>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="index"
                            label={{ value: 'Session', position: 'insideBottom', offset: -5 }}
                          />
                          <YAxis
                            label={{ value: 'Percentage', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="coverage"
                            stroke="#3b82f6"
                            name="Coverage %"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="remembered"
                            stroke="#10b981"
                            name="Remembered %"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-indigo-900 mb-2">Suggestion</h3>
                  <p className="text-indigo-800">{trend.suggestion}</p>
                </div>
              </>
            )}

            <button
              onClick={() => navigate(-1)}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Back to Topic
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
