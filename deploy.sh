#!/bin/bash

# Deploy script for Dots
# This script merges development branch to main and deploys to Vercel

echo "🚀 Dots Deployment Script"
echo "========================"

# Check if we're on development branch
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "development" ]; then
    echo "❌ Error: You must be on the development branch to deploy"
    echo "   Current branch: $CURRENT_BRANCH"
    echo "   Run: git checkout development"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: You have uncommitted changes"
    echo "   Please commit or stash your changes before deploying"
    git status --short
    exit 1
fi

# Pull latest development changes
echo "📥 Pulling latest development changes..."
git pull origin development

# Switch to main branch
echo "🔄 Switching to main branch..."
git checkout main

# Pull latest main changes
echo "📥 Pulling latest main changes..."
git pull origin main

# Merge development into main
echo "🔀 Merging development into main..."
if git merge development --no-edit; then
    echo "✅ Merge successful!"
    
    # Push to main (triggers Vercel deployment)
    echo "📤 Pushing to main branch (this will trigger Vercel deployment)..."
    if git push origin main; then
        echo "✅ Successfully pushed to main!"
        echo "🌐 Vercel will now deploy your changes"
        echo "   Check deployment status at: https://vercel.com/dashboard"
        
        # Switch back to development
        echo "🔄 Switching back to development branch..."
        git checkout development
        
        echo ""
        echo "✨ Deployment initiated successfully!"
        echo "   Your changes will be live at https://healthiq-ronitelman.vercel.app in a few minutes"
    else
        echo "❌ Error: Failed to push to main"
        echo "   You may need to resolve conflicts or check your permissions"
        exit 1
    fi
else
    echo "❌ Error: Merge failed!"
    echo "   You may have conflicts to resolve"
    echo "   After resolving conflicts:"
    echo "   1. git add ."
    echo "   2. git commit"
    echo "   3. git push origin main"
    echo "   4. git checkout development"
    exit 1
fi