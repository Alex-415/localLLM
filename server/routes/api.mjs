import express from 'express';
import Together from 'together-ai';

const router = express.Router();

// Initialize Together AI client
const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY
});

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

    if (!process.env.TOGETHER_API_KEY) {
      console.log('API key not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('Making request to Together AI...');
    const response = await together.chat.completions.create({
      messages: messages,
      model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
      temperature: 0.7,
      max_tokens: 1000
    });

    console.log('Together AI response:', response);
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      console.error('Invalid response from Together AI:', response);
      return res.status(500).json({ error: 'Invalid response from Together AI' });
    }

    res.json({
      response: response.choices[0].message.content,
      model: response.model,
      usage: response.usage
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