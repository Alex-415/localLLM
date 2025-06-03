import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from 'url';

// Load env variables from .env file with explicit path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Debug: Log all environment variables
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? 'Set' : 'Not Set',
  OPENROUTER_API_KEY_LENGTH: process.env.OPENROUTER_API_KEY?.length
});

const app = express();
const PORT = process.env.PORT || 4000;

// Configure CORS for production
const allowedOrigins = [
  'https://alex-415.github.io',
  'https://alex-415.github.io/localLLM',
  'http://localhost:5173',
  'http://localhost',
  'https://localllm.onrender.com',
  'https://*.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// API routes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    env: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      apiKeyPresent: !!process.env.OPENROUTER_API_KEY
    }
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    console.log('Received chat request:', {
      headers: req.headers,
      body: req.body
    });

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid request body:', req.body);
      return res.status(400).json({ error: 'Invalid request body' });
    }

    console.log('Making request to OpenRouter with headers:', {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer [REDACTED]',
      'HTTP-Referer': 'http://localhost:4000',
      'X-Title': 'Private LLM App'
    });

    console.log('Request body:', { messages });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:4000',
        'X-Title': 'Private LLM App'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenRouter API response:', data);

    res.json(data);
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Handle all other routes by serving the React app
app.use((req, res) => {
  res.sendFile(path.join(path.join(__dirname, '..', 'dist'), 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Proxy server running at ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`API Key: ${process.env.OPENROUTER_API_KEY ? "Set" : "Not Set"}`);
});
