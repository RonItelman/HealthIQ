const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PORT = process.env.PORT || 8000;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Handle API proxy for Claude
  if (req.url.startsWith('/api/claude')) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    if (req.method === 'POST') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const requestData = JSON.parse(body);
          
          // If we have an API key, make real request
          if (CLAUDE_API_KEY) {
            const anthropicData = JSON.stringify({
              model: requestData.model || 'claude-3-sonnet-20240229',
              max_tokens: requestData.max_tokens || 1024,
              messages: requestData.messages
            });
            
            const options = {
              hostname: 'api.anthropic.com',
              path: '/v1/messages',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Length': Buffer.byteLength(anthropicData)
              }
            };
            
            const anthropicReq = https.request(options, (anthropicRes) => {
              let responseData = '';
              
              anthropicRes.on('data', (chunk) => {
                responseData += chunk;
              });
              
              anthropicRes.on('end', () => {
                res.writeHead(anthropicRes.statusCode, { 'Content-Type': 'application/json' });
                res.end(responseData);
              });
            });
            
            anthropicReq.on('error', (error) => {
              console.error('Claude API Error:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to connect to Claude API' }));
            });
            
            anthropicReq.write(anthropicData);
            anthropicReq.end();
          } else {
            // Return mock response if no API key
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              content: [{
                text: "This is a mock response. To use the real Claude API, add CLAUDE_API_KEY to your .env file."
              }]
            }));
          }
        } catch (error) {
          console.error('Request processing error:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request' }));
        }
      });
      
      return;
    }
    
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Serve static files
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': mimeType,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Dots development server running at http://localhost:${PORT}`);
  if (CLAUDE_API_KEY) {
    console.log('✅ Claude API key detected - Real API calls enabled');
  } else {
    console.log('⚠️  No Claude API key found - Using mock responses');
    console.log('   Add CLAUDE_API_KEY to .env file to enable real API calls');
  }
  console.log('\nPress Ctrl+C to stop');
});