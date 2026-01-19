import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import SessionAutomated from '../SessionAutomated';
import * as api from '../../api';

vi.mock('../../api');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  };
});

const renderSessionAutomated = () => {
  return render(
    <BrowserRouter>
      <SessionAutomated />
    </BrowserRouter>
  );
};

describe('SessionAutomated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form correctly', () => {
    const mockApi = {
      post: vi.fn(),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderSessionAutomated();

    expect(screen.getByText('Automated Session')).toBeInTheDocument();
    expect(screen.getByLabelText('Add Bullet Points')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('adds bullet points', async () => {
    const user = userEvent.setup();
    const mockApi = {
      post: vi.fn(),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderSessionAutomated();

    const input = screen.getByLabelText('Add Bullet Points');
    await user.type(input, 'First point');

    const addButton = screen.getByRole('button', { name: 'Add' });
    await user.click(addButton);

    expect(screen.getByText('First point')).toBeInTheDocument();
    expect(screen.getByText('Your Notes (1)')).toBeInTheDocument();
  });

  it('removes bullet points', async () => {
    const user = userEvent.setup();
    const mockApi = {
      post: vi.fn(),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderSessionAutomated();

    const input = screen.getByLabelText('Add Bullet Points');
    await user.type(input, 'First point');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await user.clear(input);
    await user.type(input, 'Second point');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('Your Notes (2)')).toBeInTheDocument();

    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    await user.click(removeButtons[0]);

    expect(screen.queryByText('First point')).not.toBeInTheDocument();
    expect(screen.getByText('Second point')).toBeInTheDocument();
    expect(screen.getByText('Your Notes (1)')).toBeInTheDocument();
  });

  it('submits notes and displays comparison results', async () => {
    const user = userEvent.setup();
    const mockResult = {
      recall_score: 85.5,
      missed_points: [
        { text: 'Missed concept 1', similarity: 0.3 },
        { text: 'Missed concept 2', similarity: 0.4 },
      ],
    };

    const mockApi = {
      post: vi.fn()
        .mockResolvedValueOnce({}) // notes submission
        .mockResolvedValueOnce({ data: mockResult }), // comparison
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderSessionAutomated();

    const input = screen.getByLabelText('Add Bullet Points');
    await user.type(input, 'First point');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await user.clear(input);
    await user.type(input, 'Second point');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const submitButton = screen.getByRole('button', { name: 'Submit & Compare' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/sessions/1/notes', {
        points: ['First point', 'Second point'],
      });
      expect(mockApi.post).toHaveBeenCalledWith('/sessions/1/compare', {});
    });

    await waitFor(() => {
      expect(screen.getByText('Results')).toBeInTheDocument();
      expect(screen.getByText('85.5%')).toBeInTheDocument();
      expect(screen.getByText('Recall Score')).toBeInTheDocument();
      expect(screen.getByText('Missed Points (2)')).toBeInTheDocument();
      expect(screen.getByText('Missed concept 1')).toBeInTheDocument();
      expect(screen.getByText('Missed concept 2')).toBeInTheDocument();
    });
  });

  it('validates at least one bullet point before submission', async () => {
    const user = userEvent.setup();
    const mockApi = {
      post: vi.fn(),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderSessionAutomated();

    const submitButton = screen.getByRole('button', { name: 'Submit & Compare' });
    expect(submitButton).toBeDisabled();
  });

  it('displays error on API failure', async () => {
    const user = userEvent.setup();
    const mockApi = {
      post: vi.fn().mockRejectedValue({
        response: { data: { detail: 'Failed to submit notes' } },
      }),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderSessionAutomated();

    const input = screen.getByLabelText('Add Bullet Points');
    await user.type(input, 'First point');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const submitButton = screen.getByRole('button', { name: 'Submit & Compare' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to submit notes')).toBeInTheDocument();
    });
  });

  it('displays results without missed points', async () => {
    const user = userEvent.setup();
    const mockResult = {
      recall_score: 100,
      missed_points: [],
    };

    const mockApi = {
      post: vi.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ data: mockResult }),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderSessionAutomated();

    const input = screen.getByLabelText('Add Bullet Points');
    await user.type(input, 'Perfect recall');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const submitButton = screen.getByRole('button', { name: 'Submit & Compare' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('100.0%')).toBeInTheDocument();
      expect(screen.queryByText(/Missed Points/)).not.toBeInTheDocument();
    });
  });
});
