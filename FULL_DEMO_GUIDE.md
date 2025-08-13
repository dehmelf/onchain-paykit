# 🚀 PayKit Full-Scale Demo Guide

## 🎯 Complete USDC Payment System on Base Sepolia

This is a **production-ready** demonstration of PayKit - a complete USDC payment processing system featuring ERC-4337 smart wallets, gas sponsorship, and real-time webhook delivery.

---

## 🌟 **What You're About to Experience**

### ✅ **Fully Deployed & Live**
- **Smart Contracts:** All deployed on Base Sepolia testnet
- **API Server:** Running with Base Sepolia integration
- **Demo App:** Interactive web interface with all features
- **Real USDC:** Using actual USDC contracts on Base Sepolia

### 🔥 **Key Features You Can Test**

1. **🏪 Merchant Management**
   - Create and manage merchants
   - Generate API keys
   - Configure webhook endpoints

2. **💳 Payment Processing**
   - Create payment intents with EIP-712 signatures
   - Process payments via smart contracts
   - Real USDC transfers on Base Sepolia

3. **🤖 ERC-4337 Integration**
   - Smart wallet compatibility
   - Gas sponsorship via Paymaster
   - Account abstraction features

4. **🔔 Webhook System**
   - HMAC-signed webhook delivery
   - Real-time payment notifications
   - Event tracking and retry logic

5. **🧪 Advanced Testing**
   - Direct contract interaction
   - Balance checking
   - Transaction monitoring

---

## 🚀 **Quick Start (3 Steps)**

### 1. **Open the Demo**
```bash
# The demo is running at:
http://localhost:3001
```

### 2. **Connect Your Wallet**
- Click "Connect Wallet" 
- Make sure you're on **Base Sepolia** (Chain ID: 84532)
- Get test ETH: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

### 3. **Start Testing**
- Create a merchant
- Configure a test payment
- Process real USDC transactions!

---

## 📋 **Deployed Contract Addresses**

| Contract | Address | BaseScan Link |
|----------|---------|---------------|
| **USDC** | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | [View](https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e) |
| **PaymentRouter** | `0x376fA17d5B005666e3F70A4915Ce40489ee7619c` | [View](https://sepolia.basescan.org/address/0x376fA17d5B005666e3F70A4915Ce40489ee7619c) |
| **MerchantRegistry** | `0x5E415FBd108E3381D5cEe4E345Dc588f839A8e98` | [View](https://sepolia.basescan.org/address/0x5E415FBd108E3381D5cEe4E345Dc588f839A8e98) |
| **USDCVault** | `0x6205084b6ac4D7A57A41Df697Ce2F567b198Db8e` | [View](https://sepolia.basescan.org/address/0x6205084b6ac4D7A57A41Df697Ce2F567b198Db8e) |
| **Paymaster** | `0xa8d5EA7fCf609C31dda3e05932428Ba7De405ebb` | [View](https://sepolia.basescan.org/address/0xa8d5EA7fCf609C31dda3e05932428Ba7De405ebb) |

---

## 🎮 **Complete Demo Walkthrough**

### **Phase 1: Setup & Connection**
1. **Navigate to Demo**: Open http://localhost:3001
2. **Connect Wallet**: Use MetaMask, Coinbase Wallet, or WalletConnect
3. **Switch Network**: Ensure Base Sepolia (84532) is selected
4. **Fund Wallet**: Get ETH from Base Sepolia faucet

### **Phase 2: Merchant Creation**
1. Go to **🏪 Merchants** tab
2. Click **"Create Demo Merchant"**
3. Sign the transaction
4. Note your **API Key** in the activity log
5. Select your merchant for subsequent tests

### **Phase 3: Payment Testing**
1. Navigate to **💳 Payments** tab
2. Configure test payment:
   - **Amount**: $10.50 (or any amount)
   - **Reference**: Unique order ID
   - **Description**: Payment description

3. **Test Methods:**
   - **📝 Create Intent**: Generate signed payment intent
   - **🔗 Direct Payment**: Call contract directly with USDC approval
   - **🚀 Widget Payment**: Use the embedded PayKit widget

### **Phase 4: Advanced Features**
1. **🧪 Testing Tab**:
   - Check USDC balance
   - Get test USDC tokens
   - Monitor blockchain state

2. **🔔 Webhooks Tab**:
   - Configure webhook endpoints
   - Test webhook delivery
   - Monitor event logs

3. **📜 Contracts Tab**:
   - View all deployed contracts
   - Check deployment status
   - Access BaseScan links

---

## 💰 **Getting Test USDC**

### **Method 1: Base Sepolia Faucet** ⭐ Recommended
1. Get ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
2. Visit Uniswap Base Sepolia
3. Swap ETH → USDC

### **Method 2: Bridge from Ethereum Sepolia**
1. Get USDC on Ethereum Sepolia
2. Use Base bridge to transfer to Base Sepolia

### **Method 3: Direct Contract Call** (Advanced)
```bash
# If you have a USDC faucet contract address, call it directly
cast send USDC_FAUCET_ADDRESS "mint(address,uint256)" YOUR_ADDRESS 1000000000 --rpc-url https://sepolia.base.org --private-key YOUR_KEY
```

---

## 🔍 **Testing Scenarios**

### **Scenario 1: Happy Path Payment**
1. Create merchant
2. Create payment intent for $5.00
3. Approve USDC spending
4. Execute payment via contract
5. Verify transaction on BaseScan
6. Check merchant balance in USDCVault

### **Scenario 2: Widget Integration**
1. Configure payment in widget
2. Test embedded PayKit button
3. Complete payment flow
4. Verify webhook delivery

### **Scenario 3: Error Handling**
1. Try payment without USDC balance
2. Test expired payment intents
3. Try double-spending same intent
4. Verify proper error messages

### **Scenario 4: Webhook Testing**
1. Configure webhook URL (use webhook.site)
2. Process a payment
3. Verify HMAC signature
4. Check event delivery logs

---

## 🛠 **Technical Architecture**

### **Smart Contracts (Base Sepolia)**
- **PaymentRouter**: Validates intents, processes payments, handles fees
- **MerchantRegistry**: Manages merchant allowlist and metadata
- **USDCVault**: Custodies merchant funds, enables batch payouts
- **Paymaster**: ERC-4337 gas sponsorship for qualifying transactions

### **Backend API (Node.js + Fastify)**
- **Intent Creation**: EIP-712 signed payment intents
- **Webhook Delivery**: HMAC-signed event notifications
- **Merchant Management**: Registration and API key generation
- **Payout Processing**: Batch merchant fund distribution

### **Frontend (Next.js + Wagmi)**
- **Demo Interface**: Comprehensive testing environment
- **Widget Integration**: Embeddable payment component
- **Real-time Logs**: Activity monitoring and debugging
- **Contract Interaction**: Direct blockchain communication

---

## 🔐 **Security Features**

### **Payment Security**
- ✅ EIP-712 signed payment intents
- ✅ Server-side signature validation
- ✅ Intent expiration and nonce protection
- ✅ Double-spend prevention

### **API Security**
- ✅ API key authentication
- ✅ HMAC webhook signatures
- ✅ Rate limiting and validation
- ✅ Secure key management

### **Contract Security**
- ✅ Access control modifiers
- ✅ Reentrancy protection
- ✅ Merchant allowlist verification
- ✅ Amount and fee validation

---

## 📊 **Monitoring & Analytics**

### **Real-time Activity Log**
- ✅ All API calls and responses
- ✅ Contract interactions
- ✅ Webhook deliveries
- ✅ Error tracking

### **Transaction Monitoring**
- ✅ BaseScan integration
- ✅ Gas usage tracking
- ✅ Payment confirmations
- ✅ Balance updates

---

## 🚨 **Troubleshooting**

### **Common Issues**

**❌ API Offline**
```bash
# Restart API server
cd apps/api && pnpm run dev
```

**❌ Demo App Not Loading**
```bash
# Restart demo app
cd apps/demo && pnpm run dev
```

**❌ Wallet Connection Issues**
- Ensure Base Sepolia is added to MetaMask
- Check you have sufficient ETH for gas
- Verify contract addresses are correct

**❌ USDC Balance Issues**
- Use Base Sepolia faucet to get ETH
- Swap ETH for USDC on Uniswap
- Check you're on the correct network

### **Debug Commands**

```bash
# Check USDC balance
cast call 0x036CbD53842c5426634e7929541eC2318f3dCF7e "balanceOf(address)" YOUR_ADDRESS --rpc-url https://sepolia.base.org

# Check merchant registration
cast call 0x5E415FBd108E3381D5cEe4E345Dc588f839A8e98 "isMerchant(address)" YOUR_ADDRESS --rpc-url https://sepolia.base.org

# Check merchant vault balance
cast call 0x6205084b6ac4D7A57A41Df697Ce2F567b198Db8e "balanceOf(address)" YOUR_ADDRESS --rpc-url https://sepolia.base.org
```

---

## 🎉 **What Makes This Demo Special**

### **🔥 Production Ready**
- Real smart contracts on Base Sepolia
- Actual USDC token integration
- Production-grade API architecture
- Enterprise webhook system

### **🚀 Complete Feature Set**
- End-to-end payment processing
- ERC-4337 account abstraction
- Gas sponsorship via Paymaster
- Real-time event notifications

### **🧪 Comprehensive Testing**
- Interactive demo interface
- Multiple payment methods
- Error scenario handling
- Performance monitoring

### **📖 Developer Friendly**
- Full source code access
- Detailed documentation
- Clear architecture
- Easy customization

---

## 🌟 **Next Steps**

### **For Developers**
1. **Fork & Customize**: Adapt for your use case
2. **Deploy to Mainnet**: Use Base mainnet for production
3. **Integrate Your App**: Embed PayKit widget
4. **Scale Operations**: Add merchant onboarding flow

### **For Businesses**
1. **Test Integration**: Verify payment flows
2. **Evaluate Features**: Check webhook reliability
3. **Plan Deployment**: Estimate costs and timeline
4. **Request Support**: Get implementation assistance

---

## 📞 **Support & Resources**

- **Demo URL**: http://localhost:3001
- **API Docs**: http://localhost:4000/docs (if available)
- **BaseScan**: https://sepolia.basescan.org
- **Base Faucet**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

---

## 🏆 **Achievement Unlocked**

**You now have a complete, production-ready USDC payment system running on Base Sepolia!**

This demo showcases everything from smart contract deployment to webhook delivery, giving you a full understanding of how modern crypto payment systems work.

**Ready to process your first payment? Let's go! 🚀** 