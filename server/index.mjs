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
  'https://private-llm.onrender.com',
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

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("No API key found in environment variables");
      return res.status(500).json({ error: "API key not configured" });
    }

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NODE_ENV === 'production' 
        ? 'https://private-llm.onrender.com' 
        : `http://localhost:${PORT}`,
      "X-Title": "Private LLM App"
    };

    // Debug: Log the request details
    console.log('Making request to OpenRouter with headers:', {
      ...headers,
      Authorization: headers.Authorization ? 'Bearer [REDACTED]' : 'Not Set'
    });
    console.log('Request body:', req.body);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: req.body.messages
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter API error:", data);
      return res.status(response.status).json({ error: data });
    }

    res.json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Failed to contact OpenRouter." });
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
