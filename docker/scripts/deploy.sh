#!/bin/bash
# BelBird Frontend Deploy Script
# Usage: ./deploy.sh

set -e

DEPLOY_PATH="${DEPLOY_PATH:-/opt/belbird}"
WEB_PATH="${WEB_PATH:-/var/www/belbird}"
BRANCH="${BRANCH:-main}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐦 BelBird Deploy Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 Project: $DEPLOY_PATH"
echo "🌐 Web: $WEB_PATH"
echo "🌿 Branch: $BRANCH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$DEPLOY_PATH"

echo "📥 Pulling latest changes..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "📦 Installing dependencies..."
npm ci

echo "🔨 Building project..."
npm run build

echo "🚀 Deploying to web server..."
rm -rf "$WEB_PATH"/*
cp -r dist/* "$WEB_PATH"/

echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deploy completed at $(date)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
