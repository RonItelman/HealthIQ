const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Claude API configuration
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || 'your-api-key-here';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// Check if API key is set
if (!process.env.CLAUDE_API_KEY) {
    console.warn('Warning: CLAUDE_API_KEY environment variable not set');
    console.warn('Set it with: export CLAUDE_API_KEY="your-actual-api-key"');
}

// Proxy endpoint for Claude API
app.post('/api/claude', async (req, res) => {
    try {
        const response = await fetch(CLAUDE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Claude API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Claude proxy server is running' });
});

app.listen(PORT, () => {
    console.log(`Claude proxy server running on http://localhost:${PORT}`);
    console.log(`Open your HealthIQ app and it will use this proxy automatically`);
});