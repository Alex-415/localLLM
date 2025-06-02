import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import Chat from '../Chat';

describe('Chat Integration', () => {
  beforeAll(() => {
    // Setup any necessary test environment
  });

  afterAll(() => {
    // Cleanup after tests
    vi.clearAllMocks();
  });

  it('completes a full conversation flow', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Test response' } }]
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse)
    });

    render(<Chat />);
    
    // Initial state check
    expect(screen.getByText('KML Production')).toBeInTheDocument();
    
    // Type and send first message
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Hello, how are you?' } });
    fireEvent.click(sendButton);
    
    // Verify user message appears
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    
    // Wait for and verify assistant response
    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Type and send second message
    fireEvent.change(input, { target: { value: 'What can you help me with?' } });
    fireEvent.click(sendButton);
    
    // Verify second user message appears
    expect(screen.getByText('What can you help me with?')).toBeInTheDocument();
    
    // Wait for and verify second assistant response
    await waitFor(() => {
      const responses = screen.getAllByText('Test response');
      expect(responses.length).toBe(2);
    }, { timeout: 5000 });
  });

  it('handles multiple rapid messages', async () => {
    const messages = [
      'First message',
      'Second message',
      'Third message'
    ];

    let responseCount = 0;
    // Mock successful responses for each message
    global.fetch = vi.fn().mockImplementation(() => {
      responseCount++;
      return Promise.resolve({
        json: () => Promise.resolve({
          choices: [{ message: { content: `Response ${responseCount}` } }]
        })
      });
    });

    render(<Chat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Send messages sequentially and wait for each response
    for (const message of messages) {
      // Send message
      fireEvent.change(input, { target: { value: message } });
      fireEvent.click(sendButton);

      // Wait for user message to appear
      await waitFor(() => {
        expect(screen.getByText(message)).toBeInTheDocument();
      });

      // Wait for corresponding response
      await waitFor(() => {
        const expectedResponse = `Response ${responseCount}`;
        expect(screen.getByText(expectedResponse)).toBeInTheDocument();
      });
    }

    // Final verification of all messages and responses
    messages.forEach((message, index) => {
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.getByText(`Response ${index + 1}`)).toBeInTheDocument();
    });
  });

  it('maintains chat history during interaction', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Test response' } }]
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse)
    });

    render(<Chat />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Send initial message
    fireEvent.change(input, { target: { value: 'Initial message' } });
    fireEvent.click(sendButton);
    
    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('Initial message')).toBeInTheDocument();
      expect(screen.getByText('Test response')).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Send follow-up message
    fireEvent.change(input, { target: { value: 'Follow-up message' } });
    fireEvent.click(sendButton);
    
    // Verify both messages are still visible
    await waitFor(() => {
      expect(screen.getByText('Initial message')).toBeInTheDocument();
      expect(screen.getByText('Follow-up message')).toBeInTheDocument();
      const responses = screen.getAllByText('Test response');
      expect(responses.length).toBe(2);
    }, { timeout: 5000 });
  });
}); 