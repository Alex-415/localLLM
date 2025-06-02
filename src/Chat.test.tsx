import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from './test-utils';
import Chat from './Chat';

describe('Chat Component', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.resetAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('renders chat interface', () => {
    render(<Chat />);
    
    expect(screen.getByText('KML Production')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear history/i })).toBeInTheDocument();
  });

  it('loads messages from localStorage on initial render', () => {
    const savedMessages = [
      { role: 'user', content: 'Saved message', timestamp: Date.now() },
      { role: 'assistant', content: 'Saved response', timestamp: Date.now() }
    ];
    localStorage.setItem('chat_messages', JSON.stringify(savedMessages));

    render(<Chat />);
    
    expect(screen.getByText('Saved message')).toBeInTheDocument();
    expect(screen.getByText('Saved response')).toBeInTheDocument();
  });

  it('handles invalid localStorage data gracefully', () => {
    // Set invalid JSON in localStorage
    localStorage.setItem('chat_messages', 'invalid-json');

    render(<Chat />);
    
    // Should render empty chat
    expect(screen.queryByText('Saved message')).not.toBeInTheDocument();
    expect(screen.queryByText('Saved response')).not.toBeInTheDocument();
  });

  it('handles empty localStorage gracefully', () => {
    render(<Chat />);
    
    // Should render empty chat
    expect(screen.queryByText('Saved message')).not.toBeInTheDocument();
    expect(screen.queryByText('Saved response')).not.toBeInTheDocument();
  });

  it('saves messages to localStorage with correct structure', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Test response' } }]
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse)
    });

    render(<Chat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);

    // Wait for the API response
    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });

    // Check localStorage structure
    const savedMessages = JSON.parse(localStorage.getItem('chat_messages') || '[]');
    expect(savedMessages).toHaveLength(2);
    
    // Check user message structure
    expect(savedMessages[0]).toMatchObject({
      role: 'user',
      content: 'Hello',
      timestamp: expect.any(Number)
    });

    // Check assistant message structure
    expect(savedMessages[1]).toMatchObject({
      role: 'assistant',
      content: 'Test response',
      timestamp: expect.any(Number)
    });

    // Verify timestamps are in correct order
    expect(savedMessages[0].timestamp).toBeLessThan(savedMessages[1].timestamp);
  });

  it('clears chat history and localStorage when clear button is clicked', async () => {
    // First add some messages
    const mockResponse = {
      choices: [{ message: { content: 'Test response' } }]
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse)
    });

    render(<Chat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });

    // Now clear the history
    const clearButton = screen.getByRole('button', { name: /clear history/i });
    fireEvent.click(clearButton);

    // Check that messages are removed from the UI
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
    expect(screen.queryByText('Test response')).not.toBeInTheDocument();

    // Check that localStorage is cleared (should be empty array)
    const savedMessages = JSON.parse(localStorage.getItem('chat_messages') || '[]');
    expect(savedMessages).toHaveLength(0);
  });

  it('maintains message order after page reload', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Test response' } }]
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse)
    });

    // First render and send message
    const { unmount } = render(<Chat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'First message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });

    // Unmount and remount to simulate page reload
    unmount();
    render(<Chat />);

    // Verify messages are in correct order
    const messages = screen.getAllByText(/First message|Test response/);
    expect(messages[0]).toHaveTextContent('First message');
    expect(messages[1]).toHaveTextContent('Test response');
  });

  it('sends message when clicking send button', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Test response' } }]
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse)
    });

    render(<Chat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);

    // Check if user message appears
    expect(screen.getByText('Hello')).toBeInTheDocument();

    // Wait for the API response
    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      })
    });
  });

  it('sends message when pressing Enter', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Test response' } }]
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse)
    });

    render(<Chat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Check if user message appears
    expect(screen.getByText('Hello')).toBeInTheDocument();

    // Wait for the API response
    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));

    render(<Chat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);

    // Check if user message appears
    expect(screen.getByText('Hello')).toBeInTheDocument();

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText('Error contacting the model.')).toBeInTheDocument();
    });
  });

  it('disables input and button while loading', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Test response' } }]
    };

    global.fetch = vi.fn().mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => 
          resolve({ json: () => Promise.resolve(mockResponse) }), 
          100
        )
      )
    );

    render(<Chat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);

    // Check if input and button are disabled
    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();

    // Wait for the response
    await waitFor(() => {
      expect(input).not.toBeDisabled();
      expect(sendButton).not.toBeDisabled();
    });
  });
}); 