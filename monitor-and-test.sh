#!/bin/bash

APP_ID="d16r0sztrtkakf"
BRANCH="main"
REGION="us-east-1"
API_URL="https://76hqbcmos7.execute-api.us-east-1.amazonaws.com"

echo "📊 Monitoring Amplify build..."
echo ""

while true; do
  STATUS=$(aws amplify list-jobs --app-id $APP_ID --branch-name $BRANCH --region $REGION --max-items 1 --query 'jobSummaries[0].status' --output text 2>/dev/null)
  
  if [ "$STATUS" = "SUCCEED" ]; then
    echo "✅ Build completed successfully!"
    echo ""
    break
  elif [ "$STATUS" = "FAILED" ]; then
    echo "❌ Build failed!"
    exit 1
  elif [ "$STATUS" = "RUNNING" ] || [ "$STATUS" = "PENDING" ]; then
    echo -n "⏳ Build status: $STATUS... "
    sleep 10
    echo ""
  else
    echo "Unknown status: $STATUS"
    sleep 10
  fi
done

echo "🧪 Testing API endpoint..."
echo ""

# Test the vaccine parsing endpoint
echo "📝 Testing vaccine parsing..."
RESPONSE=$(curl -s -X POST "$API_URL/api/parse-vaccine-history" \
  -H "Content-Type: application/json" \
  -d '{
    "vaccineData": "DTaP administered on 2021-01-15 at age 2 months\nMMR given 2022-07-20 at 18 months",
    "birthDate": "2020-11-15"
  }')

echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q '"vaccines"'; then
  echo "🎉 API test PASSED! Bedrock integration is working!"
else
  echo "⚠️  API test failed. Response: $RESPONSE"
fi
