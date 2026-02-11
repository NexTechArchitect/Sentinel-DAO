'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  ArrowRight, Shield, Zap, Lock, Cpu, Github, 
  CheckCircle, Loader2, BookOpen, Terminal, Menu, X,KeyRound, LogOut,
  Activity, Server 
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAccount, useDisconnect } from 'wagmi';
import { useAASession } from '@/hooks/useAASession';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect(); 
  const { isSessionActive, createSession, isLoading: isAALoading } = useAASession();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // High-Performance Ambient Glow
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isHoveringCards, setIsHoveringCards] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Close mobile menu when screen resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format address for sleek navbar button
  const formatAddress = (addr: string) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden bg-[#05050a] flex flex-col">
      
      {/* ==================== ULTRA-PREMIUM 4K AMBIENT BACKGROUND ==================== */}
      <div className="fixed inset-0 z-0 bg-[#05050a] pointer-events-none"></div>
      
      {/* Soft Dynamic Lighting Orbs */}
      <div className="fixed top-[-10%] right-[-5%] w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-blue-600/10 rounded-full blur-[120px] md:blur-[160px] pointer-events-none animate-pulse-slow"></div>
      <div className="fixed bottom-[-10%] left-[-5%] w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-purple-600/10 rounded-full blur-[120px] md:blur-[160px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      {/* AMBIENT HIGHLIGHT: SMOOTH SPOTLIGHT - HIDES WHEN HOVERING CARDS */}
      <div
        ref={spotlightRef}
        className={`fixed top-0 left-0 z-[60] pointer-events-none w-[600px] h-[600px] rounded-full mix-blend-screen hidden md:block transition-opacity duration-500 ease-in-out ${isHoveringCards ? 'opacity-0' : 'opacity-100'}`}
        style={{ 
          background: 'radial-gradient(circle, rgba(0,243,255,0.06) 0%, rgba(0,243,255,0) 70%)',
          filter: 'blur(80px)'
        }}
      />

      {/* ==================== UNIFIED NAVBAR ==================== */}
      <nav className="fixed top-0 w-full z-[999] border-b border-white/5 bg-[#05050a]/80 backdrop-blur-2xl transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="p-2 bg-white/5 rounded-xl border border-white/10 group-hover:border-blue-500/50 transition-all group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
               <Shield className="w-5 h-5 md:w-6 md:h-6 text-blue-400 transition-colors" />
            </div>
            <span className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
              Sentinel<span className="text-blue-400">DAO</span>
            </span>
          </Link>
          
          {/* Desktop Links (DASHBOARD removed from here) */}
          <div className="hidden lg:flex items-center gap-8 text-xs font-bold tracking-widest text-slate-400">
             {['PROPOSALS', 'TREASURY', 'GUARDIAN'].map((item) => (
               isSessionActive ? (
                 <Link 
                   key={item} 
                   href={item === 'TREASURY' ? '/treasury' : item === 'PROPOSALS' ? '/proposals' : '/guardian'} 
                   className="hover:text-white transition-colors relative group"
                 >
                   {item}
                   <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-blue-400 transition-all group-hover:w-full"></span>
                 </Link>
               ) : (
                 <span key={item} className="opacity-40 cursor-not-allowed flex items-center gap-2">
                   <Lock size={12} /> {item}
                 </span>
               )
             ))}
          </div>

          {/* Right Side - Desktop (SLEEK WALLET BUTTON) */}
          <div className="hidden lg:flex items-center gap-6">
             <a href="https://github.com/NexTechArchitect/Sentinel-DAO" target="_blank" className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 hover:text-white transition-colors">
               <Github size={16} />
               <span>GITHUB</span>
             </a>
             <div className="h-5 w-px bg-white/10"></div>
             
             {/* Sleek Connect/Disconnect Navbar Button */}
             {isConnected && address ? (
                <ConnectButton.Custom>
                  {({ openAccountModal }) => (
                    <button 
                      onClick={openAccountModal}
                      className="flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/50 transition-all text-green-400 text-[10px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                    >
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                      {formatAddress(address)}
                    </button>
                  )}
                </ConnectButton.Custom>
             ) : (
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                   <span className="text-[10px] font-bold tracking-widest uppercase text-red-500">
                     Offline
                   </span>
                </div>
             )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div 
          className={`lg:hidden absolute top-full left-0 w-full bg-[#05050a]/95 backdrop-blur-2xl border-b border-white/5 transition-all duration-300 ease-out flex flex-col ${
            mobileMenuOpen ? 'max-h-screen opacity-100 py-4' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className="px-6 space-y-2 flex-1">
            {['PROPOSALS', 'TREASURY', 'GUARDIAN'].map((item) => (
              isSessionActive ? (
                <Link 
                  key={item} 
                  href={item === 'TREASURY' ? '/treasury' : item === 'PROPOSALS' ? '/proposals' : '/guardian'} 
                  className="block py-4 text-sm font-bold tracking-widest text-slate-400 hover:text-white transition-colors border-b border-white/5 last:border-0"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </Link>
              ) : (
                <span key={item} className="flex items-center gap-2 py-4 text-sm font-bold tracking-widest text-slate-400 opacity-40 border-b border-white/5 last:border-0">
                  <Lock size={14} /> {item}
                </span>
              )
            ))}
            
            <a 
              href="https://github.com/NexTechArchitect/Sentinel-DAO" 
              target="_blank" 
              className="flex items-center gap-3 py-4 text-sm font-bold tracking-widest text-slate-400 hover:text-white transition-colors border-b border-white/5"
            >
              <Github size={18} /> GITHUB
            </a>
          </div>

          {/* Mobile Disconnect Button */}
          {isConnected && (
            <div className="px-6 mt-4 pt-4 border-t border-white/5">
              <button 
                onClick={() => { disconnect(); setMobileMenuOpen(false); }}
                className="w-full py-4 flex items-center justify-center gap-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors text-xs font-bold tracking-widest uppercase"
              >
                <LogOut size={14} /> Disconnect Wallet
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ==================== MAIN HERO SECTION ==================== */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-4 text-center">
        
        {/* Status Badge */}
        <div className="mb-8 md:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-blue-500/20 bg-blue-500/5 backdrop-blur-xl shadow-[0_0_30px_rgba(59,130,246,0.15)]">
              {isSessionActive ? <CheckCircle size={14} className="text-green-400" /> : <Terminal size={14} className="text-blue-400" />}
              <span className={`text-[10px] md:text-xs font-bold tracking-widest uppercase ${isSessionActive ? 'text-green-400' : 'text-blue-400'}`}>
                {isSessionActive ? 'Identity Verified & Secured' : 'Protocol Core V2.0.4 Live'}
              </span>
           </div>
        </div>

        {/* Hero Title (Premium 4K Sleek Look) */}
        <div className="relative mb-8 md:mb-10 z-10 animate-in fade-in zoom-in duration-1000">
           {/* Text Background Glow for cinematic feel */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[50%] bg-blue-500/20 blur-[100px] -z-10 rounded-full mix-blend-screen pointer-events-none"></div>
           
           <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-light tracking-[0.15em] text-white leading-[1.2] uppercase drop-shadow-2xl">
             Institutional <br/>
             <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 animate-gradient-x">
               Governance
             </span>
           </h1>
        </div>

        {/* Hero Description */}
        <p className="text-slate-400 text-sm md:text-lg max-w-2xl mx-auto mb-12 md:mb-16 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
          The Operating System for <strong className="text-white">Decentralized Power</strong>. 
          Secure Treasury, Modular Logic, and Gasless Voting powered by Account Abstraction.
        </p>

        {/* ==================== SMART ACTION BUTTONS ==================== */}
        <div className="flex flex-col sm:flex-row gap-5 items-center justify-center w-full max-w-md sm:max-w-none mx-auto relative z-20 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300 mb-24 md:mb-32">
          
          <ConnectButton.Custom>
            {({ account, chain, openConnectModal, mounted: rainbowMounted }) => {
              const ready = mounted && rainbowMounted;
              const connected = ready && account && chain;

              return (
                <div className="relative group w-full sm:w-[260px] flex flex-col gap-3">
                  
                  {!ready ? (
                    <button className="relative z-10 w-full py-5 bg-[#0a0a0f] rounded-2xl flex items-center justify-center gap-3 border border-white/10 shadow-xl">
                       <span className="text-white font-bold text-xs tracking-widest uppercase">Initializing...</span>
                    </button>
                  ) : !connected ? (
                    // 1. NOT CONNECTED
                    <>
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
                      <button 
                        onClick={openConnectModal}
                        className="relative z-10 w-full py-5 bg-[#0a0a0f] rounded-2xl flex items-center justify-center gap-3 border border-white/10 hover:bg-white/5 transition-all shadow-xl hover:scale-[1.02]"
                      >
                        <Zap size={18} className="text-blue-400" />
                        <span className="text-white font-bold text-sm tracking-widest uppercase">Launch App</span>
                      </button>
                    </>
                  ) : !isSessionActive ? (
                    // 2. CONNECTED BUT NOT VERIFIED -> Verify + Cancel Button
                    <div className="relative z-10 flex flex-col gap-3 w-full animate-in fade-in zoom-in duration-500">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-40 transition duration-500"></div>
                      <button 
                        onClick={createSession}
                        disabled={isAALoading}
                        className="relative w-full py-5 bg-blue-600 rounded-2xl flex items-center justify-center gap-3 border border-white/10 hover:bg-blue-500 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:scale-[1.02]"
                      >
                        {isAALoading ? (
                          <>
                             <Loader2 className="animate-spin text-white" size={18} />
                             <span className="text-white font-bold text-sm tracking-widest uppercase">Awaiting...</span>
                          </>
                        ) : (
                          <>
                             <KeyRound size={18} className="text-white" />
                             <span className="text-white font-bold text-sm tracking-widest uppercase">Verify Identity</span>
                          </>
                        )}
                      </button>
                      
                      <button 
                        onClick={() => disconnect()}
                        className="w-full py-2 bg-transparent text-slate-500 hover:text-red-400 flex items-center justify-center gap-2 rounded-xl transition-colors group/cancel"
                      >
                        <X size={12} className="group-hover/cancel:rotate-90 transition-transform"/>
                        <span className="font-bold text-[9px] tracking-[0.2em] uppercase">Cancel & Disconnect</span>
                      </button>
                    </div>
                  ) : (
                    // 3. FULLY VERIFIED -> Only Dashboard Button
                    <Link href="/dashboard" className="relative group w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                      <button className="relative w-full py-6 bg-white text-black rounded-xl flex items-center justify-center gap-2 transition-all font-black text-xs tracking-[0.2em] uppercase shadow-2xl hover:scale-[1.03]">
                        Enter Dashboard <ArrowRight size={16} />
                      </button>
                    </Link>
                  )}
                </div>
              );
            }}
          </ConnectButton.Custom>

          <Link href="/docs" className="w-full sm:w-[240px]">
            <div className="w-full py-5 border border-white/10 hover:border-white/20 bg-slate-900/50 hover:bg-slate-800/80 backdrop-blur-md rounded-2xl text-slate-400 font-bold text-xs tracking-widest transition-all flex items-center justify-center gap-3 group uppercase shadow-lg">
               <BookOpen size={16} className="group-hover:text-white transition-colors"/> 
               <span className="group-hover:text-white transition-colors">Documentation</span>
            </div>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div 
          onMouseEnter={() => setIsHoveringCards(true)}
          onMouseLeave={() => setIsHoveringCards(false)}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl w-full px-4 relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500"
        >
           {[
             { title: "Zero-Trust Kernel", desc: "State logic is strictly separated from decision modules, ensuring upgradeable security.", icon: Cpu, color: "text-blue-400" },
             { title: "Timelock Vault", desc: "Cryptographic 48-hour delay on all treasury executions, giving members time to react.", icon: Lock, color: "text-purple-400" },
             { title: "Gasless Voting", desc: "Native ERC-4337 Paymaster integration sponsors 100% of user voting transaction fees.", icon: Zap, color: "text-blue-400" },
           ].map((item, i) => (
             <div 
                key={i} 
                className="p-8 md:p-10 bg-slate-900/30 backdrop-blur-md border border-white/5 rounded-[2rem] hover:border-blue-500/40 hover:bg-slate-900/70 hover:-translate-y-2 transition-all duration-500 group text-left relative overflow-hidden shadow-2xl"
             >
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/0 rounded-full blur-[50px] group-hover:bg-blue-500/20 transition-all duration-700 ease-out"></div>
                <div className="w-12 h-12 bg-black/50 rounded-xl flex items-center justify-center mb-6 border border-white/10 group-hover:border-blue-500/40 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300">
                   <item.icon className={`${item.color} group-hover:scale-110 transition-transform duration-300`} size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 tracking-wide">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-light">{item.desc}</p>
             </div>
           ))}
        </div>

      </main>

      {/* ==================== FOOTER STRIP ==================== */}
      <footer className="w-full border-t border-white/5 bg-[#05050a]/90 backdrop-blur-xl py-4 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest z-50 gap-4 md:gap-0 mt-10">
         <div className="flex items-center gap-4 md:gap-6">
            <span className="flex items-center gap-2"><Activity size={14} className="text-blue-400"/> Latency: 12ms</span>
            <span className="hidden md:inline text-white/10">|</span>
            <span className="flex items-center gap-2"><Server size={14} className="text-purple-400"/> Block: 4829104</span>
         </div>
         <div className="opacity-60 hover:opacity-100 transition-opacity">
            Powered by <span className="text-slate-300 font-black">Nextech Architect</span>
         </div>
      </footer>

    </div>
  );
}