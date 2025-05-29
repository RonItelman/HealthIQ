# HealthIQ

A Progressive Web App (PWA) for health tracking with AI-powered analysis using Claude.

## Features

- 📱 Mobile-first design that works on any device
- 🤖 AI-powered health analysis with Claude
- 💾 Offline support with local data storage
- 📝 Text logging for health issues
- 📊 Markdown and summary views
- 🔍 Search and filter functionality
- 📤 Export data capabilities

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/RonItelman/HealthIQ.git
cd HealthIQ
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up your Anthropic API key
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Anthropic API key
# Get your API key from: https://console.anthropic.com/
```

### 4. Run the proxy server
```bash
npm start
```

### 5. Open the app
- Open `index.html` in your browser
- Or for mobile: host the files and access via your phone's browser

## Mobile Usage

### Option 1: Local Network (Recommended for testing)
1. Run the proxy server on your computer
2. Find your computer's local IP address
3. Update `CLAUDE_PROXY_URL` in `index.html` to use your IP (e.g., `http://192.168.1.100:3001/api/claude`)
4. Access the app from your phone's browser

### Option 2: GitHub Pages (Without AI features)
1. Enable GitHub Pages in repository settings
2. Access via: `https://[your-username].github.io/HealthIQ`
3. Note: AI features won't work without the proxy server

### Option 3: Install as PWA
1. Open the app in your mobile browser
2. Click "Add to Home Screen" when prompted
3. The app will work offline (except for AI features)

## Architecture

- `index.html` - Main PWA application
- `claude-proxy.js` - Node.js proxy server for Claude API
- `package.json` - Dependencies for the proxy server

## Security Note

Never commit your API key to the repository. Always use environment variables.