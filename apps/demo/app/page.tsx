'use client';
import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { PayKitButton } from '@paykit/widget';

const API_BASE = 'http://localhost:4000';

export default function DemoPage() {
  const { address } = useAccount();
  const [merchants, setMerchants] = useState<any[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [contractAddresses, setContractAddresses] = useState<any>({});

  // Demo state
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Load demo data
  useEffect(() => {
    loadDemoData();
  }, []);

  const loadDemoData = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (response.ok) {
        addLog('API connection successful');
      }
    } catch (error) {
      addLog('API connection failed - make sure to start the API server');
    }
  };

  const createMerchant = async () => {
    if (!address) {
      addLog('Connect wallet first');
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
          webhookUrl: 'https://webhook.site/unique-id'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMerchants(prev => [...prev, data.merchant]);
        setSelectedMerchant(data.merchant);
        addLog(`Created merchant: ${data.merchant.name}`);
        addLog(`API Key: ${data.merchant.apiKey}`);
      } else {
        addLog('Failed to create merchant');
      }
    } catch (error) {
      addLog('Error creating merchant');
    }
    setIsLoading(false);
  };

  const testPayment = async () => {
    if (!selectedMerchant) {
      addLog('Select a merchant first');
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
          amountUsd: 5.00,
          ref: `ORDER-${Date.now()}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        addLog(`Created payment intent: ${data.intentId}`);
        addLog(`Amount: $5.00 USDC`);
        addLog(`Server signature: ${data.serverSig}`);
      } else {
        addLog('Failed to create payment intent');
      }
    } catch (error) {
      addLog('Error creating payment intent');
    }
    setIsLoading(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Connection Section */}
      <section style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginTop: 0 }}>1. Connect Wallet</h2>
        <p style={{ color: '#666' }}>Connect your wallet to interact with PayKit on Base Sepolia</p>
        <ConnectButton />
        {address && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
            <strong>Connected:</strong> {address}
          </div>
        )}
      </section>

      {/* Merchant Section */}
      <section style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginTop: 0 }}>2. Create Merchant</h2>
        <p style={{ color: '#666' }}>Register as a merchant to start accepting payments</p>
        <button 
          onClick={createMerchant}
          disabled={!address || isLoading}
          style={{
            padding: '12px 24px',
            backgroundColor: address && !isLoading ? '#0052ff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: address && !isLoading ? 'pointer' : 'not-allowed',
            fontWeight: '600'
          }}
        >
          {isLoading ? 'Creating...' : 'Create Merchant'}
        </button>

        {merchants.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h4>Your Merchants:</h4>
            {merchants.map((merchant, i) => (
              <div 
                key={i}
                style={{ 
                  padding: '0.5rem', 
                  margin: '0.5rem 0',
                  backgroundColor: selectedMerchant?.id === merchant.id ? '#e3f2fd' : '#f5f5f5',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedMerchant(merchant)}
              >
                <strong>{merchant.name}</strong> - {merchant.address}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Payment Section */}
      <section style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginTop: 0 }}>3. Test Payment</h2>
        <p style={{ color: '#666' }}>Create and process a test payment</p>
        
        <div style={{ marginBottom: '1rem' }}>
          <button 
            onClick={testPayment}
            disabled={!selectedMerchant || isLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: selectedMerchant && !isLoading ? '#28a745' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: selectedMerchant && !isLoading ? 'pointer' : 'not-allowed',
              fontWeight: '600',
              marginRight: '1rem'
            }}
          >
            Create Payment Intent
          </button>
        </div>

        {selectedMerchant && (
          <div style={{ marginTop: '1rem', padding: '1rem', border: '2px dashed #ddd', borderRadius: '8px' }}>
            <h4>PayKit Widget Demo:</h4>
            <PayKitButton
              merchantId={selectedMerchant.id}
              amountUsd={5.00}
              refId={`DEMO-${Date.now()}`}
              apiUrl={API_BASE}
            />
          </div>
        )}
      </section>

      {/* Contract Interaction Section */}
      <section style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginTop: 0 }}>4. Contract Interaction</h2>
        <p style={{ color: '#666' }}>Direct interaction with smart contracts on Base Sepolia</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <h4>Payment Router</h4>
            <p>Address: {contractAddresses.paymentRouter || 'Not deployed'}</p>
            <button style={{ padding: '8px 16px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px' }}>
              View Contract
            </button>
          </div>
          
          <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <h4>USDC Vault</h4>
            <p>Address: {contractAddresses.usdcVault || 'Not deployed'}</p>
            <button style={{ padding: '8px 16px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px' }}>
              Check Balance
            </button>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <h4>Merchant Registry</h4>
            <p>Address: {contractAddresses.merchantRegistry || 'Not deployed'}</p>
            <button style={{ padding: '8px 16px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px' }}>
              View Merchants
            </button>
          </div>
        </div>
      </section>

      {/* Logs Section */}
      <section style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginTop: 0 }}>Activity Log</h2>
        <div style={{ 
          height: '200px', 
          overflowY: 'scroll', 
          backgroundColor: '#f8f9fa', 
          padding: '1rem', 
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#666' }}>No activity yet...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>{log}</div>
            ))
          )}
        </div>
        <button 
          onClick={() => setLogs([])}
          style={{ 
            marginTop: '0.5rem', 
            padding: '4px 8px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            fontSize: '12px'
          }}
        >
          Clear Logs
        </button>
      </section>
    </div>
  );
} 