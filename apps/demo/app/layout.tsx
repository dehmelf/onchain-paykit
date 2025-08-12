'use client';
import React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { coinbaseWallet, metaMask } from 'wagmi/connectors';
import '@rainbow-me/rainbowkit/styles.css';

const config = getDefaultConfig({
  appName: 'PayKit Demo',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'demo',
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({ appName: 'PayKit Demo' }),
    metaMask()
  ],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org')
  }
});

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>PayKit Demo - Base Sepolia</title>
        <meta name="description" content="Interactive demo of PayKit on Base Sepolia" />
      </head>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
                <header style={{ 
                  backgroundColor: '#0052ff', 
                  color: 'white', 
                  padding: '1rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
                    PayKit Demo - Base Sepolia
                  </h1>
                  <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                    Interactive USDC payments with ERC-4337 smart wallets
                  </p>
                </header>
                <main>{children}</main>
              </div>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
} 