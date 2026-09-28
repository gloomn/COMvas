#!/bin/bash
# Launches Chromium in Fullscreen Kiosk Mode for HDMI Display Output

SERVER_URL="http://localhost:8000/viewer"

echo "Launching Jetson HDMI Display Kiosk Mode..."
echo "Connecting to: $SERVER_URL"

# Disable screen saver & power management
xset s off
xset -dpms
xset s noblank

# Launch Chromium Browser with GPU WebGL hardware acceleration enabled
chromium-browser \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --check-for-update-interval=31536000 \
    --ignore-certificate-errors \
    --enable-gpu-rasterization \
    --enable-zero-copy \
    "$SERVER_URL"
