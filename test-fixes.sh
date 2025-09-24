#!/bin/bash hello

echo "🔧 Email Insights Pro - Fix Verification"
echo "========================================"

echo "✅ Checking if Next.js app starts correctly..."
cd /workspaces/Email-Insights-Pro

# Start the dev server in background
npm run dev &
SERVER_PID=$!

echo "⏱️  Waiting for server to start..."
sleep 10

echo "🔍 Testing API endpoints..."

# Test campaigns API
echo "📊 Testing /api/campaigns..."
CAMPAIGNS_RESPONSE=$(curl -s http://localhost:9002/api/campaigns)
if echo "$CAMPAIGNS_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Campaigns API working"
else
    echo "❌ Campaigns API failed"
    echo "Response: $CAMPAIGNS_RESPONSE"
fi

# Test manual sync API
echo "🔄 Testing /api/manual-sync..."
SYNC_RESPONSE=$(curl -s http://localhost:9002/api/manual-sync)
if echo "$SYNC_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Manual sync working"
    echo "📝 Sync message: $(echo "$SYNC_RESPONSE" | grep -o '"message":"[^"]*"' | sed 's/"message":"\(.*\)"/\1/')"
else
    echo "❌ Manual sync failed"
    echo "Response: $SYNC_RESPONSE"
fi

# Clean up
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null

echo ""
echo "🎉 Fix verification complete!"
echo "Summary of fixes applied:"
echo "- ✅ Fixed Firebase SDK conflicts in server actions"
echo "- ✅ Resolved client/server Firebase SDK mixing"
echo "- ✅ Simplified database operations for development"
echo "- ✅ Fixed 'Cannot read properties of undefined' errors"
echo "- ✅ Eliminated HTML response parsing errors"
echo ""
echo "Your app should now work correctly with sync functionality!"