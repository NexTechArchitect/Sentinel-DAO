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

// --- INTERACTIVE FALLING VARIANTS ---

const fallingVariants = {
  initial: { y: -100, x: 0, opacity: 0, rotate: 0 },
  animate: (custom: number) => ({
    y: [ -100, 1200 ], 
    x: [ 
      0, 
      custom * 100, 
      -custom * 80, 
      custom * 50 
    ], 
    rotate: [ 0, 45, 180, 360 ],
    opacity: [ 0, 1, 1, 0 ], // Fully Visible (Opacity 1)
    transition: {
      duration: 15 + Math.random() * 20, 
      repeat: Infinity,
      ease: "linear",
      delay: Math.random() * 10
    }
  })
};

const fadeUp = {
  hidden: { y: 30, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { type: "spring", stiffness: 60, damping: 20 } 
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

  // Colors for leaves so they stand out against cream background
  // Green, Brown (Autumn), Dark Grey
  const leafColors = ["#059669", "#d97706", "#4b5563", "#047857"];

  return (
    <div className="min-h-screen relative text-stone-900 font-serif bg-[#F5F2EB] overflow-x-hidden flex flex-col">
      
      {/* --- BACKGROUND LAYERS --- */}
      <div className="fixed inset-0 z-0 opacity-[0.5] pointer-events-none mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* --- INTERACTIVE LEAVES LAYER --- */}
      <div className="fixed inset-0 z-0 overflow-hidden h-full pointer-events-none">
        {/* Pointer events none on container, auto on children so we can touch leaves but click buttons behind them */}
        {[...Array(20)].map((_, i) => {
          const isFeather = i % 2 === 0;
          const randomSize = 28 + Math.random() * 32; // Big sizes
          const randomLeft = Math.floor(Math.random() * 100);
          const color = leafColors[i % leafColors.length]; // Cycle through colors
          
          return (
            <motion.div
              key={i}
              custom={i % 2 === 0 ? 1 : -1}
              variants={fallingVariants}
              initial="initial"
              animate="animate"
              // INTERACTION: Hover/Touch pe bhagega (Run away effect)
              whileHover={{ 
                scale: 1.5, 
                rotate: 90, 
                x: (Math.random() - 0.5) * 200, // Random direction mein bhagega
                y: -50, // Thoda upar udega
                transition: { duration: 0.4 }
              }}
              whileTap={{ scale: 0.8, opacity: 0 }} // Click karne pe gayab
              className="absolute cursor-pointer pointer-events-auto opacity-80 hover:opacity-100 transition-opacity"
              style={{ 
                left: `${randomLeft}%`, 
                color: color // Actual colors applied
              }} 
            >
              {isFeather ? 
                <Feather size={randomSize} strokeWidth={1.5} /> : 
                <Leaf size={randomSize} strokeWidth={1.5} fill={color} fillOpacity={0.1} /> // Thoda sa fill color bhi diya
              }
            </motion.div>
          )
        })}
      </div>

      {/* --- NAVBAR --- */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="fixed top-0 w-full z-[50] border-b border-[#E5E0D6] bg-[#F5F2EB]/95 backdrop-blur-md shadow-sm"
      >
        <div className="max-w-[1400px] mx-auto px-6 h-24 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2.5 bg-white rounded-xl border border-[#E5E0D6] shadow-sm group-hover:border-[#78716c] transition-all">
               <Shield className="w-7 h-7 text-stone-900" strokeWidth={2} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-1 font-sans">
              Sentinel<span className="text-stone-500 font-medium">DAO</span>
            </span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-12 text-xs font-bold tracking-[0.25em] text-stone-600 font-sans uppercase">
             {['Proposals', 'Treasury', 'Guardian'].map((item) => (
               isSessionActive ? (
                 <Link 
                   key={item} href={`/${item.toLowerCase()}`} 
                   className="hover:text-black transition-colors relative group py-2"
                 >
                   {item}
                   <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-black transition-all duration-300 group-hover:w-full"></span>
                 </Link>
               ) : (
                 <span key={item} className="opacity-40 cursor-not-allowed flex items-center gap-2">
                   <Lock size={12} /> {item}
                 </span>
               )
             ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-6">
             <a href="https://github.com/NexTechArchitect/Sentinel-DAO" target="_blank" className="text-stone-400 hover:text-black transition-colors">
               <Github size={24} />
             </a>
             
             {isConnected && address ? (
                <ConnectButton.Custom>
                  {({ openAccountModal }) => (
                    <button 
                      onClick={openAccountModal}
                      className="px-6 py-3 rounded-full border border-[#E5E0D6] bg-white text-stone-900 text-xs font-sans font-bold tracking-widest uppercase hover:shadow-md transition-all flex items-center gap-2"
                    >
                      <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></div>
                      {formatAddress(address)}
                    </button>
                  )}
                </ConnectButton.Custom>
             ) : (
               <ConnectButton.Custom>
                 {({ openConnectModal }) => (
                   <button onClick={openConnectModal} className="text-xs font-bold tracking-widest uppercase text-stone-600 hover:text-black transition-colors border-b-2 border-transparent hover:border-black pb-1">
                     Connect Wallet
                   </button>
                 )}
               </ConnectButton.Custom>
             )}
          </div>

          {/* Mobile Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-3 text-stone-900 bg-white border border-[#E5E0D6] rounded-xl shadow-sm hover:bg-[#E5E0D6] transition-colors"
          >
            <Menu size={26} strokeWidth={2} />
          </button>
        </div>
      </motion.nav>

      {/* --- MOBILE DRAWER --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex justify-end"
          >
            <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-[85%] max-w-sm h-full bg-[#F5F2EB] shadow-2xl flex flex-col border-l border-[#E5E0D6]"
            >
              <div className="flex justify-between items-center p-8 border-b border-[#E5E0D6]">
                <span className="text-sm font-bold font-sans tracking-widest text-stone-500">NAVIGATION</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white rounded-full text-stone-900 border border-[#E5E0D6] shadow-sm">
                  <X size={22} />
                </button>
              </div>

              <div className="flex-1 p-8 space-y-4 overflow-y-auto">
                {['Proposals', 'Treasury', 'Guardian'].map((item) => (
                  <Link key={item} href={`/${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)}>
                    <div className={`p-5 rounded-2xl flex items-center justify-between bg-white border border-[#E5E0D6] shadow-sm mb-3 ${isSessionActive ? 'text-stone-900' : 'text-stone-400'}`}>
                      <span className="text-xl font-serif font-medium">{item}</span>
                      {isSessionActive ? <ArrowRight size={20} /> : <Lock size={18} />}
                    </div>
                  </Link>
                ))}
              </div>

              <div className="p-8 border-t border-[#E5E0D6] bg-white">
                 {isConnected ? (
                   <button 
                     onClick={() => { disconnect(); setMobileMenuOpen(false); }}
                     className="w-full py-4 flex items-center justify-center gap-2 rounded-xl bg-red-50 text-red-600 border border-red-100 font-sans text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-colors"
                   >
                     <LogOut size={18} /> Disconnect Wallet
                   </button>
                 ) : (
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <button onClick={openConnectModal} className="w-full py-4 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg">
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
      <main className="relative z-10 flex-col items-center pt-40 px-6 w-full">
        
        <div className="max-w-5xl mx-auto text-center mb-36">
          
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-10 flex justify-center">
             <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white border border-[#E5E0D6] shadow-sm hover:shadow-md transition-shadow">
               {isSessionActive ? <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-pulse"/> : <Wind size={16} className="text-stone-400"/>}
               <span className="text-xs font-sans font-bold tracking-[0.25em] uppercase text-stone-500">
                 {isSessionActive ? 'Secure Session Active' : 'Protocol V2.0.4'}
               </span>
             </div>
          </motion.div>

          <motion.h1 
            variants={fadeUp} initial="hidden" animate="visible"
            className="text-[52px] sm:text-7xl md:text-9xl font-serif text-black mb-10 tracking-tight leading-[1]"
          >
            Governance <br className="hidden md:block"/>
            <span className="italic font-light text-stone-600">Rooted in Trust.</span>
          </motion.h1>

          <motion.p 
            variants={fadeUp} initial="hidden" animate="visible"
            className="text-xl md:text-2xl text-stone-700 font-sans font-light max-w-2xl mx-auto leading-relaxed mb-16"
          >
            A decentralized system that grows organically. <br className="hidden md:block"/>
            Immutable rules, fluid execution.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-5 justify-center items-center font-sans">
             <ConnectButton.Custom>
               {({ account, chain, openConnectModal, mounted: rainbowMounted }) => {
                 const ready = mounted && rainbowMounted;
                 const connected = ready && account && chain;

                 if (!ready) return <div className="w-52 h-14 bg-[#E5E0D6] rounded-xl animate-pulse"/>;
                 if (!connected) return (
                   <button 
                     onClick={openConnectModal}
                     className="w-full sm:w-auto px-10 h-14 bg-stone-900 text-[#F5F2EB] rounded-xl text-xs font-bold tracking-[0.2em] uppercase hover:bg-black hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                   >
                     <Zap size={18} /> Connect Wallet
                   </button>
                 );
                 if (!isSessionActive) return (
                   <button 
                     onClick={createSession}
                     disabled={isAALoading}
                     className="w-full sm:w-auto px-10 h-14 bg-[#047857] text-white rounded-xl text-xs font-bold tracking-[0.2em] uppercase hover:bg-[#059669] hover:shadow-lg transition-all flex items-center justify-center gap-3"
                   >
                     {isAALoading ? <Loader2 className="animate-spin" /> : <KeyRound size={18} />}
                     Verify Identity
                   </button>
                 );
                 return (
                   <Link href="/dashboard">
                     <button className="w-full sm:w-auto px-10 h-14 bg-stone-900 text-[#F5F2EB] rounded-xl text-xs font-bold tracking-[0.2em] uppercase hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg">
                       Enter Garden <ArrowRight size={18} />
                     </button>
                   </Link>
                 );
               }}
             </ConnectButton.Custom>

             <Link href="/docs" className="w-full sm:w-auto">
               <button className="w-full sm:w-auto px-10 h-14 border border-stone-400 text-stone-800 rounded-xl text-xs font-bold tracking-[0.2em] uppercase hover:bg-white transition-all flex items-center justify-center gap-3">
                 <BookOpen size={18} /> Read Manifesto
               </button>
             </Link>
          </motion.div>
        </div>

        <div className="max-w-6xl mx-auto pb-40">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { title: "Immutable Kernel", desc: "Logic rooted in solidity. The rules are set in stone, protecting the DAO from external manipulation.", icon: Shield },
               { title: "Fluid Voting", desc: "Using Account Abstraction, voting requires no gas. Sign the message, and your voice flows freely.", icon: Feather },
               { title: "Open Treasury", desc: "Funds managed on-chain. No single person has the key; only consensus unlocks resources.", icon: Anchor },
             ].map((feature, i) => (
               <motion.div 
                 key={i} 
                 initial={{ opacity: 0, y: 40 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.2 }}
                 className="p-10 bg-white border border-[#E5E0D6] rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group z-10 relative"
               >
                  <div className="w-14 h-14 bg-[#F5F2EB] rounded-2xl flex items-center justify-center mb-8 text-stone-500 group-hover:text-black group-hover:bg-[#E5E0D6] transition-colors border border-[#e7e5e4]">
                    <feature.icon size={28} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-serif text-stone-900 mb-4 font-bold">{feature.title}</h3>
                  <p className="text-stone-600 font-sans leading-relaxed text-base">{feature.desc}</p>
               </motion.div>
             ))}
           </div>
        </div>

        <div className="max-w-4xl mx-auto text-center pb-32 border-t border-[#E5E0D6] pt-24">
           <h2 className="text-3xl md:text-6xl font-serif text-stone-900 mb-10 italic">"Code is Law, <br/> Community is Life."</h2>
           <p className="text-xl text-stone-600 font-sans font-light leading-loose">
             We are building a system that doesn't just survive, <br className="hidden md:block"/>
             but thrives through the collective intelligence of its members.
           </p>
           
           <div className="mt-12">
             <Link href="/docs" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 border-b border-stone-300 hover:border-stone-900 pb-1 transition-colors uppercase tracking-widest text-xs font-bold">
               Read Full Manifesto <ArrowRight size={14}/>
             </Link>
           </div>
        </div>

      </main>

      <footer className="border-t border-[#E5E0D6] bg-[#EBE9E4] py-12 px-6 mt-auto relative z-20">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center text-xs font-sans font-bold tracking-widest text-stone-500 uppercase gap-8">
           <div className="flex gap-10">
             <Link href="/docs" className="hover:text-black transition-colors">Documentation</Link>
             <a href="https://github.com/NexTechArchitect/Sentinel-DAO" target="_blank" className="hover:text-black transition-colors">Contracts</a>
             <a href="/dashboard" className="hover:text-black transition-colors">Dashboard</a>
           </div>
           <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-[#E5E0D6]">
             <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></span>
             System Operational
           </div>
           <div>
             Engineered by <span className="text-stone-900">NexTech Architect</span>
           </div>
        </div>
      </footer>

    </div>
  );
}