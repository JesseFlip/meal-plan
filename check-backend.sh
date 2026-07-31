#!/bin/bash
# Quick script to check backend status
#
# Usage: ./check-backend.sh [API_URL]
# Defaults to $API_URL env var, then https://fridgeplan-api.onrender.com
# (rename to match your actual Render service URL).

API_URL="${1:-${API_URL:-https://fridgeplan-api.onrender.com}}"

echo "🔍 Checking backend health at ${API_URL}..."
echo ""

# Check health endpoint
HEALTH=$(curl -s "${API_URL}/api/health" || echo "FAILED")

if echo "$HEALTH" | grep -q "ok"; then
    echo "✅ Backend is running"
    echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"
else
    echo "❌ Backend is not responding"
    echo "   (Render free tier sleeps after 15 min idle — first request can take ~30-50s to wake it)"
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
echo "💡 If the backend is down or missing endpoints, check:"
echo "   1. Render dashboard → fridgeplan-api → Logs"
echo "   2. GitHub Actions CI: https://github.com/JesseFlip/meal-plan/actions"
