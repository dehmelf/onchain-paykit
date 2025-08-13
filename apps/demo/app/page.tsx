'use client';
import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useWalletClient, usePublicClient, useNetwork } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { PayKitButton } from '@paykit/widget';
import { parseEther, formatEther, encodeFunctionData, keccak256, toBytes } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:4000';

// Contract addresses on Base Sepolia
const CONTRACTS = {
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  PAYMENT_ROUTER: '0x376fA17d5B005666e3F70A4915Ce40489ee7619c',
  MERCHANT_REGISTRY: '0x5E415FBd108E3381D5cEe4E345Dc588f839A8e98',
  USDC_VAULT: '0x6205084b6ac4D7A57A41Df697Ce2F567b198Db8e',
  PAYMASTER: '0xa8d5EA7fCf609C31dda3e05932428Ba7De405ebb'
};

const USDC_ABI = [
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const ROUTER_ABI = [
  {
    "inputs": [
      {
        "components": [
          {"name": "merchant", "type": "address"},
          {"name": "amount", "type": "uint256"},
          {"name": "expiresAt", "type": "uint256"},
          {"name": "ref", "type": "bytes32"},
          {"name": "payer", "type": "address"},
          {"name": "nonce", "type": "bytes32"}
        ],
        "name": "pi",
        "type": "tuple"
      },
      {"name": "serverSig", "type": "bytes"}
    ],
    "name": "pay",
    "outputs": [{"name": "", "type": "bytes32"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Ultra-Modern UI Components
const GlassCard = ({ children, className = "", variant = "default" }: { 
  children: React.ReactNode; 
  className?: string;
  variant?: "default" | "premium" | "luxury";
}) => {
  const variants = {
    default: "glass-card",
    premium: "glass-card bg-gradient-to-br from-white/20 to-white/5 border-white/30",
    luxury: "glass-card bg-gradient-to-br from-white/25 to-purple-50/10 border-purple-200/40"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`card-hover rounded-3xl p-8 ${variants[variant]} ${className}`}
    >
      {children}
    </motion.div>
  );
};

const ModernButton = ({ icon, title, subtitle, onClick, variant = "primary", disabled = false, loading = false }: {
  icon: string;
  title: string;
  subtitle?: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "success" | "warning" | "luxury";
  disabled?: boolean;
  loading?: boolean;
}) => {
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700",
    secondary: "bg-gradient-to-r from-slate-600 via-gray-700 to-slate-800 hover:from-slate-700 hover:via-gray-800 hover:to-slate-900",
    success: "bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 hover:from-emerald-600 hover:via-green-700 hover:to-teal-700",
    warning: "bg-gradient-to-r from-orange-500 via-pink-500 to-red-500 hover:from-orange-600 hover:via-pink-600 hover:to-red-600",
    luxury: "bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700"
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02, y: -2 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        group relative overflow-hidden rounded-2xl p-6 text-white font-semibold
        ${variants[variant]}
        transform transition-all duration-300 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-lg hover:shadow-2xl button-glow
        border border-white/20
      `}
    >
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl"
        >
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />
        </motion.div>
      )}
      
      <div className="flex flex-col items-center space-y-3 relative z-10">
        <motion.span 
          className="text-4xl filter drop-shadow-lg"
          animate={loading ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 0.5, repeat: loading ? Infinity : 0 }}
        >
          {icon}
        </motion.span>
        <div className="text-center">
          <div className="font-bold text-lg">{title}</div>
          {subtitle && <div className="text-sm opacity-90 font-medium">{subtitle}</div>}
        </div>
      </div>
      
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.button>
  );
};

const StatusBadge = ({ status, label, pulse = false }: { 
  status: 'online' | 'offline' | 'checking' | 'error'; 
  label: string;
  pulse?: boolean;
}) => {
  const colors = {
    online: 'from-emerald-500 to-green-600',
    offline: 'from-red-500 to-pink-600',
    checking: 'from-yellow-500 to-orange-500',
    error: 'from-red-600 to-rose-700'
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center space-x-3 px-4 py-2 rounded-full glass-effect"
    >
      <motion.div 
        className={`w-3 h-3 rounded-full bg-gradient-to-r ${colors[status]}`}
        animate={pulse ? { scale: [1, 1.2, 1] } : {}}
        transition={pulse ? { duration: 2, repeat: Infinity } : {}}
      />
      <span className="text-sm font-medium text-white">{label}</span>
    </motion.div>
  );
};

const ModernTab = ({ id, label, icon, active, onClick }: {
  id: string;
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) => (
  <motion.button
    whileHover={{ y: -3 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`
      relative px-8 py-4 rounded-2xl font-semibold transition-all duration-300
      flex items-center space-x-3 min-w-max
      ${active 
        ? 'text-white shadow-xl' 
        : 'text-gray-600 hover:text-gray-800 glass-card hover:bg-white/80'
      }
    `}
  >
    <span className="text-xl">{icon}</span>
    <span className="font-bold">{label}</span>
    
    {active && (
      <>
        <motion.div
          layoutId="activeTabBg"
          className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl"
          style={{ zIndex: -1 }}
          transition={{ type: "spring", duration: 0.6 }}
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl"
          style={{ zIndex: -1 }}
        />
      </>
    )}
  </motion.button>
);

const ActivityLogItem = ({ message, type = "info", timestamp }: { 
  message: string; 
  type?: "info" | "success" | "error" | "warning";
  timestamp: Date;
}) => {
  const styles = {
    info: { icon: "ℹ️", bg: "from-blue-50 to-indigo-50", border: "border-blue-200", text: "text-blue-800" },
    success: { icon: "✅", bg: "from-emerald-50 to-green-50", border: "border-emerald-200", text: "text-emerald-800" },
    error: { icon: "❌", bg: "from-red-50 to-pink-50", border: "border-red-200", text: "text-red-800" },
    warning: { icon: "⚠️", bg: "from-yellow-50 to-orange-50", border: "border-yellow-200", text: "text-yellow-800" }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -30, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.9 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`p-4 rounded-xl bg-gradient-to-r ${styles[type].bg} border ${styles[type].border} mb-3`}
    >
      <div className="flex items-start space-x-3">
        <span className="text-lg">{styles[type].icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${styles[type].text} leading-relaxed`}>{message}</p>
          <p className="text-xs text-gray-500 mt-1">{timestamp.toLocaleTimeString()}</p>
        </div>
      </div>
    </motion.div>
  );
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-12">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      className="relative"
    >
      <div className="w-12 h-12 border-4 border-purple-200 rounded-full" />
      <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-purple-600 rounded-full" />
    </motion.div>
  </div>
);

export default function PayKitDemo() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [merchants, setMerchants] = useState<any[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [contractData, setContractData] = useState<any>({});
  const [logs, setLogs] = useState<Array<{message: string; type: string; timestamp: Date}>>([]);
  const [apiStatus, setApiStatus] = useState('checking');
  const [paymentIntents, setPaymentIntents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Demo state
  const [testPayment, setTestPayment] = useState({
    amount: '10.50',
    reference: 'DEMO-' + Date.now(),
    description: 'Demo Coffee Purchase'
  });

  const addLog = (message: string, type: string = 'info') => {
    setLogs(prev => [{ message, type, timestamp: new Date() }, ...prev].slice(0, 50));
  };

  // Check API status
  // Improved API status check (less aggressive)
  useEffect(() => {
    let isComponentMounted = true;
    
    const checkAPI = async () => {
      if (!isComponentMounted) return;
      
      try {
        const response = await fetch(`${API_BASE}/health`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-cache"
        });
        
        if (response.ok && isComponentMounted) {
          const data = await response.json();
          setApiStatus("online");
          addLog(`🟢 API Online (${data.status || "healthy"})`, "success");
        } else if (isComponentMounted) {
          setApiStatus("error");
          addLog(`❌ API Error: ${response.status} ${response.statusText}`, "error");
        }
      } catch (error) {
        if (isComponentMounted) {
          setApiStatus("offline");
          addLog("🔴 API offline - make sure backend is running on port 4000", "warning");
        }
      }
    };
    
    // Initial check
    checkAPI();
    
    // Check every 60 seconds (less aggressive)
    const interval = setInterval(() => {
      if (isComponentMounted) checkAPI();
    }, 60000);
    
    return () => {
      isComponentMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Load contract data
  useEffect(() => {
    if (!publicClient || !address) return;
    
    const loadContractData = async () => {
      try {
        setIsLoading(true);
        
        const usdcBalance = await publicClient.readContract({
          address: CONTRACTS.USDC as `0x${string}`,
          abi: USDC_ABI,
          functionName: 'balanceOf',
          args: [address]
        });

        const ethBalance = await publicClient.getBalance({ address });

        setContractData({
          usdcBalance: Number(usdcBalance) / 1e6,
          ethBalance: formatEther(ethBalance),
          userAddress: address
        });

        addLog(`Wallet balances loaded: ${Number(usdcBalance) / 1e6} USDC, ${formatEther(ethBalance)} ETH`, 'success');
      } catch (error) {
        addLog(`Failed to load contract data: ${error}`, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadContractData();
  }, [publicClient, address]);

  const createDemoMerchant = async () => {
    if (!address) {
      addLog('Please connect your wallet first', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/v1/merchants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address,
          name: `Demo Merchant ${Date.now()}`,
          webhookUrl: 'https://webhook.site/test'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMerchants(prev => [...prev, data.merchant]);
        setSelectedMerchant(data.merchant);
        addLog(`Successfully created merchant: ${data.merchant.name}`, 'success');
        addLog(`Generated API Key: ${data.merchant.apiKey}`, 'info');
      } else {
        const error = await response.text();
        addLog(`Failed to create merchant: ${error}`, 'error');
      }
    } catch (error) {
      addLog(`Network error while creating merchant: ${error}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const createPaymentIntent = async () => {
    if (!selectedMerchant) {
      addLog('Please create and select a merchant first', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/v1/intents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: selectedMerchant.id,
          merchantAddr: selectedMerchant.address,
          amountUsd: parseFloat(testPayment.amount),
          ref: testPayment.reference
        })
      });

      if (response.ok) {
        const intent = await response.json();
        setPaymentIntents(prev => [intent, ...prev]);
        addLog(`Payment intent created for $${testPayment.amount}`, 'success');
        addLog(`Intent ID: ${intent.intentId}`, 'info');
        return intent;
      } else {
        const error = await response.text();
        addLog(`Failed to create payment intent: ${error}`, 'error');
      }
    } catch (error) {
      addLog(`Network error during intent creation: ${error}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectPayment = async () => {
    if (!walletClient || !selectedMerchant) {
      addLog('Please connect wallet and select a merchant', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const intent = await createPaymentIntent();
      if (!intent) return;

      addLog('Initiating direct contract payment...', 'info');
      
      const amountUSDC = BigInt(Math.floor(parseFloat(testPayment.amount) * 1e6));
      
      addLog('Step 1: Approving USDC spending...', 'info');
      const approveTx = await walletClient.writeContract({
        address: CONTRACTS.USDC as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [CONTRACTS.PAYMENT_ROUTER, amountUSDC]
      });
      
      addLog(`USDC approval confirmed: ${approveTx}`, 'success');
      
      const paymentIntent = {
        merchant: selectedMerchant.address as `0x${string}`,
        amount: amountUSDC,
        expiresAt: BigInt(Math.floor(new Date(intent.paymentIntent.expiresAt).getTime() / 1000)),
        ref: keccak256(toBytes(testPayment.reference)),
        payer: address as `0x${string}`,
        nonce: keccak256(toBytes(intent.intentId))
      };

      addLog('Step 2: Executing payment through PaymentRouter...', 'info');
      
      const payTx = await walletClient.writeContract({
        address: CONTRACTS.PAYMENT_ROUTER as `0x${string}`,
        abi: ROUTER_ABI,
        functionName: 'pay',
        args: [paymentIntent, intent.serverSig || '0x']
      });

      addLog(`🎉 Payment successful! Transaction: ${payTx}`, 'success');
      addLog(`View on BaseScan: https://sepolia.basescan.org/tx/${payTx}`, 'info');
      
    } catch (error: any) {
      addLog(`Payment failed: ${error.message || error}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getTestUSDC = () => {
    if (!address) {
      addLog('Please connect your wallet first', 'warning');
      return;
    }

    addLog('Opening Base Sepolia faucet for test tokens...', 'info');
    addLog('1. Get ETH from Base Sepolia faucet', 'info');
    addLog('2. Swap ETH for USDC on Uniswap or DEX', 'info');
    
    window.open('https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet', '_blank');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'merchants', label: 'Merchants', icon: '🏪' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'testing', label: 'Testing', icon: '🧪' },
    { id: 'contracts', label: 'Contracts', icon: '📜' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center"
          >
            <motion.h1
              className="hero-title gradient-text-hero text-glow text-shadow"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              PayKit Demo
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="hero-subtitle text-light max-w-4xl mx-auto text-shadow"
            >
              Experience the future of payments with USDC on Base Sepolia, powered by ERC-4337 smart wallets and gasless transactions
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-8 flex justify-center"
            >
              <ConnectButton />
            </motion.div>
          </motion.div>
        </div>

      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 pb-16">
        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="flex space-x-4 mb-12 overflow-x-auto pb-4 custom-scrollbar"
        >
          {tabs.map((tab) => (
            <ModernTab
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-8"
                >
                  <GlassCard variant="luxury">
                    <h2 className="font-display text-4xl font-bold mb-8 gradient-text text-shadow">
                      ✨ PayKit Features
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {[
                        { title: "Smart Contracts", desc: "Deployed on Base Sepolia with real USDC integration", gradient: "from-blue-500 via-cyan-500 to-teal-500", icon: "🔗" },
                        { title: "ERC-4337 Support", desc: "Gasless transactions via advanced Paymaster contracts", gradient: "from-emerald-500 via-green-500 to-lime-500", icon: "⚡" },
                        { title: "Payment Processing", desc: "Secure payment intents with EIP-712 cryptographic signatures", gradient: "from-purple-500 via-pink-500 to-rose-500", icon: "🔒" },
                        { title: "Webhooks", desc: "HMAC-signed webhook delivery system with retry logic", gradient: "from-orange-500 via-red-500 to-pink-500", icon: "🔔" }
                      ].map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.2 }}
                          className={`group p-8 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl`}
                        >
                          <div className="flex items-center space-x-4 mb-4">
                            <span className="text-4xl">{feature.icon}</span>
                            <h3 className="font-bold text-2xl">{feature.title}</h3>
                          </div>
                          <p className="text-white/90 text-lg leading-relaxed">{feature.desc}</p>
                        </motion.div>
                      ))}
                    </div>
                  </GlassCard>

                  <GlassCard variant="premium">
                    <h2 className="font-display text-4xl font-bold mb-8 gradient-text text-shadow">
                      🌐 Smart Contract Registry
                    </h2>
                    <div className="space-y-6">
                      {Object.entries(CONTRACTS).map(([name, address], index) => (
                        <motion.div
                          key={name}
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="group p-6 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 border border-white/20 hover:from-white/20 hover:to-white/10 transition-all duration-300"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-bold text-xl text-gray-800 mb-2">{name}</h3>
                              <p className="font-mono text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg break-all">
                                {address}
                              </p>
                            </div>
                            <a
                              href={`https://sepolia.basescan.org/address/${address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl"
                            >
                              View on BaseScan →
                            </a>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {activeTab === 'merchants' && (
                <motion.div
                  key="merchants"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5 }}
                >
                  <GlassCard variant="luxury">
                    <h2 className="font-display text-4xl font-bold mb-8 gradient-text text-shadow">
                      🏪 Merchant Management Hub
                    </h2>
                    
                    {!isConnected ? (
                      <div className="text-center py-16">
                        <motion.div
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.8, type: "spring" }}
                          className="mb-8"
                        >
                          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-6xl text-white mx-auto shadow-2xl">
                            🔗
                          </div>
                        </motion.div>
                        <h3 className="font-display text-2xl font-semibold text-dark mb-4">Connect Your Wallet</h3>
                        <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                          Connect your wallet to create and manage merchants, process payments, and interact with smart contracts.
                        </p>
                        <ConnectButton />
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <ModernButton
                          icon="🏪"
                          title={isLoading ? "Creating Merchant..." : "Create Demo Merchant"}
                          subtitle="Set up a new merchant account for testing"
                          onClick={createDemoMerchant}
                          variant="luxury"
                          disabled={isLoading}
                          loading={isLoading}
                        />

                        {merchants.length > 0 && (
                          <div className="space-y-6">
                            <h3 className="font-display text-2xl font-semibold text-dark">Your Merchant Accounts</h3>
                            <div className="grid gap-6">
                              {merchants.map(merchant => (
                                <motion.div
                                  key={merchant.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  whileHover={{ scale: 1.02, y: -4 }}
                                  className={`p-8 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                                    selectedMerchant?.id === merchant.id 
                                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl' 
                                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                                  }`}
                                  onClick={() => setSelectedMerchant(merchant)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                      <h4 className="font-display text-2xl font-semibold text-dark">{merchant.name}</h4>
                                      <p className="font-mono text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg inline-block">
                                        {merchant.address}
                                      </p>
                                      <p className="text-xs text-gray-500">ID: {merchant.id}</p>
                                    </div>
                                    {selectedMerchant?.id === merchant.id && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg"
                                      >
                                        ✓ Selected
                                      </motion.div>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              )}

              {activeTab === 'payments' && (
                <motion.div
                  key="payments"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-8"
                >
                  <GlassCard variant="luxury">
                    <h2 className="font-display text-4xl font-bold mb-8 gradient-text text-shadow">
                      💳 Payment Processing Center
                    </h2>
                    
                    {!selectedMerchant ? (
                      <div className="text-center py-16">
                        <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-6xl text-white mx-auto mb-8 shadow-2xl">
                          🏪
                        </div>
                        <h3 className="font-display text-2xl font-semibold text-dark mb-4">Select a Merchant</h3>
                        <p className="text-gray-600 mb-8 text-lg">Create and select a merchant to start processing payments</p>
                        <button
                          onClick={() => setActiveTab('merchants')}
                          className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-2xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl"
                        >
                          Go to Merchants →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-10">
                        {/* Payment Configuration */}
                        <div className="space-y-6">
                          <h3 className="font-display text-2xl font-semibold text-dark">Configure Payment</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                              <label className="block text-lg font-semibold text-gray-700 mb-3">Amount (USD)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={testPayment.amount}
                                onChange={(e) => setTestPayment(prev => ({ ...prev, amount: e.target.value }))}
                                className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 text-xl font-bold bg-white/80 backdrop-blur transition-all duration-300"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-lg font-semibold text-gray-700 mb-3">Reference ID</label>
                              <input
                                type="text"
                                value={testPayment.reference}
                                onChange={(e) => setTestPayment(prev => ({ ...prev, reference: e.target.value }))}
                                className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 text-lg bg-white/80 backdrop-blur transition-all duration-300"
                                placeholder="ORDER-12345"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="space-y-6">
                          <h3 className="font-display text-2xl font-semibold text-dark">Choose Payment Method</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <ModernButton
                              icon="📝"
                              title="Create Intent"
                              subtitle="Generate payment intent"
                              onClick={createPaymentIntent}
                              disabled={isLoading}
                              loading={isLoading}
                            />

                            <ModernButton
                              icon="🔗"
                              title="Direct Payment"
                              subtitle="Call contract directly"
                              onClick={testDirectPayment}
                              variant="success"
                              disabled={isLoading}
                              loading={isLoading}
                            />

                            <div className="p-8 border-2 border-purple-200 rounded-2xl text-center bg-gradient-to-br from-purple-50/80 to-pink-50/80 backdrop-blur">
                              <div className="text-4xl mb-4">🚀</div>
                              <div className="font-bold text-xl mb-2">Widget Payment</div>
                              <div className="text-sm text-gray-600 mb-4">React component integration</div>
                              {selectedMerchant && (
                                <PayKitButton
                                  merchantId={selectedMerchant.id}
                                  amountUsd={parseFloat(testPayment.amount)}
                                  refId={testPayment.reference}
                                  apiUrl={API_BASE}
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Payment History */}
                        {paymentIntents.length > 0 && (
                          <div className="space-y-6">
                            <h3 className="font-display text-2xl font-semibold text-dark">Payment History</h3>
                            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                              {paymentIntents.map(intent => (
                                <motion.div
                                  key={intent.intentId}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300"
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                      <div className="font-bold text-2xl text-green-600">
                                        ${intent.paymentIntent.amountUSDC / 1e6}
                                      </div>
                                      <div className="text-gray-600 font-medium">{intent.paymentIntent.ref}</div>
                                      <div className="text-xs text-gray-500 font-mono bg-gray-200 px-2 py-1 rounded">
                                        {intent.intentId}
                                      </div>
                                    </div>
                                    <div className="text-right text-sm text-gray-500">
                                      <div>{new Date(intent.paymentIntent.expiresAt).toLocaleString()}</div>
                                      <div className="mt-1">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                                          Pending
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              )}

              {activeTab === 'testing' && (
                <motion.div
                  key="testing"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5 }}
                >
                  <GlassCard variant="luxury">
                    <h2 className="font-display text-4xl font-bold mb-8 gradient-text text-shadow">
                      🧪 Testing Laboratory
                    </h2>
                    
                    <div className="space-y-10">
                      {/* USDC Management */}
                      <div className="p-8 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-200">
                        <div className="flex items-center space-x-4 mb-6">
                          <span className="text-4xl">💎</span>
                          <div>
                            <h3 className="text-2xl font-bold text-yellow-900">Get Test USDC</h3>
                            <p className="text-yellow-800">Current Balance: <span className="font-bold">{contractData.usdcBalance?.toFixed(6) || '0'} USDC</span></p>
                          </div>
                        </div>
                        <ModernButton
                          icon="💰"
                          title="Get Test Tokens"
                          subtitle="Open Base Sepolia faucet"
                          onClick={getTestUSDC}
                          variant="warning"
                        />
                      </div>

                      {/* Contract Testing */}
                      <div className="space-y-6">
                        <h3 className="font-display text-2xl font-semibold text-dark">Direct Contract Interactions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <ModernButton
                            icon="💰"
                            title="Check Balance"
                            subtitle="Query USDC balance"
                            onClick={async () => {
                              if (!publicClient || !address) return;
                              try {
                                const balance = await publicClient.readContract({
                                  address: CONTRACTS.USDC as `0x${string}`,
                                  abi: USDC_ABI,
                                  functionName: 'balanceOf',
                                  args: [address]
                                });
                                addLog(`Current USDC Balance: ${Number(balance) / 1e6} USDC`, 'success');
                              } catch (error) {
                                addLog(`Balance check failed: ${error}`, 'error');
                              }
                            }}
                            variant="secondary"
                          />

                          <ModernButton
                            icon="⛓️"
                            title="Network Status"
                            subtitle="Check block number"
                            onClick={async () => {
                              if (!publicClient) return;
                              try {
                                const blockNumber = await publicClient.getBlockNumber();
                                addLog(`Current block number: ${blockNumber}`, 'success');
                              } catch (error) {
                                addLog(`Network check failed: ${error}`, 'error');
                              }
                            }}
                            variant="secondary"
                          />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {activeTab === 'contracts' && (
                <motion.div
                  key="contracts"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5 }}
                >
                  <GlassCard variant="luxury">
                    <h2 className="font-display text-4xl font-bold mb-8 gradient-text text-shadow">
                      📜 Smart Contract Registry
                    </h2>
                    
                    <div className="space-y-8">
                      {Object.entries(CONTRACTS).map(([name, address], index) => (
                        <motion.div
                          key={name}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="p-8 border-2 border-gray-200 rounded-2xl bg-gradient-to-r from-white to-gray-50 hover:shadow-xl transition-all duration-300 group"
                        >
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="font-display text-2xl font-semibold text-dark mb-2">{name}</h3>
                              <div className="text-sm text-gray-500 mb-3">Smart Contract Address</div>
                            </div>
                            <a
                              href={`https://sepolia.basescan.org/address/${address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl group-hover:scale-105"
                            >
                              View on BaseScan →
                            </a>
                          </div>
                          <div className="font-mono text-sm text-gray-600 bg-gray-100 p-4 rounded-xl break-all border">
                            {address}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="mt-10 p-8 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-200"
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        <span className="text-4xl">✅</span>
                        <h3 className="font-bold text-2xl text-emerald-900">Deployment Complete</h3>
                      </div>
                      <p className="text-emerald-800 text-lg leading-relaxed">
                        All smart contracts have been successfully deployed and verified on Base Sepolia testnet. 
                        The complete PayKit infrastructure is ready for testing with an estimated deployment cost of ~0.003 ETH.
                      </p>
                    </motion.div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="sticky top-8 space-y-8"
            >
              {/* Status Card */}
              <GlassCard variant="premium">
                <h3 className="text-2xl font-bold mb-6 gradient-text">
                  🔌 Connection Status
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                      <span className="font-semibold text-gray-700">Wallet</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${chain?.id === 84532 ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                      <span className="font-semibold text-gray-700">Network</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {chain?.name || 'Not connected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${selectedMerchant ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="font-semibold text-gray-700">Merchant</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {selectedMerchant ? 'Selected' : 'None'}
                    </span>
                  </div>
                  {address && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                      <div className="text-xs text-gray-600 mb-1">Address</div>
                      <div className="font-mono text-xs text-gray-800 break-all">
                        {address.slice(0, 6)}...{address.slice(-4)}
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Activity Monitor */}
              <GlassCard variant="premium">
                <h3 className="text-2xl font-bold mb-6 gradient-text">
                  📊 Activity Monitor
                </h3>
                
                {isLoading && <LoadingSpinner />}
                
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {logs.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📝</div>
                      <p className="text-gray-500 text-lg">Activity will appear here...</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {logs.map((log, index) => (
                        <ActivityLogItem
                          key={index}
                          message={log.message}
                          type={log.type as any}
                          timestamp={log.timestamp}
                        />
                      ))}
                    </AnimatePresence>
                  )}
                </div>
                
                {logs.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setLogs([])}
                    className="mt-6 w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 font-semibold"
                  >
                    Clear Activity Log
                  </motion.button>
                )}
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
} 