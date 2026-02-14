'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  ArrowRight, Shield, Zap, Lock, Cpu, Github, 
  Loader2, BookOpen, Terminal, Menu, X, KeyRound, LogOut,
  Activity, Server 
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAccount, useDisconnect } from 'wagmi';
import { useAASession } from '@/hooks/useAASession';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// Optimized Variants for Mobile (Less Physics)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 } // Faster stagger
  }
};

const textRevealVariants = {
  hidden: { y: 20, opacity: 0 }, // Removed blur filter (Heavy on Mobile)
  show: { 
    y: 0, 
    opacity: 1, 
    transition: { type: "spring", stiffness: 100, damping: 20 } 
  }
};

const cardHoverVariants = {
  initial: { y: 0, scale: 1 },
  hover: { y: -5, scale: 1.01, transition: { duration: 0.2 } } // Simpler hover
};

// Aurora only animates on Desktop now
const auroraVariants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.3, 0.4, 0.3],
    rotate: [0, 5, -5, 0],
    transition: { duration: 20, repeat: Infinity, ease: "linear" }
  },
  static: {
    scale: 1,
    opacity: 0.3,
    rotate: 0
  }
};

export default function Home() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect(); 
  const { isSessionActive, createSession, isLoading: isAALoading } = useAASession();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Reduce Motion Preference Check
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    
    // Check if device is mobile to disable heavy effects
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Only attach mouse listener on Desktop
    if (window.matchMedia("(pointer: fine)").matches) {
        const handleMouseMove = (e: MouseEvent) => {
          if (spotlightRef.current) {
            spotlightRef.current.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(34, 211, 238, 0.06), transparent 40%)`;
          }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('resize', checkMobile);
        }
    }
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const formatAddress = (addr: string) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative text-slate-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden bg-[#030305] flex flex-col">
      
      {/* 1. Base Layer */}
      <div className="fixed inset-0 z-0 bg-[#030305]"></div>
      
      {/* 2. Optimized Aurora Blobs (Static on Mobile) */}
      <motion.div 
        variants={auroraVariants} 
        animate={isMobile || shouldReduceMotion ? "static" : "animate"}
        className="fixed top-[-20%] right-[-20%] w-[300px] md:w-[1000px] h-[300px] md:h-[1000px] bg-indigo-900/20 rounded-full blur-[60px] md:blur-[120px] pointer-events-none mix-blend-screen transform-gpu"
      />
      <motion.div 
        variants={auroraVariants} 
        animate={isMobile || shouldReduceMotion ? "static" : "animate"}
        transition={{ delay: 2 }}
        className="fixed bottom-[-20%] left-[-20%] w-[300px] md:w-[1000px] h-[300px] md:h-[1000px] bg-cyan-900/10 rounded-full blur-[60px] md:blur-[120px] pointer-events-none mix-blend-screen transform-gpu"
      />
      
      {/* 3. Static Pulse (Reduced size for mobile) */}
      <div className="fixed top-[20%] left-[10%] md:left-[30%] w-[200px] md:w-[800px] h-[200px] md:h-[800px] bg-violet-900/10 rounded-full blur-[80px] md:blur-[150px] pointer-events-none transform-gpu" />

      {/* 4. Desktop Only Effects */}
      <div ref={spotlightRef} className="fixed inset-0 z-10 pointer-events-none transition-opacity duration-700 hidden md:block" />
      <div className="fixed inset-0 z-[1] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none hidden md:block"></div>

      {/* Grid Pattern (Lighter on mobile) */}
      <div className="fixed inset-0 z-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)] opacity-[0.03] pointer-events-none"></div>

      <motion.nav 
        initial={{ y: -20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.5 }}
        className="fixed top-0 w-full z-[999] border-b border-white/5 bg-[#030305]/90 md:bg-[#030305]/70 backdrop-blur-md"
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-20 md:h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="relative p-2 bg-white/5 rounded-lg border border-white/10 group-hover:border-cyan-500/50 transition-colors">
               <Shield className="w-5 h-5 md:w-6 md:h-6 text-cyan-400 relative z-10" strokeWidth={2} />
            </div>
            <span className="text-xl md:text-2xl font-black tracking-tight text-white uppercase flex items-center gap-1">
              Sentinel<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">DAO</span>
            </span>
          </Link>
          
          <div className="hidden lg:flex items-center gap-10 text-[11px] font-bold tracking-[0.2em] text-slate-400">
             {['PROPOSALS', 'TREASURY', 'GUARDIAN'].map((item) => (
               isSessionActive ? (
                 <Link 
                   key={item} 
                   href={`/${item.toLowerCase()}`} 
                   className="hover:text-white transition-colors relative group py-2"
                 >
                   {item}
                   <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-cyan-500 transition-all duration-300 group-hover:w-full shadow-[0_0_15px_#22d3ee]"></span>
                 </Link>
               ) : (
                 <span key={item} className="opacity-30 cursor-not-allowed flex items-center gap-2 grayscale transition-all">
                   <Lock size={10} /> {item}
                 </span>
               )
             ))}
          </div>

          <div className="hidden lg:flex items-center gap-6">
             <a href="https://github.com/NexTechArchitect/Sentinel-DAO" target="_blank" className="text-slate-500 hover:text-white transition-all hover:scale-110 duration-300">
               <Github size={22} />
             </a>
             <div className="h-8 w-px bg-white/10"></div>
             
             {isConnected && address ? (
                <ConnectButton.Custom>
                  {({ openAccountModal }) => (
                    <motion.button 
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={openAccountModal}
                      className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold tracking-widest uppercase hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      {formatAddress(address)}
                    </motion.button>
                  )}
                </ConnectButton.Custom>
             ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-500/5 rounded-full border border-red-500/10">
                   <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                   <span className="text-[10px] font-bold tracking-widest uppercase text-red-500">System Offline</span>
                </div>
             )}
          </div>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 text-white bg-white/5 rounded-xl border border-white/5 active:scale-95 transition-all"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: "auto", opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-[#05050a]/98 border-b border-white/10 overflow-hidden absolute w-full"
            >
              <div className="px-6 py-8 space-y-4">
                {['PROPOSALS', 'TREASURY', 'GUARDIAN'].map((item) => (
                  isSessionActive ? (
                    <Link 
                      key={item} 
                      href={`/${item.toLowerCase()}`} 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-4 text-sm font-bold tracking-widest text-slate-300 hover:text-white border-l-2 border-transparent hover:border-cyan-500 pl-6 bg-white/[0.02] hover:bg-white/[0.05] rounded-r-xl transition-all"
                    >
                      {item}
                    </Link>
                  ) : (
                    <div key={item} className="py-4 text-sm font-bold tracking-widest text-slate-600 pl-6 flex items-center gap-3 bg-black/20 rounded-r-xl">
                      <Lock size={14} /> {item}
                    </div>
                  )
                ))}
                
                {isConnected && (
                  <button 
                    onClick={() => { disconnect(); setMobileMenuOpen(false); }}
                    className="w-full mt-6 py-4 flex items-center justify-center gap-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold tracking-widest uppercase border border-red-500/20 active:scale-95 transition-transform"
                  >
                    <LogOut size={16} /> Disconnect
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <main className="relative z-20 flex-1 flex flex-col items-center justify-center pt-32 pb-16 px-4 text-center overflow-hidden min-h-[85vh]">
        
        <motion.div 
          variants={containerVariants} initial="hidden" animate="show"
          className="max-w-[1300px] mx-auto flex flex-col items-center w-full"
        >
          <motion.div variants={textRevealVariants} className="mb-10 md:mb-14">
              <div className="relative">
                <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full border border-white/10 bg-[#0a0a0f] shadow-lg">
                  {isSessionActive ? 
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span> 
                    : <Terminal size={12} className="text-cyan-400" />
                  }
                  <span className={`text-[10px] md:text-xs font-bold tracking-[0.25em] uppercase ${isSessionActive ? 'text-emerald-400' : 'text-cyan-400'}`}>
                    {isSessionActive ? 'Identity Secured' : 'Protocol V2.0.4 Online'}
                  </span>
                </div>
             </div>
          </motion.div>

          <div className="relative mb-8 md:mb-12 z-10">
             <motion.div variants={textRevealVariants} className="mb-2">
               <h1 className="text-[32px] sm:text-6xl md:text-8xl lg:text-[110px] font-medium text-white tracking-tighter leading-none inline-block relative">
                 <span className="bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">Institutional</span>
               </h1>
             </motion.div>

             <motion.div variants={textRevealVariants} className="relative">
               <h1 className="text-[36px] sm:text-7xl md:text-9xl lg:text-[120px] font-black tracking-tighter uppercase leading-[0.9] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-500 to-cyan-400">
                 Governance
               </h1>
             </motion.div>
          </div>

          <motion.p variants={textRevealVariants} className="text-slate-400 text-sm md:text-xl max-w-3xl mx-auto mb-16 leading-relaxed font-light tracking-wide px-4">
            The Operating System for <strong className="text-white font-medium">Decentralized Power</strong>. 
            Secure Treasury, Modular Logic, and Gasless Voting execution.
          </motion.p>

          <motion.div variants={textRevealVariants} className="flex flex-col sm:flex-row gap-6 items-center justify-center w-full max-w-sm sm:max-w-none relative z-20 mb-24">
              <ConnectButton.Custom>
                {({ account, chain, openConnectModal, mounted: rainbowMounted }) => {
                  const ready = mounted && rainbowMounted;
                  const connected = ready && account && chain;

                  return (
                    <div className="w-full sm:w-[300px] flex flex-col gap-4">
                      {!ready ? (
                        <div className="w-full py-5 bg-white/5 rounded-xl animate-pulse"></div>
                      ) : !connected ? (
                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          onClick={openConnectModal}
                          className="relative w-full py-5 bg-white text-black rounded-xl flex items-center justify-center gap-3 font-black text-xs tracking-[0.2em] uppercase shadow-lg active:opacity-90"
                        >
                          <Zap size={18} fill="currentColor" /> Launch Terminal
                        </motion.button>
                      ) : !isSessionActive ? (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
                          <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={createSession}
                            disabled={isAALoading}
                            className="relative w-full py-5 bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-xl flex items-center justify-center gap-3 border border-cyan-400/20 shadow-lg text-white"
                          >
                            {isAALoading ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
                            <span className="font-bold text-xs tracking-[0.2em] uppercase">Verify Identity</span>
                          </motion.button>
                          <button onClick={() => disconnect()} className="text-[10px] uppercase tracking-widest text-slate-600 hover:text-red-400 transition-colors py-2">
                            Disconnect Session
                          </button>
                        </motion.div>
                      ) : (
                        <Link href="/dashboard" className="w-full">
                          <motion.button 
                            whileTap={{ scale: 0.95 }}
                            className="relative w-full py-5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center gap-3 font-bold text-xs tracking-[0.2em] uppercase text-white shadow-lg border border-white/10"
                          >
                            Enter Dashboard <ArrowRight size={18} />
                          </motion.button>
                        </Link>
                      )}
                    </div>
                  );
                }}
              </ConnectButton.Custom>

              <Link href="/docs" className="w-full sm:w-[240px]">
                <motion.div 
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-5 border border-white/10 bg-[#0a0a0f]/50 rounded-xl text-slate-400 font-bold text-xs tracking-[0.2em] flex items-center justify-center gap-3 uppercase transition-all active:bg-white/5"
                >
                  <BookOpen size={18} /> Documentation
                </motion.div>
              </Link>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full relative z-10 px-2"
          >
              {[
                { title: "Zero-Trust Kernel", desc: "State logic separated from decision modules via proxy architecture.", icon: Cpu, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
                { title: "Timelock Vault", desc: "Cryptographic 48-hour execution delay on all critical parameters.", icon: Lock, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
                { title: "Gasless Voting", desc: "Native ERC-4337 Paymaster integration for seamless UX.", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
              ].map((item, i) => (
                <motion.div 
                  key={i} variants={cardHoverVariants} whileHover="hover"
                  className={`p-8 bg-[#0a0a0f]/40 backdrop-blur-md border border-white/5 rounded-[2rem] text-left relative overflow-hidden active:scale-[0.98] transition-transform`}
                >
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border ${item.border} ${item.bg} ${item.color}`}>
                      <item.icon size={24} />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{item.title}</h3>
                   <p className="text-sm text-slate-400 leading-relaxed font-light">{item.desc}</p>
                </motion.div>
              ))}
          </motion.div>

        </motion.div>
      </main>

      <motion.footer 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        className="w-full border-t border-white/5 bg-[#030305] py-8 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center text-[10px] md:text-xs text-slate-600 font-bold uppercase tracking-[0.15em] z-50 gap-6"
      >
         <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <span className="flex items-center gap-2"><Activity size={14} className="text-emerald-500"/> All Systems Nominal</span>
            <span className="flex items-center gap-2"><Server size={14} className="text-indigo-500"/> Sepolia: 4829104</span>
         </div>
         <div className="hover:text-slate-400 transition-colors cursor-default">
           Engineered by <span className="text-slate-300">NexTech Architect</span>
         </div>
      </motion.footer>

    </div>
  );
}