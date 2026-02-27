#!/bin/bash
# Bash script to create .env file for BrightWords Backend
# Run this script: bash create-env.sh

echo "========================================"
echo "BrightWords Backend - Environment Setup"
echo "========================================"
echo ""

ENV_FILE=".env"

# Check if .env already exists
if [ -f "$ENV_FILE" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "Cancelled. Existing .env file preserved."
        exit
    fi
fi

echo "Optional: Razorpay credentials (press Enter to skip):"
read -p "Razorpay Key ID (or press Enter): " RAZORPAY_KEY_ID
read -sp "Razorpay Key Secret (or press Enter): " RAZORPAY_KEY_SECRET
echo ""

# Create .env content
cat > "$ENV_FILE" << EOF
# BrightWords Backend Environment Variables
# Generated on $(date)

# Razorpay Payment Gateway (Optional)
RAZORPAY_KEY_ID=$RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET=$RAZORPAY_KEY_SECRET

# Server Port (Optional - defaults to 3000)
PORT=3000
EOF

echo ""
echo "✅ .env file created successfully!"
echo "   Location: $(pwd)/$ENV_FILE"
echo ""
echo "⚠️  IMPORTANT: Keep this file secure and never commit it to git!"
echo ""
echo "Next steps:"
echo "1. Restart your backend server"

