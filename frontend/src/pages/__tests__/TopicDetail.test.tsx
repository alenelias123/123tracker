import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import TopicDetail from '../TopicDetail';
import * as api from '../../api';

vi.mock('../../api');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderTopicDetail = (topicId = '1') => {
  window.history.pushState({}, '', `/topics/${topicId}`);
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/topics/:id" element={<TopicDetail />} />
      </Routes>
    </BrowserRouter>
  );
};

describe('TopicDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set window location to match the route
    window.history.pushState({}, '', '/topics/1');
  });

  it('displays topic information', async () => {
    const mockTopic = {
      id: 1,
      title: 'React Hooks',
      description: 'Learning about React Hooks',
      mode: 'automated',
    };

    const mockSessions = [
      {
        id: 1,
        topic_id: 1,
        day_index: 1,
        scheduled_for: '2024-01-15',
        status: 'scheduled',
      },
    ];

    const mockApi = {
      get: vi.fn()
        .mockResolvedValueOnce({ data: mockTopic })
        .mockResolvedValueOnce({ data: mockSessions }),
      post: vi.fn(),
      patch: vi.fn(),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderTopicDetail();

    await waitFor(() => {
      expect(screen.getByText('React Hooks')).toBeInTheDocument();
      expect(screen.getByText('Learning about React Hooks')).toBeInTheDocument();
      expect(screen.getByText('automated')).toBeInTheDocument();
    });
  });

  it('displays sessions list', async () => {
    const mockTopic = {
      id: 1,
      title: 'React Hooks',
      description: 'Learning about React Hooks',
      mode: 'automated',
    };

    const mockSessions = [
      {
        id: 1,
        topic_id: 1,
        day_index: 1,
        scheduled_for: '2024-01-15',
        status: 'scheduled',
      },
      {
        id: 2,
        topic_id: 1,
        day_index: 3,
        scheduled_for: '2024-01-17',
        status: 'completed',
      },
    ];

    const mockApi = {
      get: vi.fn()
        .mockResolvedValueOnce({ data: mockTopic })
        .mockResolvedValueOnce({ data: mockSessions }),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderTopicDetail();

    await waitFor(() => {
      expect(screen.getByText('Day 1')).toBeInTheDocument();
      expect(screen.getByText('Day 3')).toBeInTheDocument();
      expect(screen.getByText('scheduled')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
  });

  it('displays session action buttons for scheduled sessions', async () => {
    const mockTopic = {
      id: 1,
      title: 'React Hooks',
      description: 'Learning about React Hooks',
      mode: 'automated',
    };

    const mockSessions = [
      {
        id: 1,
        topic_id: 1,
        day_index: 1,
        scheduled_for: '2024-01-15',
        status: 'scheduled',
      },
    ];

    const mockApi = {
      get: vi.fn()
        .mockResolvedValueOnce({ data: mockTopic })
        .mockResolvedValueOnce({ data: mockSessions }),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderTopicDetail();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reschedule' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Complete' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument();
    });
  });

  it('handles complete session action', async () => {
    const user = userEvent.setup();
    const mockTopic = {
      id: 1,
      title: 'React Hooks',
      description: 'Learning about React Hooks',
      mode: 'automated',
    };

    const mockSessions = [
      {
        id: 1,
        topic_id: 1,
        day_index: 1,
        scheduled_for: '2024-01-15',
        status: 'scheduled',
      },
    ];

    const mockApi = {
      get: vi.fn()
        .mockResolvedValueOnce({ data: mockTopic })
        .mockResolvedValueOnce({ data: mockSessions })
        .mockResolvedValueOnce({ data: mockTopic })
        .mockResolvedValueOnce({ data: [] }),
      post: vi.fn().mockResolvedValue({}),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderTopicDetail();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Complete' })).toBeInTheDocument();
    });

    const completeButton = screen.getByRole('button', { name: 'Complete' });
    await user.click(completeButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/sessions/1/complete');
    });
  });

  it('shows no sessions message when empty', async () => {
    const mockTopic = {
      id: 1,
      title: 'React Hooks',
      description: 'Learning about React Hooks',
      mode: 'automated',
    };

    const mockApi = {
      get: vi.fn()
        .mockResolvedValueOnce({ data: mockTopic })
        .mockResolvedValueOnce({ data: [] }),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderTopicDetail();

    await waitFor(() => {
      expect(screen.getByText('No sessions scheduled yet')).toBeInTheDocument();
    });
  });
});
