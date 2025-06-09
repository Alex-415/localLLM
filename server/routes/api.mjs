import express from 'express';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Chat endpoint
router.post('/chat', async (req, res) => {
  console.log('=== Chat Endpoint Called ===');
  console.log('Request body:', req.body);
  console.log('Headers:', req.headers);
  
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      console.log('Invalid request: messages array is required');
      return res.status(400).json({ error: 'Invalid request: messages array is required' });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.log('API key not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('Making request to OpenRouter API...');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.BASE_URL || 'https://localllm.onrender.com',
        'X-Title': 'LocalLLM'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return res.status(response.status).json({ 
        error: 'OpenRouter API error',
        details: errorText
      });
    }

    const data = await response.json();
    console.log('OpenRouter API response:', data);
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error('Invalid response from OpenRouter:', data);
      return res.status(500).json({ error: 'Invalid response from OpenRouter' });
    }

    res.json({
      response: data.choices[0].message.content,
      model: data.model,
      usage: data.usage
    });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat request',
      details: error.message 
    });
  }
});

export default router; 