'use client';
import React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';

const config = getDefaultConfig({
  appName: 'PayKit Demo',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'demo',
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org')
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Suppress console errors in development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error;
      const originalWarn = console.warn;
      
      console.error = (...args) => {
        const message = args.join(' ');
        if (
          message.includes('indexedDB is not defined') ||
          message.includes('WalletConnect Core is already initialized') ||
          message.includes('pino-pretty') ||
          message.includes('unhandledRejection') ||
          message.includes('webpack-internal') ||
          message.includes('Critical dependency') ||
          message.includes('Module not found')
        ) {
          return;
        }
        originalError.apply(console, args);
      };
      
      console.warn = (...args) => {
        const message = args.join(' ');
        if (
          message.includes('Module not found') ||
          message.includes('pino-pretty') ||
          message.includes('webpack')
        ) {
          return;
        }
        originalWarn.apply(console, args);
      };
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <title>PayKit • Modern USDC Payments on Base</title>
        <meta name="description" content="Experience the future of payments with USDC on Base Sepolia, powered by ERC-4337 smart wallets and gasless transactions" />
      </head>
      <body className="scroll-smooth">
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              <div className="min-h-screen relative overflow-hidden">
                {/* Floating Background Orbs */}
                <div className="floating-orb"></div>
                <div className="floating-orb"></div>
                <div className="floating-orb"></div>
                
                {/* Main Content */}
                <div className="relative z-10">
                  {children}
                </div>
              </div>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
