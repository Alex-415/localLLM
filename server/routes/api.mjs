import express from 'express';
import Together from 'together-ai';

const router = express.Router();

// Debug: Log router creation
console.log('Creating API router');

// Initialize Together AI client
const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY
});

// Debug: Log Together AI client initialization
console.log('Together AI client initialized:', {
  apiKeyConfigured: !!process.env.TOGETHER_API_KEY,
  apiKeyLength: process.env.TOGETHER_API_KEY?.length
});

// Health check endpoint
router.get('/health', (req, res) => {
  console.log('Health check endpoint called');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    apiKeyConfigured: !!process.env.TOGETHER_API_KEY
  });
});

// Chat endpoint
router.post('/chat', async (req, res) => {
  console.log('\n=== Chat Endpoint Called ===');
  console.log('Time:', new Date().toISOString());
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('API Key configured:', !!process.env.TOGETHER_API_KEY);
  
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      console.log('Invalid request: messages array is required');
      return res.status(400).json({ 
        error: 'Invalid request: messages array is required',
        received: req.body
      });
    }

    if (!process.env.TOGETHER_API_KEY) {
      console.log('API key not configured');
      return res.status(500).json({ 
        error: 'API key not configured',
        environment: process.env.NODE_ENV
      });
    }

    console.log('Making request to Together AI...');
    console.log('Messages:', JSON.stringify(messages, null, 2));
    
    const response = await together.chat.completions.create({
      messages: messages,
      model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
      temperature: 0.7,
      max_tokens: 1000
    });

    console.log('Together AI response:', JSON.stringify(response, null, 2));
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      console.error('Invalid response from Together AI:', response);
      return res.status(500).json({ 
        error: 'Invalid response from Together AI',
        response: response
      });
    }

    const result = {
      response: response.choices[0].message.content,
      model: response.model,
      usage: response.usage
    };

    console.log('Sending response:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('Chat API error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to process chat request',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Debug: Log router configuration
console.log('API router configured with routes:', router.stack.map(r => ({
  path: r.route?.path,
  methods: r.route?.methods
})));

export default router; 