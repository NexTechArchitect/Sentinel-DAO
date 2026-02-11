#!/bin/bash

echo "🔥 Initiating Cyberpunk Protocol V2..."

# 1. Update Tailwind Config (For Neon Colors)
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          pink: "#ff00ff",
          cyan: "#00f3ff",
          purple: "#bc13fe",
          dark: "#0a0a0a",
          glass: "rgba(255, 255, 255, 0.05)",
        }
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'grid-move': 'grid-move 20s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 1, filter: 'drop-shadow(0 0 5px #ff00ff)' },
          '50%': { opacity: .5, filter: 'drop-shadow(0 0 20px #ff00ff)' },
        },
        'grid-move': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(40px)' },
        }
      }
    },
  },
  plugins: [],
}
EOF

# 2. Update CSS (The Glowing Effects)
cat > src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap');

body {
  background-color: #050505;
  color: white;
  font-family: 'Rajdhani', sans-serif;
  overflow-x: hidden;
}

/* Moving Grid Background */
.bg-cyber-grid {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background-image: 
    linear-gradient(to right, rgba(255, 0, 255, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 243, 255, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  z-index: -1;
  mask-image: radial-gradient(circle at center, black 40%, transparent 80%);
}

.font-header { font-family: 'Orbitron', sans-serif; }

/* Neon Text Utilities */
.text-glow-pink { text-shadow: 0 0 10px #ff00ff, 0 0 20px #ff00ff; }
.text-glow-cyan { text-shadow: 0 0 10px #00f3ff, 0 0 20px #00f3ff; }

/* Glass Cards */
.glass-card {
  background: rgba(20, 20, 30, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 30px rgba(188, 19, 254, 0.1);
}

.btn-primary {
  background: #ff00ff;
  color: white;
  box-shadow: 0 0 15px #ff00ff;
  transition: all 0.3s ease;
}
.btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px #ff00ff;
}
EOF

# 3. Update Page UI (The Pink/Purple Look)
cat > src/app/page.tsx << 'EOF'
'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Zap, Globe } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Grid */}
      <div className="bg-cyber-grid animate-grid-move"></div>
      
      {/* Gradient Blobs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyber-purple/20 rounded-full blur-[150px]"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyber-pink/20 rounded-full blur-[150px]"></div>

      {/* Navbar */}
      <nav className="relative z-50 border-b border-white/10 bg-black/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-1 h-8 bg-cyber-pink shadow-[0_0_10px_#ff00ff]"></div>
             <h1 className="text-2xl font-header font-bold tracking-widest text-white">
               SENTINEL<span className="text-cyber-cyan">DAO</span>
             </h1>
          </div>
          <div className="hover:scale-105 transition-transform">
            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Side: Text */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block px-4 py-1 mb-6 border border-cyber-cyan/30 rounded-full bg-cyber-cyan/10 text-cyber-cyan text-sm tracking-[0.2em]">
            SYSTEM ONLINE • V2.0
          </div>
          
          <h1 className="text-7xl font-header font-black leading-tight mb-6">
            GOVERNANCE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-pink to-cyber-purple text-glow-pink">
              EVOLVED
            </span>
          </h1>
          
          <p className="text-gray-400 text-lg max-w-md mb-8 border-l-2 border-white/20 pl-6 leading-relaxed">
            Decentralized decision making protocol for the next generation of on-chain organizations.
          </p>

          <div className="flex gap-6">
            <button className="btn-primary px-10 py-4 font-bold tracking-wider clip-path-polygon flex items-center gap-2">
              LAUNCH APP <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-10 py-4 border border-white/20 hover:bg-white/5 font-bold tracking-wider transition-all">
              READ DOCS
            </button>
          </div>
        </motion.div>

        {/* Right Side: Glass HUD */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass-card p-10 rounded-2xl relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-cyber-pink to-cyber-cyan opacity-20 blur rounded-2xl"></div>
          
          <div className="relative space-y-8">
            <div className="flex justify-between items-end border-b border-white/10 pb-6">
              <div>
                <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Total Value Locked</p>
                <h2 className="text-5xl font-header font-bold text-cyber-cyan text-glow-cyan">$14,204,932</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                 <div className="flex items-center gap-2 mb-2 text-cyber-pink">
                   <Zap size={18} /> <span className="text-xs uppercase tracking-wider text-white">Proposals</span>
                 </div>
                 <div className="text-3xl font-bold font-header">12</div>
               </div>
               <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                 <div className="flex items-center gap-2 mb-2 text-cyber-purple">
                   <Globe size={18} /> <span className="text-xs uppercase tracking-wider text-white">Treasury</span>
                 </div>
                 <div className="text-3xl font-bold font-header">4,200 ETH</div>
               </div>
            </div>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
EOF

echo "✨ Design Updated! Refresh Browser at http://localhost:3005"
