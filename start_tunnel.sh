#!/bin/bash
echo "Installing Cloudflare Tunnel (cloudflared)..."
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared-linux-amd64.deb
rm cloudflared-linux-amd64.deb

echo "Starting Cloudflare Tunnel to localhost:8000..."
echo "=========================================================="
echo "Look for the URL that ends with .trycloudflare.com below!"
echo "=========================================================="
cloudflared tunnel --url http://127.0.0.1:8000
