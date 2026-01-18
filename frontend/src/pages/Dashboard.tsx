import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApi } from '../api';

interface Topic {
  id: number;
  title: string;
  description: string;
  mode: string;
}

export default function Dashboard() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        setError('');
        const api = getApi();
        const res = await api.get('/topics');
        setTopics(res.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load topics');
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Your Topics</h1>
        <Link
          to="/topics/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          Create Topic
        </Link>
      </div>

      {topics.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">No topics yet</p>
          <Link
            to="/topics/new"
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Create your first topic
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              to={`/topics/${topic.id}`}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition border border-gray-200"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {topic.title}
              </h2>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {topic.description}
              </p>
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                {topic.mode}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
