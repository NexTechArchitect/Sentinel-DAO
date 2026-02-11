import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // "WalletConnect initialized 2 times" wala error fix
  webpack: (config) => {
    config.externals.push(
      "pino-pretty", 
      "lokijs", 
      "encoding",
      "@react-native-async-storage/async-storage" // MetaMask warning fix
    );
    return config;
  },
};

export default nextConfig;
