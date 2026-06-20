#!/bin/bash
# One-time setup script for CI/CD webhook deployment
# Run this on the EC2 server: ssh ubuntu@50.19.129.245 'bash -s' < setup-cicd.sh

set -e

echo "🚀 Setting up CI/CD webhook deployment..."

# Generate webhook secret
echo "📝 Generating webhook secret..."
WEBHOOK_SECRET=$(openssl rand -hex 32)
echo ""
echo "⚠️  IMPORTANT: Save this secret and add it to GitHub!"
echo "Secret: $WEBHOOK_SECRET"
echo ""
echo "Add to GitHub: Settings → Secrets → Actions → New secret"
echo "Name: DEPLOY_WEBHOOK_SECRET"
echo "Value: $WEBHOOK_SECRET"
echo ""
read -p "Press Enter once you've added the secret to GitHub..."

# Pull latest code
echo "📥 Pulling latest code..."
cd /home/ubuntu/meal-plan
git pull origin main

# Install webhook dependencies
echo "📦 Installing webhook dependencies..."
cd api
pip install fastapi uvicorn --quiet

# Create systemd service
echo "⚙️  Creating systemd service..."
sudo tee /etc/systemd/system/deploy-webhook.service > /dev/null <<EOF
[Unit]
Description=Deployment Webhook Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/meal-plan/api
Environment="WEBHOOK_SECRET=$WEBHOOK_SECRET"
ExecStart=/usr/bin/python3 -m uvicorn deploy_webhook:app --host 0.0.0.0 --port 8003
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Start the service
echo "▶️  Starting webhook service..."
sudo systemctl daemon-reload
sudo systemctl enable deploy-webhook
sudo systemctl start deploy-webhook

# Check status
sleep 2
if sudo systemctl is-active --quiet deploy-webhook; then
    echo "✅ Webhook service is running!"
else
    echo "❌ Webhook service failed to start"
    sudo systemctl status deploy-webhook
    exit 1
fi

# Test the endpoint
echo "🧪 Testing webhook endpoint..."
curl -s http://localhost:8003/webhook/health | grep -q "ok" && echo "✅ Health check passed!" || echo "❌ Health check failed"

echo ""
echo "🎉 CI/CD setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add the webhook secret to GitHub (if you haven't already)"
echo "2. Update EC2 security group to allow port 8003:"
echo "   - Go to AWS Console → EC2 → Security Groups"
echo "   - Add inbound rule: TCP 8003 from 0.0.0.0/0"
echo "3. Test deployment:"
echo "   gh workflow run deploy-backend-webhook.yml"
echo ""
echo "Once complete, every push to main will auto-deploy! 🚀"
