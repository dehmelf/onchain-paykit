#!/bin/bash

# API Test Script for PayKit API
# Replace this with your actual deployment URL
API_URL="https://onchain-payment-3i0h56zqr-dehmelfs-projects.vercel.app"

echo "==========================================="
echo "Testing PayKit API at: $API_URL"
echo "==========================================="
echo ""

# Test 1: Root endpoint
echo "1. Testing Root Endpoint (/):"
echo "------------------------------"
curl -s "$API_URL/" | python3 -m json.tool || echo "Failed to parse JSON"
echo ""

# Test 2: Health check
echo "2. Testing Health Check (/health):"
echo "-----------------------------------"
curl -s "$API_URL/health" | python3 -m json.tool || echo "Failed to parse JSON"
echo ""

# Test 3: Payment Intents endpoint (POST)
echo "3. Testing Payment Intents Creation (/intents/v1/intents):"
echo "-----------------------------------------------------------"
curl -s -X POST "$API_URL/intents/v1/intents" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "test-merchant-001",
    "merchantAddr": "0x090bE611824D8A6957D075bB0AE9A2Be9e95abc4",
    "amountUsd": 10.50,
    "ref": "order-123",
    "payerHint": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb3"
  }' | python3 -m json.tool || echo "Failed to parse JSON"
echo ""

# Test 4: CORS headers check
echo "4. Testing CORS Headers:"
echo "-------------------------"
curl -I -X OPTIONS "$API_URL/health" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" 2>/dev/null | grep -E "^(HTTP|access-control|Access-Control)"
echo ""

# Test 5: Check response time
echo "5. Testing Response Time:"
echo "-------------------------"
time curl -s -o /dev/null -w "Status: %{http_code}\nTime: %{time_total}s\n" "$API_URL/health"
echo ""

echo "==========================================="
echo "API Test Complete!"
echo "==========================================="
