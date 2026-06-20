# 🚀 CI/CD Setup Guide

This will enable **automatic deployment** every time you push to `main`.

## What You'll Get

After setup:
- **Frontend**: Already auto-deploys via Netlify ✅
- **Backend**: Will auto-deploy via GitHub Actions webhook ✅

**Push to main → Live in 30 seconds**

---

## One-Time Setup (5 minutes)

### Step 1: Run Setup Script on EC2

```bash
# Copy the setup script to EC2 and run it
cat setup-cicd.sh | ssh ubuntu@50.19.129.245 'bash -s'
```

The script will:
1. Generate a secure webhook secret
2. Pull the latest code
3. Install the webhook service
4. Start it as a background service

**IMPORTANT:** The script will display a secret key - copy it!

### Step 2: Add Secret to GitHub

1. Go to https://github.com/JesseFlip/meal-plan/settings/secrets/actions
2. Click "New repository secret"
3. Name: `DEPLOY_WEBHOOK_SECRET`
4. Value: (paste the secret from Step 1)
5. Click "Add secret"

### Step 3: Update EC2 Security Group

1. Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
2. Click "Security Groups" in the left sidebar
3. Find your EC2 instance's security group
4. Click "Edit inbound rules"
5. Click "Add rule"
   - Type: **Custom TCP**
   - Port: **8003**
   - Source: **0.0.0.0/0** (or restrict to GitHub IPs for security)
6. Click "Save rules"

### Step 4: Test It!

```bash
# Trigger a test deployment
gh workflow run deploy-backend-webhook.yml

# Watch it run
gh run watch

# Verify backend has new code
bash check-backend.sh
```

If successful, you should see:
```
✅ Backend deployed successfully!
✅ Backend is healthy
✅ Share API: Available
```

---

## How It Works

```
You push to main
     ↓
GitHub Actions triggers
     ↓
Sends webhook to EC2:8003
     ↓
EC2 receives webhook
     ↓
Runs deploy.sh script
     ↓
Pulls code & restarts service
     ↓
Live in ~30 seconds! 🎉
```

---

## Testing the CI/CD Pipeline

1. Make a small change:
   ```bash
   # Add a version number to the health endpoint
   echo "# Test change" >> api/main.py
   git add -A
   git commit -m "test: verify CI/CD pipeline"
   git push
   ```

2. Watch the deployment:
   ```bash
   # GitHub Actions will automatically run
   gh run list --limit 1
   gh run watch
   ```

3. Verify it deployed:
   ```bash
   bash check-backend.sh
   ```

---

## Troubleshooting

### Webhook service not starting
```bash
ssh ubuntu@50.19.129.245
sudo systemctl status deploy-webhook
sudo journalctl -u deploy-webhook -f
```

### Deployment webhook returns 401
- Check that `DEPLOY_WEBHOOK_SECRET` in GitHub matches the one on EC2:
  ```bash
  ssh ubuntu@50.19.129.245 'sudo systemctl show deploy-webhook | grep WEBHOOK_SECRET'
  ```

### Port 8003 not accessible
- Check EC2 security group allows inbound TCP 8003
- Test locally on EC2:
  ```bash
  ssh ubuntu@50.19.129.245 'curl http://localhost:8003/webhook/health'
  ```

### GitHub Actions shows 404 or timeout
- Verify webhook service is running: `sudo systemctl status deploy-webhook`
- Check firewall: `sudo ufw status` (should allow 8003 or be inactive)
- Test from external: `curl http://50.19.129.245:8003/webhook/health`

---

## Rollback

If something breaks, you can always deploy manually:

```bash
ssh ubuntu@50.19.129.245 '/home/ubuntu/deploy.sh'
```

Or disable the webhook and use SSH deployment:
```bash
ssh ubuntu@50.19.129.245 'sudo systemctl stop deploy-webhook'
```

---

## Alternative: Use Netlify Functions for Backend

If EC2 setup is too complex, you can deploy the entire backend to **Netlify Functions** (serverless):

1. Move `api/` to `netlify/functions/`
2. Each endpoint becomes a serverless function
3. Auto-deploys with the frontend
4. No server management needed

Trade-off: WebSocket support is limited on serverless. You'd need to use polling or a separate WebSocket service (Pusher, Ably, etc.)

Let me know if you want help setting up the serverless approach instead!
