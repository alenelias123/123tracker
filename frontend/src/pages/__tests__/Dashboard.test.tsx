import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import * as api from '../../api';

vi.mock('../../api');

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    const mockApi = {
      get: vi.fn(() => new Promise(() => {})), // Never resolves
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderDashboard();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders topics list', async () => {
    const mockTopics = [
      {
        id: 1,
        title: 'React Hooks',
        description: 'Learning about React Hooks',
        mode: 'automated',
      },
      {
        id: 2,
        title: 'TypeScript',
        description: 'TypeScript fundamentals',
        mode: 'solo',
      },
    ];

    const mockApi = {
      get: vi.fn().mockResolvedValue({ data: mockTopics }),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('React Hooks')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Learning about React Hooks')).toBeInTheDocument();
      expect(screen.getByText('TypeScript fundamentals')).toBeInTheDocument();
    });
  });

  it('shows "no topics" message when empty', async () => {
    const mockApi = {
      get: vi.fn().mockResolvedValue({ data: [] }),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('No topics yet')).toBeInTheDocument();
      expect(screen.getByText('Create your first topic')).toBeInTheDocument();
    });
  });

  it('test navigation to create topic', async () => {
    const mockApi = {
      get: vi.fn().mockResolvedValue({ data: [] }),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderDashboard();

    await waitFor(() => {
      const createButtons = screen.getAllByText('Create Topic');
      expect(createButtons.length).toBeGreaterThan(0);
      createButtons.forEach((button) => {
        expect(button.closest('a')).toHaveAttribute('href', '/topics/new');
      });
    });
  });

  it('displays error message on API failure', async () => {
    const mockApi = {
      get: vi.fn().mockRejectedValue({
        response: { data: { detail: 'Failed to load topics' } },
      }),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Failed to load topics')).toBeInTheDocument();
    });
  });
});
