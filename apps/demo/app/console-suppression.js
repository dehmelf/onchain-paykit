// Suppress development console noise
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Suppress known development warnings
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
