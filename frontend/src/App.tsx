import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { initializeApi } from './api';
import Dashboard from './pages/Dashboard';
import CreateTopic from './pages/CreateTopic';
import TopicDetail from './pages/TopicDetail';
import SessionAutomated from './pages/SessionAutomated';
import SessionSolo from './pages/SessionSolo';

export default function App() {
  const { isLoading, isAuthenticated, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    if (isAuthenticated) {
      initializeApi(getAccessTokenSilently);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">123tracker</h1>
          <p className="text-gray-600 mb-6">Track your learning with spaced repetition</p>
          <button
            onClick={() => loginWithRedirect()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="text-2xl font-bold text-indigo-600">
                123tracker
              </Link>
              <button
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Log Out
              </button>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/topics/new" element={<CreateTopic />} />
            <Route path="/topics/:id" element={<TopicDetail />} />
            <Route path="/sessions/:id/automated" element={<SessionAutomated />} />
            <Route path="/sessions/:id/solo" element={<SessionSolo />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
