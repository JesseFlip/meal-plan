#!/bin/bash
# Quick script to check backend status and deploy if needed

EC2_HOST="50.19.129.245"
API_URL="http://${EC2_HOST}:8002"

echo "🔍 Checking backend health..."
echo ""

# Check health endpoint
HEALTH=$(curl -s "${API_URL}/api/health" || echo "FAILED")

if echo "$HEALTH" | grep -q "ok"; then
    echo "✅ Backend is running"
    echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"
else
    echo "❌ Backend is not responding"
fi

echo ""
echo "🔍 Checking share endpoint..."

# Check if share endpoint exists (will return 400 without proper data, but not 404)
SHARE_CHECK=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_URL}/api/share" \
  -H "Content-Type: application/json" \
  -d '{}')

if [ "$SHARE_CHECK" = "404" ]; then
    echo "❌ Share endpoint not found (404)"
    echo "   Backend needs to be deployed"
elif [ "$SHARE_CHECK" = "400" ]; then
    echo "✅ Share endpoint exists (returns 400 for invalid data)"
else
    echo "⚠️  Share endpoint returned: $SHARE_CHECK"
fi

echo ""
echo "📊 Summary:"
echo "   Backend URL: ${API_URL}"
echo "   Health: $(echo $HEALTH | grep -q ok && echo '✅ OK' || echo '❌ DOWN')"
echo "   Share API: $([ "$SHARE_CHECK" != "404" ] && echo '✅ Available' || echo '❌ Missing')"
echo ""
echo "💡 If share API is missing, check:"
echo "   1. GitHub Actions: https://github.com/JesseFlip/meal-plan/actions"
echo "   2. Or deploy manually with: ssh ubuntu@${EC2_HOST} '/home/ubuntu/deploy.sh'"
