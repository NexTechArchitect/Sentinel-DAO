#!/bin/bash

# 1. Clean Up
echo "🧹 Cleaning old files..."
rm -rf node_modules .next package-lock.json src public
mkdir -p src/app src/components src/config src/providers public

# 2. Write Package.json (FIXED VERSIONS)
echo "📦 Creating configuration..."
cat > package.json << 'EOF'
{
  "name": "sentinel-dao",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3005",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@rainbow-me/rainbowkit": "^2.1.0",
    "@tanstack/react-query": "^5.25.0",
    "framer-motion": "^11.0.3",
    "lucide-react": "^0.344.0",
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "viem": "^2.19.0",
    "wagmi": "^2.12.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
EOF

# 3. Write Config Files
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: {} },
  plugins: [],
}
EOF

cat > postcss.config.js << 'EOF'
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }
EOF

# 4. Write Styling (Cyberpunk)
cat > src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&display=swap');

:root { --neon-blue: #00f3ff; --bg-dark: #030014; }
body { color: white; background: var(--bg-dark); font-family: 'Rajdhani', sans-serif; overflow-x: hidden; }

.cyber-grid {
  position: fixed; inset: 0; z-index: 0;
  background-image: linear-gradient(to right, rgba(0, 243, 255, 0.05) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0, 243, 255, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
}
.glass-panel {
  background: rgba(13, 13, 25, 0.7); backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 243, 255, 0.1);
}
EOF

# 5. Write Wagmi Config
cat > src/config/wagmi.ts << 'EOF'
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';
export const config = getDefaultConfig({
  appName: 'Sentinel DAO',
  projectId: 'YOUR_PROJECT_ID',
  chains: [mainnet, sepolia],
  ssr: true,
});
EOF

# 6. Write Providers
cat > src/providers/Web3Provider.tsx << 'EOF'
'use client';
import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from '../config/wagmi';
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
EOF

# 7. Write Layout
cat > src/app/layout.tsx << 'EOF'
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Providers } from "../providers/Web3Provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><div className="cyber-grid"></div><Providers>{children}</Providers></body>
    </html>
  );
}
EOF

# 8. Write Page UI
cat > src/app/page.tsx << 'EOF'
'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Shield, Activity, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col z-10 p-6">
      <nav className="flex justify-between items-center h-20 border-b border-white/10 mb-12">
        <div className="flex items-center gap-2">
          <Shield className="text-[#00f3ff]" />
          <span className="text-2xl font-bold">SENTINEL DAO</span>
        </div>
        <ConnectButton />
      </nav>
      
      <main className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-7xl font-bold mb-6">FUTURE <br /><span className="text-[#00f3ff]">INITIATED</span></h1>
          <button className="px-8 py-3 bg-[#00f3ff] text-black font-bold flex gap-2 hover:opacity-90">
            ENTER APP <ArrowRight />
          </button>
        </div>
        <div className="glass-panel p-8 rounded-xl border border-[#00f3ff]/30">
          <div className="flex justify-between mb-8">
            <span className="text-gray-400">TVL</span>
            <span className="text-3xl font-bold">$42,069,101</span>
          </div>
          <div className="flex items-center gap-2 text-green-400">
            <Activity size={16} /> <span>System Operational</span>
          </div>
        </div>
      </main>
    </div>
  );
}
EOF

# 9. Run Installation
echo "🚀 Installing Dependencies..."
npm install --legacy-peer-deps

echo "✨ Starting Server..."
npm run dev
