import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from 'url';

// Load env variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Log environment variables (without exposing the full API key)
console.log("Environment check:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("API Key present:", !!process.env.OPENROUTER_API_KEY);
console.log("API Key prefix:", process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.substring(0, 10) + "..." : "Not set");

// Log the build directory path
const buildPath = path.join(__dirname, '..', 'dist');
console.log("Build directory path:", buildPath);

app.use(cors());
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

    console.log("Request received:", {
      method: req.method,
      path: req.path,
      body: req.body,
      headers: req.headers
    });

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NODE_ENV === 'production' 
        ? 'https://private-llm.onrender.com' 
        : `http://localhost:${PORT}`,
      "X-Title": "Private LLM App"
    };
    
    console.log("Making request to OpenRouter with headers:", {
      ...headers,
      Authorization: "Bearer [REDACTED]"
    });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: req.body.messages
      }),
    });

    const data = await response.json();
    console.log("OpenRouter response:", {
      status: response.status,
      statusText: response.statusText,
      data: data
    });

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
app.use(express.static(buildPath));

// Handle all other routes by serving the React app
app.use((req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Proxy server running at ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`API Key: ${process.env.OPENROUTER_API_KEY ? "Set" : "Not Set"}`);
});
