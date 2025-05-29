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

## Quick Start (Mobile-Friendly)

### Option 1: Use via Vercel (Recommended) 🚀

1. **Deploy to Vercel** (one-click):
   - Click here: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/RonItelman/HealthIQ)
   - Add your Anthropic API key as environment variable: `CLAUDE_API_KEY`
   - Deploy!

2. **Access on your phone**:
   - Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
   - Add to home screen for app-like experience

### Option 2: Use via GitHub Gist (Simplest) 📱

1. **Create a Gist**:
   - Copy contents of `healthiq-gist.html`
   - Create new Gist at [gist.github.com](https://gist.github.com)
   - Save as `healthiq.html`

2. **Access on phone**:
   - Open the Gist
   - Click "Raw" button
   - Bookmark the page
   - Configure your Vercel API endpoint when prompted

### Option 3: Local Development

1. Clone and install:
```bash
git clone https://github.com/RonItelman/HealthIQ.git
cd HealthIQ
npm install
```

2. Set up API key:
```bash
cp .env.example .env
# Edit .env and add your Anthropic API key
```

3. Run locally:
```bash
npm start
```

## Mobile Setup Guide

### For Vercel Deployment:
1. Fork this repository
2. Sign up for [Vercel](https://vercel.com) (free)
3. Import your forked repository
4. Add environment variable: `CLAUDE_API_KEY` = your API key
5. Deploy and access from any device!

### For Gist Method:
1. No server needed - runs entirely in browser
2. First time: app will prompt for your Vercel API URL
3. Your API endpoint is saved locally on device
4. Works offline (except AI features)

## Architecture

- `index.html` - Main PWA application
- `claude-proxy.js` - Node.js proxy server for Claude API
- `package.json` - Dependencies for the proxy server

## Security Note

Never commit your API key to the repository. Always use environment variables.