const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config();

const PORT = process.env.PORT || 8000;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Auto-reload script to inject
const AUTO_RELOAD_SCRIPT = `
<script>
(function() {
  let lastCheck = Date.now();
  const checkInterval = 1000; // Check every second
  
  async function checkForChanges() {
    try {
      const response = await fetch('/__dev_reload_check__');
      const data = await response.json();
      if (data.lastModified > lastCheck) {
        console.log('Changes detected, reloading...');
        location.reload();
      }
      lastCheck = Date.now();
    } catch (e) {
      // Server might be restarting
    }
  }
  
  setInterval(checkForChanges, checkInterval);
})();
</script>
`;

// Track last modification time
let lastModified = Date.now();

// Watch for file changes
const watchDirs = ['./js', './css', './api'];
const watchFiles = ['./index.html', './manifest.json'];

function watchForChanges() {
  // Watch directories
  watchDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.watch(dir, { recursive: true }, (eventType, filename) => {
        if (filename && !filename.includes('.swp') && !filename.includes('~')) {
          console.log(`File changed: ${dir}/${filename}`);
          lastModified = Date.now();
        }
      });
    }
  });
  
  // Watch individual files
  watchFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.watch(file, (eventType) => {
        console.log(`File changed: ${file}`);
        lastModified = Date.now();
      });
    }
  });
}

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

  // Dev reload check endpoint
  if (req.url === '/__dev_reload_check__') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ lastModified }));
    return;
  }

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
  let filePath = '.' + req.url.split('?')[0]; // Remove query parameters
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
      // Inject auto-reload script into HTML files
      if (filePath.endsWith('.html')) {
        let contentStr = content.toString();
        // Add cache busting to CSS files
        contentStr = contentStr.replace(/href="(css\/[^"]+\.css)"/g, `href="$1?v=${Date.now()}"`);
        // Add auto-reload script
        contentStr = contentStr.replace('</body>', AUTO_RELOAD_SCRIPT + '</body>');
        content = contentStr;
      }
      
      res.writeHead(200, { 
        'Content-Type': mimeType,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(content);
    }
  });
});

// Start watching for changes
watchForChanges();

server.listen(PORT, () => {
  console.log(`🚀 Dots development server running at http://localhost:${PORT}`);
  console.log('🔄 Auto-reload enabled - browser will refresh on file changes');
  if (CLAUDE_API_KEY) {
    console.log('✅ Claude API key detected - Real API calls enabled');
  } else {
    console.log('⚠️  No Claude API key found - Using mock responses');
    console.log('   Add CLAUDE_API_KEY to .env file to enable real API calls');
  }
  console.log('\nPress Ctrl+C to stop');
});

// Don't open browser automatically - it opens a new tab on every restart