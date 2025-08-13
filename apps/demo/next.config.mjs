/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode to reduce console warnings
  transpilePackages: ['@paykit/widget'],
  
  // Suppress hydration warnings and other dev noise
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  
  // Suppress webpack warnings
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Suppress warnings
    config.ignoreWarnings = [
      { module: /node_modules/ },
      /Critical dependency/,
      /Can't resolve/,
    ];
    
    return config;
  },
  
  // Suppress other console noise
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
