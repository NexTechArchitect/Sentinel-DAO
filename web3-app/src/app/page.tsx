'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  ArrowRight, Shield, Zap, Lock, Cpu, Github, 
  Loader2, BookOpen, Menu, X, KeyRound, LogOut,
  Leaf, Feather, Wind, Anchor
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useDisconnect } from 'wagmi';
import { useAASession } from '@/hooks/useAASession';
import { motion, AnimatePresence } from 'framer-motion';

// --- PREMIUM FLOATING VARIANTS ---
const floatingVariants = {
  initial: { y: -100, x: 0, opacity: 0, rotate: 0 },
  animate: (custom: number) => ({
    y: [ -100, 1200 ], 
    x: [ 
      0, 
      custom * 120,   
      -custom * 80,  
      0 
    ], 
    rotate: [ 0, 45, 135, 90 ], 
    opacity: [ 0, 0.4, 0.4, 0 ], // Subtle opacity for that premium watermark look
    transition: {
      duration: 35 + Math.random() * 15, // Ultra slow and smooth
      repeat: Infinity,
      ease: "easeInOut", 
      delay: Math.random() * 15
    }
  })
};

const fadeUp = {
  hidden: { y: 20, opacity: 0, filter: "blur(4px)" },
  visible: { 
    y: 0, 
    opacity: 1, 
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 40, damping: 20 } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function Home() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect(); 
  const { isSessionActive, createSession, isLoading: isAALoading } = useAASession();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatAddress = (addr: string) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  if (!mounted) return null;

  // Matching the organic leaf colors from your UI reference
  const natureColors = ["#84a98c", "#c2a878", "#9ca3af", "#b08968"];

  // --- PREMIUM GEL BUTTON STYLES (Glassmorphism) ---
  const glassButtonBase = "relative flex items-center justify-center gap-3 px-8 h-14 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-xl border border-white/60";
  const glassPrimary = `${glassButtonBase} bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 shadow-[0_8px_32px_-8px_rgba(16,185,129,0.2),inset_0_1px_2px_rgba(255,255,255,0.9),inset_0_-1px_2px_rgba(0,0,0,0.02)]`;
  const glassSecondary = `${glassButtonBase} bg-white/40 text-stone-800 hover:bg-white/60 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,0.9),inset_0_-1px_2px_rgba(0,0,0,0.02)]`;

  return (
    // Clean, crisp off-white background
    <div className="min-h-screen relative text-stone-900 font-serif bg-[#FBFBF9] overflow-x-hidden flex flex-col">
      
      {/* --- MESH GRADIENTS (For Glassmorphism Blur) --- */}
      <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-100/40 blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-100/30 blur-[120px] pointer-events-none z-0"></div>

      {/* --- NOISE TEXTURE --- */}
      <div className="fixed inset-0 z-0 opacity-[0.2] pointer-events-none mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* --- SUBTLE FLOATING ELEMENTS --- */}
      <div className="fixed inset-0 z-0 overflow-hidden h-full pointer-events-none">
        {[...Array(12)].map((_, i) => {
          const isFeather = i % 2 === 0;
          const randomSize = 20 + Math.random() * 16; 
          const randomLeft = Math.floor(Math.random() * 100);
          const color = natureColors[i % natureColors.length];
          
          return (
            <motion.div
              key={i}
              custom={i % 2 === 0 ? 1 : -1} 
              variants={floatingVariants}
              initial="initial"
              animate="animate"
              className="absolute mix-blend-multiply" 
              style={{ left: `${randomLeft}%`, color: color }} 
            >
              {isFeather ? 
                <Feather size={randomSize} strokeWidth={1} /> : 
                <Leaf size={randomSize} strokeWidth={1} />
              }
            </motion.div>
          )
        })}
      </div>

      {/* --- NAVBAR (Frosted Glass) --- */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 w-full z-[50] border-b border-white/60 bg-white/30 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.03)]"
      >
        <div className="max-w-[1400px] mx-auto px-6 h-24 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-white/60 backdrop-blur-md rounded-[1.25rem] border border-white/80 shadow-[inset_0_1px_1px_white,0_2px_10px_rgba(0,0,0,0.05)] flex items-center justify-center group-hover:scale-105 transition-all duration-300">
               <Shield className="w-6 h-6 text-stone-800" strokeWidth={1.5} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-1 font-sans">
              Sentinel<span className="text-stone-500 font-medium">DAO</span>
            </span>
          </Link>
          
          <div className="hidden lg:flex items-center gap-12 text-[11px] font-bold tracking-[0.25em] text-stone-500 font-sans uppercase">
             {['Proposals', 'Treasury', 'Guardian'].map((item) => (
               isSessionActive ? (
                 <Link 
                   key={item} href={`/${item.toLowerCase()}`} 
                   className="hover:text-stone-900 transition-colors relative group py-2"
                 >
                   {item}
                   <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-stone-900 transition-all duration-300 group-hover:w-full"></span>
                 </Link>
               ) : (
                 <span key={item} className="opacity-40 flex items-center gap-2 cursor-not-allowed">
                   <Lock size={12} /> {item}
                 </span>
               )
             ))}
          </div>

          <div className="hidden lg:flex items-center gap-6">
             <a href="https://github.com/NexTechArchitect/Sentinel-DAO" target="_blank" className="text-stone-400 hover:text-stone-900 transition-colors transform hover:scale-110 duration-300">
               <Github size={24} />
             </a>
             <div className="h-6 w-px bg-stone-300"></div>
             
             {isConnected && address ? (
                <ConnectButton.Custom>
                  {({ openAccountModal }) => (
                    <button 
                      onClick={openAccountModal}
                      className="px-6 py-2.5 bg-white/50 backdrop-blur-md border border-white/80 rounded-full font-sans font-bold text-[10px] tracking-widest uppercase text-stone-800 shadow-[inset_0_1px_1px_white,0_2px_8px_rgba(0,0,0,0.05)] hover:bg-white/70 transition-all flex items-center gap-2"
                    >
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                      {formatAddress(address)}
                    </button>
                  )}
                </ConnectButton.Custom>
             ) : (
               <ConnectButton.Custom>
                 {({ openConnectModal }) => (
                   <button onClick={openConnectModal} className="text-[10px] font-bold tracking-widest uppercase text-stone-600 hover:text-stone-900 transition-colors font-sans px-4 py-2 hover:bg-white/40 rounded-full">
                     Connect Wallet
                   </button>
                 )}
               </ConnectButton.Custom>
             )}
          </div>

          <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden w-12 h-12 flex items-center justify-center bg-white/50 backdrop-blur-md border border-white/80 rounded-[1.25rem] shadow-[inset_0_1px_1px_white,0_2px_8px_rgba(0,0,0,0.05)] text-stone-800">
            <Menu size={24} strokeWidth={1.5} />
          </button>
        </div>
      </motion.nav>

      {/* --- MOBILE DRAWER (Glassmorphic) --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex justify-end"
          >
            <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)} />
            
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className="relative w-[85%] max-w-sm h-full bg-[#FBFBF9]/90 backdrop-blur-2xl shadow-[-20px_0_40px_rgba(0,0,0,0.05)] flex flex-col border-l border-white/60"
            >
              <div className="flex justify-between items-center p-8 border-b border-stone-200/50">
                <span className="text-xs font-bold font-sans tracking-widest text-stone-500 uppercase">Navigation</span>
                <button onClick={() => setMobileMenuOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white/60 border border-white rounded-full shadow-sm text-stone-800">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 p-8 space-y-4 overflow-y-auto">
                {['Proposals', 'Treasury', 'Guardian'].map((item) => (
                  <Link key={item} href={`/${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)}>
                    <div className={`p-6 rounded-[1.5rem] flex items-center justify-between bg-white/40 backdrop-blur-md border border-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.02)] mb-4 ${isSessionActive ? 'text-stone-900' : 'text-stone-400'}`}>
                      <span className="text-xl font-serif font-medium">{item}</span>
                      {isSessionActive ? <ArrowRight size={20} /> : <Lock size={18} />}
                    </div>
                  </Link>
                ))}
              </div>

              <div className="p-8 border-t border-stone-200/50 bg-white/30 backdrop-blur-md">
                 {isConnected ? (
                   <button 
                     onClick={() => { disconnect(); setMobileMenuOpen(false); }}
                     className="w-full py-5 flex items-center justify-center gap-2 rounded-2xl bg-red-500/10 text-red-600 border border-red-500/20 font-sans text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-colors shadow-[inset_0_1px_1px_white]"
                   >
                     <LogOut size={18} /> Disconnect Wallet
                   </button>
                 ) : (
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <button onClick={openConnectModal} className="w-full py-5 bg-stone-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl">
                          Connect Wallet
                        </button>
                      )}
                    </ConnectButton.Custom>
                 )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 flex-col items-center pt-40 md:pt-52 px-6 w-full">
        
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto text-center mb-40 relative"
        >
          
          <motion.div variants={fadeUp} className="mb-10 flex justify-center">
             <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/50 backdrop-blur-md border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_2px_white] hover:bg-white/70 transition-all duration-500 cursor-default">
               {isSessionActive ? <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"/> : <Wind size={16} className="text-stone-400"/>}
               <span className="text-[10px] md:text-xs font-sans font-bold tracking-[0.2em] uppercase text-stone-600">
                 {isSessionActive ? 'Identity Verified' : 'Protocol V2.0.4'}
               </span>
             </div>
          </motion.div>

          <motion.h1 
            variants={fadeUp}
            className="text-[52px] sm:text-7xl md:text-9xl font-serif text-stone-900 mb-10 tracking-tight leading-[0.95]"
          >
            Governance <br className="hidden md:block"/>
            <span className="italic font-light text-stone-500">Rooted in Trust.</span>
          </motion.h1>

          <motion.p 
            variants={fadeUp}
            className="text-xl md:text-2xl text-stone-600 font-sans font-light max-w-2xl mx-auto leading-relaxed mb-16"
          >
            A decentralized system that grows organically. <br className="hidden md:block"/>
            Immutable rules, fluid execution.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-5 justify-center items-center font-sans w-full max-w-md mx-auto sm:max-w-none">
             <ConnectButton.Custom>
               {({ account, chain, openConnectModal, mounted: rainbowMounted }) => {
                 const ready = mounted && rainbowMounted;
                 const connected = ready && account && chain;

                 if (!ready) return <div className="w-52 h-14 bg-white/40 rounded-full animate-pulse"/>;
                 if (!connected) return (
                   <button onClick={openConnectModal} className={glassSecondary + " w-full sm:w-auto"}>
                     <Zap size={18} /> Connect Wallet
                   </button>
                 );
                 if (!isSessionActive) return (
                   <button onClick={createSession} disabled={isAALoading} className={glassPrimary + " w-full sm:w-auto"}>
                     {isAALoading ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
                     Verify Identity
                   </button>
                 );
                 return (
                   <Link href="/dashboard" className="w-full sm:w-auto">
                     <button className={glassSecondary + " w-full sm:w-auto bg-stone-900 text-white hover:bg-stone-800 border-stone-700"}>
                       Enter Garden <ArrowRight size={18} />
                     </button>
                   </Link>
                 );
               }}
             </ConnectButton.Custom>

             <Link href="/docs" className="w-full sm:w-auto">
               <button className={glassSecondary + " w-full sm:w-auto"}>
                 <BookOpen size={18} /> Read Manifesto
               </button>
             </Link>
          </motion.div>
        </motion.div>

        {/* --- CORE FEATURES (Glassmorphic Cards) --- */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-6xl mx-auto pb-40 relative z-10"
        >
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { title: "Immutable Kernel", desc: "Logic rooted in solidity. The rules are set in stone, protecting the DAO from external manipulation.", icon: Shield },
               { title: "Fluid Voting", desc: "Using Account Abstraction, voting requires no gas. Sign the message, and your voice flows freely.", icon: Feather },
               { title: "Open Treasury", desc: "Funds managed on-chain. No single person has the key; only consensus unlocks resources.", icon: Anchor },
             ].map((feature, i) => (
               <motion.div 
                 key={i} 
                 variants={fadeUp}
                 className="p-10 bg-white/40 backdrop-blur-xl border border-white/80 rounded-[2.5rem] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8)] hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,1)] hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden"
               >
                  <div className="w-16 h-16 bg-white/80 backdrop-blur-md rounded-[1.5rem] border border-white shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_1px_1px_white] flex items-center justify-center mb-8 text-stone-500 group-hover:text-stone-900 group-hover:bg-white transition-all duration-300">
                    <feature.icon size={28} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-serif text-stone-900 mb-4 font-bold tracking-tight">{feature.title}</h3>
                  <p className="text-stone-600 font-sans leading-relaxed text-sm md:text-base font-medium">{feature.desc}</p>
               </motion.div>
             ))}
           </div>
        </motion.div>

        {/* --- MANIFESTO SECTION --- */}
        <div className="max-w-4xl mx-auto text-center pb-32 border-t border-stone-200/50 pt-24">
           <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
             <h2 className="text-4xl md:text-6xl font-serif text-stone-900 mb-8 italic tracking-tight">"Code is Law, <br/> Community is Life."</h2>
             <p className="text-xl text-stone-500 font-sans font-medium leading-relaxed">
               We are building a system that doesn't just survive, <br className="hidden md:block"/>
               but thrives through the collective intelligence of its members.
             </p>
             
             <div className="mt-14">
               <Link href="/docs" className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/50 backdrop-blur-md border border-white/80 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_1px_1px_white] text-stone-600 hover:text-stone-900 transition-all uppercase tracking-widest text-[10px] font-bold font-sans hover:scale-105">
                 Read Full Manifesto <ArrowRight size={14}/>
               </Link>
             </div>
           </motion.div>
        </div>

      </main>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/60 bg-white/30 backdrop-blur-lg py-12 px-6 mt-auto relative z-20 shadow-[0_-4px_30px_rgba(0,0,0,0.02)]">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center text-[10px] font-sans font-bold tracking-widest text-stone-500 uppercase gap-8">
           <div className="flex gap-10">
             <Link href="/docs" className="hover:text-stone-900 transition-colors">Documentation</Link>
             <a href="https://github.com/NexTechArchitect/Sentinel-DAO" target="_blank" className="hover:text-stone-900 transition-colors">Contracts</a>
             <a href="/dashboard" className="hover:text-stone-900 transition-colors">Dashboard</a>
           </div>
           <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-white shadow-sm">
             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
             <span className="text-stone-800">System Operational</span>
           </div>
           <div>
             Engineered by <span className="text-stone-900">NexTech Architect</span>
           </div>
        </div>
      </footer>

    </div>
  );
}
