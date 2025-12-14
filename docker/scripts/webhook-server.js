#!/usr/bin/env node
/**
 * GitHub Webhook Server for BelBird Auto-Deploy
 * Listens for push events and triggers frontend rebuild
 * 
 * Usage: node webhook-server.js
 * Environment: WEBHOOK_SECRET, DEPLOY_PATH, GITHUB_REPO
 */

const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');
const path = require('path');

const PORT = process.env.WEBHOOK_PORT || 9999;
const SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret';
const DEPLOY_PATH = process.env.DEPLOY_PATH || '/opt/belbird';
const WEB_PATH = process.env.WEB_PATH || '/var/www/belbird';

function verifySignature(payload, signature) {
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

function deploy() {
  console.log(`[${new Date().toISOString()}] 🚀 Starting deploy...`);
  
  const script = `
    cd ${DEPLOY_PATH} && \
    git fetch origin main && \
    git reset --hard origin/main && \
    npm ci && \
    npm run build && \
    rm -rf ${WEB_PATH}/* && \
    cp -r dist/* ${WEB_PATH}/ && \
    sudo systemctl reload nginx && \
    echo "✅ Deploy completed successfully"
  `;
  
  exec(script, { maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[${new Date().toISOString()}] ❌ Deploy failed:`, error.message);
      console.error(stderr);
      return;
    }
    console.log(stdout);
    console.log(`[${new Date().toISOString()}] ✅ Deploy completed`);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => { body += chunk.toString(); });
    
    req.on('end', () => {
      const signature = req.headers['x-hub-signature-256'];
      
      if (!verifySignature(body, signature)) {
        console.log(`[${new Date().toISOString()}] ⚠️ Invalid signature`);
        res.writeHead(401);
        res.end('Unauthorized');
        return;
      }
      
      try {
        const payload = JSON.parse(body);
        const branch = payload.ref?.replace('refs/heads/', '');
        
        if (branch === 'main' && payload.pusher) {
          console.log(`[${new Date().toISOString()}] 📦 Push to main by ${payload.pusher.name}`);
          deploy();
          res.writeHead(200);
          res.end('Deploy started');
        } else {
          res.writeHead(200);
          res.end('Ignored');
        }
      } catch (e) {
        console.error('Parse error:', e);
        res.writeHead(400);
        res.end('Bad request');
      }
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] 🎯 Webhook server listening on port ${PORT}`);
});
