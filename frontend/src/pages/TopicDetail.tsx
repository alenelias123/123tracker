import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApi } from '../api';

interface Topic {
  id: number;
  title: string;
  description: string;
  mode: 'automated' | 'solo';
}

interface Session {
  id: number;
  topic_id: number;
  day_index: number;
  scheduled_for: string;
  status: string;
}

export default function TopicDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [newDate, setNewDate] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const api = getApi();
      const [topicRes, sessionsRes] = await Promise.all([
        api.get(`/topics/${id}`),
        api.get(`/topics/${id}/sessions`),
      ]);
      setTopic(topicRes.data);
      setSessions(sessionsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load topic');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleOpen = (session: Session) => {
    const path = topic?.mode === 'automated'
      ? `/sessions/${session.id}/automated`
      : `/sessions/${session.id}/solo`;
    navigate(path, { state: { topicId: id } });
  };

  const handleReschedule = async (sessionId: number) => {
    if (!newDate) return;
    try {
      const api = getApi();
      await api.patch(`/sessions/${sessionId}/reschedule`, {
        scheduled_for: newDate,
      });
      setRescheduleId(null);
      setNewDate('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reschedule');
    }
  };

  const handleComplete = async (sessionId: number) => {
    try {
      const api = getApi();
      await api.post(`/sessions/${sessionId}/complete`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to complete session');
    }
  };

  const handleSkip = async (sessionId: number) => {
    try {
      const api = getApi();
      await api.post(`/sessions/${sessionId}/skip`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to skip session');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        Topic not found
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{topic.title}</h1>
        <p className="text-gray-600 mt-2">{topic.description}</p>
        <span className="inline-block mt-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
          {topic.mode}
        </span>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Sessions</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {sessions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No sessions scheduled yet
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-900">
                        Day {session.day_index}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(session.scheduled_for).toLocaleDateString()}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          session.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : session.status === 'skipped'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {session.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => handleOpen(session)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => setRescheduleId(session.id)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleComplete(session.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleSkip(session.id)}
                          className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm font-medium"
                        >
                          Skip
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {rescheduleId === session.id && (
                  <div className="mt-3 flex items-center space-x-2">
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <button
                      onClick={() => handleReschedule(session.id)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setRescheduleId(null);
                        setNewDate('');
                      }}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
