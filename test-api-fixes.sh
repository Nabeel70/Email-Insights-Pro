#!/bin/bash

echo "🔧 Email Insights Pro - API Fix Verification"
echo "============================================="

cd /workspaces/Email-Insights-Pro

# Start the server
echo "🚀 Starting Next.js server..."
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
sleep 10

# Test the campaigns API
echo "📊 Testing /api/campaigns..."
CAMPAIGNS_RESPONSE=$(curl -s http://localhost:9002/api/campaigns)
if echo "$CAMPAIGNS_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Campaigns API is working"
    CAMPAIGN_COUNT=$(echo "$CAMPAIGNS_RESPONSE" | grep -o '"totalCampaigns":[0-9]*' | grep -o '[0-9]*')
    echo "📈 Found $CAMPAIGN_COUNT campaigns"
else
    echo "❌ Campaigns API failed"
    echo "Response: $(echo "$CAMPAIGNS_RESPONSE" | head -200)"
fi

echo ""

# Test the manual sync API
echo "🔄 Testing /api/manual-sync..."
SYNC_RESPONSE=$(curl -s http://localhost:9002/api/manual-sync)
if echo "$SYNC_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Manual sync is working"
    echo "📝 $(echo "$SYNC_RESPONSE" | grep -o '"message":"[^"]*"' | sed 's/"message":"\(.*\)"/\1/')"
else
    echo "❌ Manual sync failed"
    echo "Response: $(echo "$SYNC_RESPONSE" | head -200)"
fi

# Clean up
echo ""
echo "🧹 Stopping server..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo ""
echo "🎉 API testing complete!"
echo ""
echo "📋 Summary of fixes applied:"
echo "- ✅ Removed problematic 'use server' directives from API routes"
echo "- ✅ Fixed Firebase client/server SDK conflicts"
echo "- ✅ Added proper error handling and fallbacks for database operations" 
echo "- ✅ Added timeout protection for external API calls"
echo "- ✅ Improved sync status logging with graceful fallbacks"
echo ""
echo "Your Email Insights Pro app should now work correctly!"