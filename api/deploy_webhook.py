#!/usr/bin/env python3
"""
Webhook endpoint for deployment - EC2 server pulls changes when GitHub triggers this.
Run on EC2 with: uvicorn deploy_webhook:app --host 0.0.0.0 --port 8003
"""

import subprocess
import hashlib
import hmac
from fastapi import FastAPI, Request, HTTPException, Header
from typing import Optional

app = FastAPI()

# Set this as a GitHub secret and environment variable on EC2
WEBHOOK_SECRET = "your-webhook-secret-here"  # Change this!


def verify_signature(payload: bytes, signature: str) -> bool:
    """Verify GitHub webhook signature"""
    if not signature:
        return False

    hash_obj = hmac.new(
        WEBHOOK_SECRET.encode("utf-8"), msg=payload, digestmod=hashlib.sha256
    )
    expected_signature = "sha256=" + hash_obj.hexdigest()
    return hmac.compare_digest(expected_signature, signature)


@app.post("/webhook/deploy")
async def deploy_webhook(
    request: Request, x_hub_signature_256: Optional[str] = Header(None)
):
    """Handle GitHub webhook and trigger deployment"""
    payload = await request.body()

    # Verify webhook is from GitHub
    if not verify_signature(payload, x_hub_signature_256):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # Run deployment script
    try:
        result = subprocess.run(
            ["/home/ubuntu/deploy.sh"], capture_output=True, text=True, timeout=120
        )

        return {
            "status": "success" if result.returncode == 0 else "failed",
            "stdout": result.stdout,
            "stderr": result.stderr,
            "return_code": result.returncode,
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Deployment timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/webhook/health")
def health():
    """Health check for webhook service"""
    return {"ok": True, "service": "deploy-webhook"}
