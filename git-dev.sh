#!/bin/bash

# Git Development Branch Script
# Usage: ./git-dev.sh [commit-message]

set -e  # Exit on any error

# Default commit message if none provided
COMMIT_MESSAGE="${1:-Update development branch}"

echo "🔄 Switching to development branch..."
git checkout development

echo "📝 Adding all changes..."
git add .

echo "💾 Committing changes..."
git commit -m "$COMMIT_MESSAGE

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo "🚀 Pushing to origin/development..."
git push origin development

echo "✅ Successfully committed and pushed to development branch!"
echo "📊 Latest commit:"
git log --oneline -1