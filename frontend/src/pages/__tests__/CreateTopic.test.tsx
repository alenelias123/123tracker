import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import CreateTopic from '../CreateTopic';
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

const renderCreateTopic = () => {
  return render(
    <BrowserRouter>
      <CreateTopic />
    </BrowserRouter>
  );
};

describe('CreateTopic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form correctly', () => {
    const mockApi = {
      post: vi.fn(),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderCreateTopic();

    expect(screen.getByRole('heading', { name: 'Create Topic' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Mode')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Topic' })).toBeInTheDocument();
  });

  it('validates required fields - title', async () => {
    const user = userEvent.setup();
    const mockApi = {
      post: vi.fn(),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderCreateTopic();

    const submitButton = screen.getByRole('button', { name: 'Create Topic' });
    await user.click(submitButton);

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it('validates required fields - description', async () => {
    const user = userEvent.setup();
    const mockApi = {
      post: vi.fn(),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderCreateTopic();

    const titleInput = screen.getByLabelText('Title');
    await user.type(titleInput, 'Test Topic');

    const submitButton = screen.getByRole('button', { name: 'Create Topic' });
    await user.click(submitButton);

    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it('successfully creates topic', async () => {
    const user = userEvent.setup();
    const mockApi = {
      post: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderCreateTopic();

    const titleInput = screen.getByLabelText('Title');
    const descriptionInput = screen.getByLabelText('Description');

    await user.type(titleInput, 'React Hooks');
    await user.type(descriptionInput, 'Learning about React Hooks');

    const submitButton = screen.getByRole('button', { name: 'Create Topic' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/topics', {
        title: 'React Hooks',
        description: 'Learning about React Hooks',
        mode: 'automated',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('tests mode selection', async () => {
    const user = userEvent.setup();
    const mockApi = {
      post: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderCreateTopic();

    const modeSelect = screen.getByLabelText('Mode');
    await user.selectOptions(modeSelect, 'solo');

    expect(
      screen.getByText('You will manually track your coverage and retention')
    ).toBeInTheDocument();

    const titleInput = screen.getByLabelText('Title');
    const descriptionInput = screen.getByLabelText('Description');

    await user.type(titleInput, 'Solo Topic');
    await user.type(descriptionInput, 'A solo mode topic');

    const submitButton = screen.getByRole('button', { name: 'Create Topic' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/topics', {
        title: 'Solo Topic',
        description: 'A solo mode topic',
        mode: 'solo',
      });
    });
  });

  it('displays error on API failure', async () => {
    const user = userEvent.setup();
    const mockApi = {
      post: vi.fn().mockRejectedValue({
        response: { data: { detail: 'Failed to create topic' } },
      }),
    };
    vi.mocked(api.getApi).mockReturnValue(mockApi as any);

    renderCreateTopic();

    const titleInput = screen.getByLabelText('Title');
    const descriptionInput = screen.getByLabelText('Description');

    await user.type(titleInput, 'Test Topic');
    await user.type(descriptionInput, 'Test Description');

    const submitButton = screen.getByRole('button', { name: 'Create Topic' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to create topic')).toBeInTheDocument();
    });
  });
});
