'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { 
  Shield, ArrowLeft, ArrowRight, FileCode, Terminal, Layers, Box, 
  Cpu, AlertTriangle, Database, Code, Globe, Lock, Key, Activity, Zap, 
  CheckCircle, ChevronRight, Calculator, Smartphone, Anchor, BookOpen, 
  GitBranch, Network, FileWarning, Fingerprint, Workflow, Search, 
  MousePointer2, Boxes, Clock, Power, Settings, RefreshCw, Command,
  Hexagon, HardDrive, Share2, Radio, Bell, Users, LayoutTemplate, XCircle,
  Hash, LogOut, Github, MessageSquare, Info, Star, Archive, BarChart3,
  Server as ServerIcon, Flame, Wallet, Menu, X
} from 'lucide-react';

export default function Docs() {

  /* =====================================================
     GLOBAL REFS & STATES
  ===================================================== */

  const mainRef = useRef<HTMLDivElement | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: -1000, y: -1000 });
  const [activeSection, setActiveSection] = useState("overview");
  const [progress, setProgress] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* =====================================================
     EFFECTS — TITLE, CURSOR, SCROLL, OBSERVER
  ===================================================== */

  useEffect(() => {
    document.title = "Sentinel DAO | Technical Whitepaper";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const mainEl = mainRef.current;
      if (!mainEl) return;
      
      const totalHeight = mainEl.scrollHeight - mainEl.clientHeight;
      const scrolled = (mainEl.scrollTop / totalHeight) * 100;
      setProgress(scrolled);
    };

    const mainEl = mainRef.current;
    if (mainEl) {
      mainEl.addEventListener("scroll", handleScroll);
    }
    return () => mainEl?.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.1, root: mainRef.current }
    );

    document.querySelectorAll("section[id]").forEach((sec) => {
      observer.observe(sec);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    if (target && mainRef.current) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      // Close sidebar on mobile after clicking
      setSidebarOpen(false);
    }
  };

  // Close sidebar when screen resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  return (
    // MAIN WRAPPER: Screen size fixed, flex-row layout
    <div className="h-screen w-full bg-[#02000a] text-white font-sans selection:bg-[#ff00ff]/30 flex flex-col md:flex-row overflow-hidden relative">
      
      {/* =========================
          CURSOR NEON SPOTLIGHT (Hidden on Mobile/Touch Devices)
      ========================= */}
      <div
        className="fixed z-[60] pointer-events-none w-[400px] h-[400px] rounded-full blur-[180px] bg-[#ff00ff]/10 transition-transform duration-75 mix-blend-screen hidden md:block"
        style={{
          transform: `translate(${cursorPos.x - 200}px, ${cursorPos.y - 200}px)`,
          left: 0,
          top: 0,
        }}
      />

      {/* =========================
          MOBILE HEADER (Only visible on mobile)
      ========================= */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[100] bg-[#050505] border-b border-white/10 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0a0a0f] rounded-lg border border-white/10">
            <Shield className="text-[#ff00ff] w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tighter uppercase text-white">SENTINEL<span className="text-[#00f3ff]">DOCS</span></span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* =========================
          MOBILE OVERLAY (backdrop when sidebar is open)
      ========================= */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =========================
          RIGHT SIDE PROGRESS BAR
      ========================= */}
      <div className="fixed top-0 right-0 w-1 h-full bg-white/5 z-[80]">
        <div
          className="bg-gradient-to-b from-[#00f3ff] via-[#ff00ff] to-[#00f3ff] w-full transition-all duration-100 ease-out shadow-[0_0_10px_#ff00ff]"
          style={{ height: `${progress}%` }}
        />
      </div>

      {/* ======================== 1. NAVIGATION SIDEBAR ======================== */}
      <aside className={`
        fixed md:relative
        top-0 left-0
        w-80 md:w-80 
        bg-[#050505] 
        border-r border-white/10 
        h-full 
        overflow-y-auto 
        z-[95]
        flex-shrink-0 
        flex flex-col 
        scrollbar-hide
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        mt-[72px] md:mt-0
      `}>
        
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/10 bg-[#050505]/95 backdrop-blur-xl sticky top-0 z-20">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-[#00f3ff] transition-all mb-8 text-[10px] font-bold tracking-[0.2em] group uppercase">
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform text-[#ff00ff]" /> 
            <span>// Return to Terminal</span>
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="relative group p-3 bg-[#0a0a0f] rounded-lg border border-white/10 shadow-[0_0_15px_rgba(255,0,255,0.1)] transition-all hover:border-[#ff00ff]/50 cursor-default">
               <Shield className="text-[#ff00ff] group-hover:rotate-12 transition-transform duration-500" size={28} />
            </div>
            <div>
                <span className="font-bold text-2xl block leading-none tracking-tighter uppercase text-white">SENTINEL</span>
                <div className="flex items-center gap-2 mt-1.5 font-mono">
                   <span className="text-[#00f3ff] text-[9px] font-bold tracking-[0.3em] bg-[#00f3ff]/5 px-2 py-0.5 rounded border border-[#00f3ff]/20">OS V2.0.4</span>
                   <div className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                   </div>
                </div>
            </div>
          </div>

          <div className="relative group">
             <Search size={14} className="absolute left-3 top-3.5 text-gray-600 group-hover:text-[#ff00ff] transition-colors"/>
             <input 
               readOnly 
               placeholder="Search Modules (Ctrl+K)" 
               className="w-full bg-[#0f0f15] border border-white/10 text-gray-400 text-xs rounded-md py-3 pl-9 pr-4 cursor-not-allowed font-mono shadow-inner focus:outline-none transition-colors hover:border-[#ff00ff]/30" 
             />
             <div className="absolute right-3 top-3.5 flex items-center gap-1 opacity-30">
                <Command size={10} /> <span className="text-[9px]">K</span>
             </div>
          </div>
        </div>
        
        {/* Sidebar Nav Links */}
        <nav className="p-6 space-y-10 flex-1 overflow-y-auto">
          {/* Section: Genesis */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
               <div className="w-1.5 h-1.5 bg-[#ff00ff] rounded-sm rotate-45"></div>
               <p className="text-[11px] font-extrabold text-white tracking-[0.2em] uppercase opacity-60">Genesis</p>
            </div>
            <ul className="space-y-1 text-sm text-gray-400 ml-2 border-l border-white/5 pl-4 font-sans">
                <li><button onClick={() => scrollToSection('overview')} className={`block py-2 hover:text-[#ff00ff] transition-all text-xs tracking-wide w-full text-left ${activeSection === 'overview' ? 'text-[#ff00ff] font-bold pl-2 border-l border-[#ff00ff]' : ''}`}>Protocol Overview</button></li>
                <li><button onClick={() => scrollToSection('philosophy')} className={`block py-2 hover:text-[#ff00ff] transition-all text-xs tracking-wide w-full text-left ${activeSection === 'philosophy' ? 'text-[#ff00ff] font-bold pl-2 border-l border-[#ff00ff]' : ''}`}>Design Philosophy</button></li>
                <li><button onClick={() => scrollToSection('architecture')} className={`block py-2 hover:text-[#ff00ff] transition-all text-xs tracking-wide w-full text-left ${activeSection === 'architecture' ? 'text-[#ff00ff] font-bold pl-2 border-l border-[#ff00ff]' : ''}`}>System Architecture</button></li>
            </ul>
          </div>

          {/* Section: The Kernel */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
               <div className="w-1.5 h-1.5 bg-[#00f3ff] rounded-sm rotate-45"></div>
               <p className="text-[11px] font-extrabold text-[#00f3ff] tracking-[0.2em] uppercase opacity-80">The Kernel</p>
            </div>
            <ul className="space-y-1 text-sm text-gray-400 ml-2 border-l border-white/5 pl-4 font-mono text-xs tracking-tighter">
                <li><button onClick={() => scrollToSection('core-layer')} className="block py-2 hover:text-[#00f3ff] transition-all w-full text-left">DAOCore (Registry)</button></li>
                <li><button onClick={() => scrollToSection('timelock')} className="block py-2 hover:text-[#00f3ff] transition-all w-full text-left">DAOTimelock</button></li>
                <li><button onClick={() => scrollToSection('treasury')} className="block py-2 hover:text-[#00f3ff] transition-all w-full text-left">DAOTreasury</button></li>
            </ul>
          </div>

          {/* Section: Governance Engine */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
               <div className="w-1.5 h-1.5 bg-purple-500 rounded-sm rotate-45"></div>
               <p className="text-[11px] font-extrabold text-purple-500 tracking-[0.2em] uppercase opacity-80">Governance</p>
            </div>
            <ul className="space-y-1 text-sm text-gray-400 ml-2 border-l border-white/5 pl-4 font-mono text-xs tracking-tighter">
                <li><button onClick={() => scrollToSection('governor')} className="block py-2 hover:text-purple-400 transition-all w-full text-left">HybridGovernor</button></li>
                <li><button onClick={() => scrollToSection('token')} className="block py-2 hover:text-purple-400 transition-all w-full text-left">GovernanceToken (DISO)</button></li>
                <li><button onClick={() => scrollToSection('strategies')} className="block py-2 hover:text-purple-400 transition-all w-full text-left">VotingStrategies</button></li>
                <li><button onClick={() => scrollToSection('delegation')} className="block py-2 hover:text-purple-400 transition-all w-full text-left">Delegation (EIP-712)</button></li>
            </ul>
          </div>

          {/* Section: Security Matrix */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
               <div className="w-1.5 h-1.5 bg-red-500 rounded-sm rotate-45"></div>
               <p className="text-[11px] font-extrabold text-red-500 tracking-[0.2em] uppercase opacity-80">Defense Matrix</p>
            </div>
            <ul className="space-y-1 text-sm text-gray-400 ml-2 border-l border-white/5 pl-4 font-mono text-xs tracking-tighter">
                <li><button onClick={() => scrollToSection('rbac')} className="block py-2 hover:text-red-400 transition-all w-full text-left">RoleManager (RBAC)</button></li>
                <li><button onClick={() => scrollToSection('veto')} className="block py-2 hover:text-red-400 transition-all w-full text-left">VetoCouncil</button></li>
                <li><button onClick={() => scrollToSection('pause')} className="block py-2 hover:text-red-400 transition-all w-full text-left">EmergencyPause</button></li>
                <li><button onClick={() => scrollToSection('ragequit')} className="block py-2 hover:text-red-400 transition-all w-full text-left">RageQuit</button></li>
            </ul>
          </div>

          {/* Section: Developer */}
          <div className="space-y-4 pb-20">
            <div className="flex items-center gap-2 px-2">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-sm rotate-45"></div>
               <p className="text-[11px] font-extrabold text-green-500 tracking-[0.2em] uppercase opacity-80">Dev Suite</p>
            </div>
            <ul className="space-y-1 text-sm text-gray-400 ml-2 border-l border-white/5 pl-4 font-mono text-xs">
                <li><button onClick={() => scrollToSection('aa')} className="block py-2 hover:text-green-400 transition-all w-full text-left">Account Abstraction</button></li>
                <li><button onClick={() => scrollToSection('upgrades')} className="block py-2 hover:text-green-400 transition-all w-full text-left">UUPS Upgrades</button></li>
                <li><button onClick={() => scrollToSection('deployment')} className="block py-2 hover:text-green-400 transition-all w-full text-left">Deployment Flow</button></li>
            </ul>
          </div>
        </nav>

        {/* Sidebar Bottom Footer Info */}
        <div className="p-6 border-t border-white/5 bg-black/80 text-[9px] font-mono text-gray-600">
           <div className="flex justify-between items-center mb-2">
              <span className="tracking-widest">NETWORK_ID</span>
              <span className="text-[#00f3ff]">0xAA36A7 (Sepolia)</span>
           </div>
           <div className="flex justify-between items-center mb-2">
              <span className="tracking-widest">ENCRYPTION</span>
              <span className="text-green-500">SHA-256 / ECDSA</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="tracking-widest">STATUS</span>
              <span className="text-[#ff00ff] animate-pulse">OPERATIONAL</span>
           </div>
        </div>
      </aside>

      {/* ======================== 2. MAIN CONTENT AREA ======================== */}
      <main 
        ref={mainRef}
        className="flex-1 h-full overflow-y-auto scroll-smooth custom-scroll relative bg-[#02000a] text-gray-300 mt-[72px] md:mt-0"
      >
        
        {/* Background Decorative Glows */}
        <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-[#00f3ff]/5 rounded-full blur-[140px] pointer-events-none opacity-50"></div>
        <div className="fixed bottom-0 left-0 w-[800px] h-[800px] bg-[#ff00ff]/5 rounded-full blur-[140px] pointer-events-none opacity-50"></div>

        <div className="max-w-5xl mx-auto p-4 sm:p-8 md:px-24 md:pb-24 md:pt-4 relative z-10">
          
          {/* ========================= SECTION 1: OVERVIEW ========================= */}
          <section id="overview" className="mb-32 md:mb-48 pt-10">
            <div className="flex items-center gap-3 mb-10">
                <div className="h-[1px] bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent w-8 md:w-16"></div>
                <span className="text-[#00f3ff] text-[10px] font-black tracking-[0.4em] md:tracking-[0.6em] uppercase">Tech Specification</span>
                <div className="h-[1px] bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent w-8 md:w-16"></div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-8 leading-[0.9] tracking-tighter text-white">
              SENTINEL <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff00ff] to-[#00f3ff]">DAO_PROTOCOL</span>
            </h1>
            
            <div className="relative mb-12 md:mb-20 p-6 md:p-10 border border-white/5 bg-[#050505]/60 rounded-2xl md:rounded-3xl backdrop-blur-xl group overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#ff00ff] to-transparent opacity-40"></div>
              
              <p className="text-base sm:text-lg md:text-xl text-gray-200 leading-relaxed font-light mb-6 md:mb-8 max-w-4xl">
                The SENTINEL PROTOCOL is a state-of-the-art, modular governance operating system engineered for institutional-grade decentralized organizations. Built on the robust foundations of Solidity and the OpenZeppelin governance stack, it leverages Foundry's advanced testing suite to deliver a deterministic, gas-optimized decision engine compliant with modern EIP standards.
              </p>
              
              <p className="text-sm sm:text-base md:text-lg text-gray-400 leading-relaxed font-light">
                By implementing a rigorous <strong>"Registry-Logic-Vault"</strong> tri-layer architecture, Sentinel enforces a Zero-Trust Kernel model. This ensures that the protocol's treasury assets and core permissions remain cryptographically secured within immutable Vault contracts, while the governance logic—ranging from voting strategies to execution delays—can be hot-swapped and evolved seamlessly via UUPS proxies without requiring asset migration or compromising protocol integrity.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-[#0a0a12] p-6 md:p-8 rounded-2xl border border-white/5 hover:border-[#00f3ff]/40 transition-all duration-500 group relative">
                  <Layers className="text-[#00f3ff] mb-4 md:mb-6 group-hover:scale-110 transition-transform" size={28} />
                  <h3 className="text-base md:text-lg font-bold mb-2 md:mb-3 text-white uppercase tracking-tighter font-mono">Modular Core</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Swap voting strategies like applications. Zero asset migration required for logic upgrades.</p>
               </div>
               <div className="bg-[#0a0a12] p-6 md:p-8 rounded-2xl border border-white/5 hover:border-[#ff00ff]/40 transition-all duration-500 group relative">
                  <Lock className="text-[#ff00ff] mb-4 md:mb-6 group-hover:scale-110 transition-transform" size={28} />
                  <h3 className="text-base md:text-lg font-bold mb-2 md:mb-3 text-white uppercase tracking-tighter font-mono">Timelock Matrix</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Cryptographically enforced 48-hour latency on all state mutations. Can't be bypassed.</p>
               </div>
               <div className="bg-[#0a0a12] p-6 md:p-8 rounded-2xl border border-white/5 hover:border-purple-400/40 transition-all duration-500 group relative">
                  <Zap className="text-purple-400 mb-4 md:mb-6 group-hover:scale-110 transition-transform" size={28} />
                  <h3 className="text-base md:text-lg font-bold mb-2 md:mb-3 text-white uppercase tracking-tighter font-mono">Gasless Flow</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Native ERC-4337 Account Abstraction sponsors user voting fees via custom Paymasters.</p>
               </div>
            </div>
          </section>

          {/* ========================= SECTION 2: PHILOSOPHY ========================= */}
          <section id="philosophy" className="mb-32 md:mb-48 pt-10 md:pt-20 border-t border-white/5">
             <div className="flex items-center gap-4 md:gap-6 mb-12 md:mb-16">
               <div className="w-12 h-12 md:w-14 md:h-14 bg-[#0a0a0f] rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
                  <Anchor className="text-[#ff00ff] w-5 h-5 md:w-6 md:h-6" />
               </div>
               <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase text-white">Protocol Philosophy</h2>
             </div>
             <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-start">
               <div className="relative pl-6 md:pl-8 border-l border-[#00f3ff]/30">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 font-mono uppercase tracking-tighter text-[#00f3ff]">01. Decentralization by Design</h3>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-4 md:mb-6 font-light">
                    No single admin has permanent control. Timelock + governance required for critical changes. The system is designed as a composable governance protocol, not a monolithic contract.
                  </p>
               </div>

               <div className="relative pl-6 md:pl-8 border-l border-[#ff00ff]/30">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 font-mono uppercase tracking-tighter text-[#ff00ff]">02. Security First</h3>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-4 md:mb-6 font-light">
                    Emergency pause system, Role-based access control (RBAC), Reentrancy guards, and Batch operations. Safety is baked into the bytecode.
                  </p>
               </div>
             </div>
          </section>

          {/* ========================= SECTION 3: ARCHITECTURE SCHEMA ========================= */}
          <section id="architecture" className="mb-32 md:mb-48 pt-10 md:pt-20 border-t border-white/5">
             <div className="flex items-center gap-4 mb-12 md:mb-16">
                <LayoutTemplate className="text-[#00f3ff] w-8 h-8 md:w-10 md:h-10" />
                <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tighter font-mono text-white">System Architecture</h2>
             </div>

             <div className="bg-[#050505] p-6 md:p-10 rounded-2xl md:rounded-[32px] border border-white/10 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-grid-white/[0.02]"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 relative z-10">
                   
                   {/* GOVERNANCE LAYER */}
                   <div className="p-4 md:p-6 bg-[#1a1a20] border border-purple-500/20 rounded-xl">
                      <div className="text-purple-500 text-[10px] font-mono mb-3 md:mb-4 uppercase font-bold tracking-widest">Governance Layer</div>
                      <ul className="space-y-2 text-xs font-mono text-gray-400">
                         <li>├── HybridGovernorDynamic</li>
                         <li>├── VetoCouncil</li>
                         <li>├── ProposalGuard</li>
                         <li>└── GovernanceAnalytics</li>
                      </ul>
                   </div>

                   {/* SECURITY LAYER */}
                   <div className="p-4 md:p-6 bg-[#1a1a20] border border-red-500/20 rounded-xl">
                      <div className="text-red-500 text-[10px] font-mono mb-3 md:mb-4 uppercase font-bold tracking-widest">Security Layer</div>
                      <ul className="space-y-2 text-xs font-mono text-gray-400">
                         <li>├── RoleManager (RBAC)</li>
                         <li>├── EmergencyPause</li>
                         <li>└── RageQuit</li>
                      </ul>
                   </div>

                   {/* TREASURY LAYER */}
                   <div className="p-4 md:p-6 bg-[#1a1a20] border border-green-500/20 rounded-xl">
                      <div className="text-green-500 text-[10px] font-mono mb-3 md:mb-4 uppercase font-bold tracking-widest">Treasury Layer</div>
                      <ul className="space-y-2 text-xs font-mono text-gray-400">
                         <li>├── DAOTreasury</li>
                         <li>├── TreasuryYieldStrategy</li>
                         <li>└── AssetVault</li>
                      </ul>
                   </div>

                   {/* VOTING LAYER */}
                   <div className="p-4 md:p-6 bg-[#1a1a20] border border-[#00f3ff]/20 rounded-xl">
                      <div className="text-[#00f3ff] text-[10px] font-mono mb-3 md:mb-4 uppercase font-bold tracking-widest">Voting Layer</div>
                      <ul className="space-y-2 text-xs font-mono text-gray-400">
                         <li>├── QuadraticFunding</li>
                         <li>├── ConvictionVoting</li>
                         <li>└── DelegationRegistry</li>
                      </ul>
                   </div>

                   {/* CORE LAYER */}
                   <div className="p-4 md:p-6 bg-[#1a1a20] border border-white/20 rounded-xl">
                      <div className="text-white text-[10px] font-mono mb-3 md:mb-4 uppercase font-bold tracking-widest">Core Layer</div>
                      <ul className="space-y-2 text-xs font-mono text-gray-400">
                         <li>├── DAOCore (Registry)</li>
                         <li>└── DAOTimelock</li>
                      </ul>
                   </div>

                   {/* AA LAYER */}
                   <div className="p-4 md:p-6 bg-[#1a1a20] border border-yellow-500/20 rounded-xl">
                      <div className="text-yellow-500 text-[10px] font-mono mb-3 md:mb-4 uppercase font-bold tracking-widest">Execution Layer</div>
                      <ul className="space-y-2 text-xs font-mono text-gray-400">
                         <li>├── UpgradeExecutor</li>
                         <li>└── DAOPayMaster</li>
                      </ul>
                   </div>

                </div>
             </div>
          </section>

          {/* ========================= SECTION 4: KERNEL DEEP DIVE ========================= */}
          <section id="core-layer" className="mb-32 md:mb-48 pt-10 md:pt-20 border-t border-white/5">
             <div className="flex items-center gap-4 md:gap-6 mb-12 md:mb-16">
               <div className="p-3 md:p-4 bg-[#00f3ff]/10 rounded-xl md:rounded-2xl border border-[#00f3ff]/20">
                  <Database className="text-[#00f3ff] w-8 h-8 md:w-10 md:h-10" />
               </div>
               <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-tighter text-white">The Kernel Stack</h2>
             </div>
             
             <div className="space-y-12 md:space-y-16">
                {/* 4.1 DAO CORE */}
                <div id="core-registry" className="grid lg:grid-cols-2 gap-8 md:gap-12 items-start">
                   <div className="space-y-4 md:space-y-6">
                      <h4 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                         <span className="text-[#00f3ff]">01.</span> DAOCore.sol
                      </h4>
                      <p className="text-gray-400 text-sm md:text-base leading-relaxed font-light">
                        The central nervous system. In our Zero-Trust architecture, components do not trust each other implicitly. 
                        They must query <code>getModuleAddress(bytes32 moduleId)</code> to verify if a calling contract is authorized.
                      </p>
                      <div className="flex flex-wrap gap-3">
                         <span className="text-[10px] font-mono bg-white/5 px-3 py-1 rounded border border-white/10 uppercase text-gray-300">Registry Module</span>
                         <span className="text-[10px] font-mono bg-white/5 px-3 py-1 rounded border border-white/10 uppercase text-gray-300">RBAC Enabled</span>
                      </div>
                   </div>
                   <div className="bg-[#050505] p-6 md:p-8 rounded-2xl border border-white/10 font-mono text-[10px] md:text-xs shadow-2xl relative overflow-x-auto">
                      <div className="text-gray-600 mb-4 md:mb-6 border-b border-gray-800 pb-2 uppercase tracking-widest flex justify-between">
                         <span>// IDAOCore.sol</span>
                         <span className="text-green-500">VERIFIED</span>
                      </div>
                      <div className="space-y-2 text-gray-300">
                         <div className="text-purple-400">/** @dev Module Verification Logic */</div>
                         <div><span className="text-[#00f3ff]">function</span> <span className="text-yellow-400">isAuthorized</span>(bytes32 id, address caller)</div>
                         <div className="pl-4 text-purple-400">external view returns (bool) {'{'}</div>
                         <div className="pl-8 text-white">return <span className="text-green-500">_modules</span>[id] == caller;</div>
                         <div className="pl-4 text-purple-400">{'}'}</div>
                      </div>
                   </div>
                </div>

                {/* 4.2 TIMELOCK */}
                <div id="timelock" className="bg-[#0a0a0f] p-6 md:p-10 rounded-2xl md:rounded-[32px] border border-yellow-500/10 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-yellow-500/5 blur-[100px] pointer-events-none"></div>
                   <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center relative z-10">
                      <div className="p-4 md:p-6 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                         <Clock size={28} className="text-yellow-500 md:w-8 md:h-8" />
                      </div>
                      <div className="flex-1">
                         <h4 className="text-xl md:text-2xl font-black mb-3 md:mb-4 uppercase tracking-tighter text-white">DAOTimelock.sol</h4>
                         <p className="text-gray-400 text-sm md:text-base leading-relaxed font-light mb-4 md:mb-6">
                            Speed is the enemy of security. This contract enforces a mandatory <strong>48-hour latency</strong> on all executions. It provides the Veto Council a deterministic window to nullify malicious payloads.
                         </p>
                         <div className="flex gap-4">
                            <div className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-500 font-mono text-[10px] font-bold">172,800 SEC DELAY</div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* 4.3 TREASURY */}
                <div id="treasury" className="grid lg:grid-cols-2 gap-8 md:gap-12 items-start">
                   <div className="space-y-4 md:space-y-6">
                      <h4 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                         <span className="text-green-500">03.</span> DAOTreasury.sol
                      </h4>
                      <p className="text-gray-400 text-sm md:text-base leading-relaxed font-light">
                         Multi-asset treasury that supports ETH, ERC20 tokens, ERC721 NFTs, and ERC1155 tokens. 
                         Only the <strong>Timelock</strong> and <strong>RageQuit</strong> contract can withdraw funds. This is standard DAO safety design.
                      </p>
                   </div>
                   <div className="bg-[#050505] p-6 md:p-8 rounded-2xl border border-green-500/20 font-mono text-xs shadow-2xl relative">
                       <ul className="space-y-4">
                          <li className="flex items-center justify-between border-b border-white/5 pb-2">
                             <span className="text-gray-400">NATIVE_ETH</span>
                             <span className="text-green-500">SUPPORTED</span>
                          </li>
                          <li className="flex items-center justify-between border-b border-white/5 pb-2">
                             <span className="text-gray-400">ERC_20</span>
                             <span className="text-green-500">SUPPORTED</span>
                          </li>
                          <li className="flex items-center justify-between border-b border-white/5 pb-2">
                             <span className="text-gray-400">ERC_721</span>
                             <span className="text-green-500">SUPPORTED</span>
                          </li>
                       </ul>
                   </div>
                </div>
             </div>
          </section>

          {/* ========================= SECTION 5: GOVERNANCE ENGINE ========================= */}
          <section id="governor" className="mb-32 md:mb-48 pt-10 md:pt-20 border-t border-white/5">
             <div className="flex items-center gap-4 md:gap-6 mb-12 md:mb-16">
               <div className="p-3 md:p-4 bg-purple-500/10 rounded-xl md:rounded-2xl border border-purple-500/20">
                  <Cpu className="text-purple-500 w-8 h-8 md:w-10 md:h-10" />
               </div>
               <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-tighter text-white">Governance Engine</h2>
             </div>

             <div className="bg-[#0a0a0f] p-6 md:p-12 rounded-2xl md:rounded-[40px] border border-white/5 relative overflow-hidden mb-12 md:mb-16">
                <div className="grid lg:grid-cols-2 gap-8 md:gap-16 relative z-10">
                   <div>
                      <h4 className="text-lg md:text-xl font-bold font-mono text-white uppercase mb-4 md:mb-6 tracking-tighter text-[#ff00ff]">HybridGovernorDynamic.sol</h4>
                      <p className="text-gray-400 text-sm md:text-base leading-relaxed font-light font-mono mb-6 md:mb-8">
                        The Brain of the DAO. Combines OpenZeppelin Governor, Timelock control, Quorum fraction, Custom reputation system, and Veto council checks.
                      </p>
                      <ul className="space-y-3 md:space-y-4 font-mono text-xs text-gray-500">
                         <li className="flex items-center gap-3"><CheckCircle size={14} className="text-[#00f3ff] flex-shrink-0" /> Proposal cooldown logic</li>
                         <li className="flex items-center gap-3"><CheckCircle size={14} className="text-[#00f3ff] flex-shrink-0" /> Reputation-based filtering</li>
                         <li className="flex items-center gap-3"><CheckCircle size={14} className="text-[#00f3ff] flex-shrink-0" /> Strategy locking per proposal</li>
                      </ul>
                   </div>
                   <div className="bg-black/60 p-6 md:p-8 rounded-2xl border border-white/10 font-mono text-xs shadow-inner flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-4 md:mb-6">
                         <span className="text-gray-500 uppercase tracking-widest text-[10px]">Governance Token</span>
                         <span className="text-[#ff00ff] font-bold">DISO</span>
                      </div>
                      <div className="space-y-3 text-gray-300 text-[10px] md:text-xs">
                         <div className="flex justify-between border-b border-white/5 pb-2"><span>Max Supply</span> <span>1,000,000,000</span></div>
                         <div className="flex justify-between border-b border-white/5 pb-2"><span>Initial Mint</span> <span>150,000,000</span></div>
                         <div className="flex justify-between border-b border-white/5 pb-2"><span>Standard</span> <span className="text-right">ERC20Votes + Permit</span></div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Voting Strategies */}
             <div id="strategies" className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                 <div className="p-6 md:p-8 bg-[#0a0a12] border border-white/5 rounded-2xl hover:border-purple-500/30 transition-all group">
                     <Calculator className="text-purple-400 mb-4 md:mb-6 group-hover:scale-110 transition-transform" size={28}/>
                     <h5 className="text-white font-bold mb-2 text-sm md:text-base">Quadratic Funding</h5>
                     <p className="text-xs text-gray-500 leading-relaxed font-mono">
                        Weight = (sum of sqrt(contributions))^2. Prevents whales from dominating matching pools.
                     </p>
                 </div>
                 <div className="p-6 md:p-8 bg-[#0a0a12] border border-white/5 rounded-2xl hover:border-green-500/30 transition-all group">
                     <Activity className="text-green-500 mb-4 md:mb-6 group-hover:scale-110 transition-transform" size={28}/>
                     <h5 className="text-white font-bold mb-2 text-sm md:text-base">Conviction Voting</h5>
                     <p className="text-xs text-gray-500 leading-relaxed font-mono">
                        Combines Token amount + Lock duration. Max lock = 4 years (4x multiplier).
                     </p>
                 </div>
                 <div className="p-6 md:p-8 bg-[#0a0a12] border border-white/5 rounded-2xl hover:border-blue-500/30 transition-all group">
                     <Network className="text-blue-500 mb-4 md:mb-6 group-hover:scale-110 transition-transform" size={28}/>
                     <h5 className="text-white font-bold mb-2 text-sm md:text-base">Delegation (EIP-712)</h5>
                     <p className="text-xs text-gray-500 leading-relaxed font-mono">
                        Users can delegate voting power off-chain via signature. No on-chain transaction needed.
                     </p>
                 </div>
             </div>
          </section>

          {/* ========================= SECTION 6: SECURITY MATRIX ========================= */}
          <section id="rbac" className="mb-32 md:mb-48 pt-10 md:pt-20 border-t border-white/5">
             <div className="flex items-center gap-4 md:gap-6 mb-12 md:mb-16">
               <div className="p-3 md:p-4 bg-red-500/10 rounded-xl md:rounded-2xl border border-red-500/20">
                  <Shield className="text-red-500 w-8 h-8 md:w-10 md:h-10" />
               </div>
               <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-tighter text-white">Defense Matrix</h2>
             </div>

             <div className="grid lg:grid-cols-2 gap-8 md:gap-12 mb-12 md:mb-16">
                {/* Role Manager */}
                <div className="bg-[#0a0a0f] p-6 md:p-8 rounded-2xl border border-red-500/10">
                   <h4 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                      <Key className="text-red-500" size={20}/> Role-Based Access (RBAC)
                   </h4>
                   <p className="text-xs md:text-sm text-gray-400 mb-4 md:mb-6">Contract: <code>RoleManager.sol</code></p>
                   <ul className="space-y-3 text-xs font-mono text-gray-500">
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></div> ADMIN_ROLE (Timelock)</li>
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></div> GUARDIAN_ROLE (Veto)</li>
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></div> EXECUTOR_ROLE (Upgrade)</li>
                   </ul>
                </div>

                {/* Emergency Pause */}
                <div id="pause" className="bg-[#0a0a0f] p-6 md:p-8 rounded-2xl border border-red-500/10">
                   <h4 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                      <Power className="text-red-500" size={20}/> Emergency Pause
                   </h4>
                   <p className="text-xs md:text-sm text-gray-400 mb-4 md:mb-6">Contract: <code>EmergencyPause.sol</code></p>
                   <div className="bg-red-500/5 p-4 rounded-lg border border-red-500/10 text-xs text-red-300 leading-relaxed">
                      Circuit breaker for DAO. Only Guardians can pause. Auto-resets after 7 days. Protects against exploits and malicious governance.
                   </div>
                </div>
             </div>

             {/* Veto & RageQuit */}
             <div className="grid md:grid-cols-2 gap-8 md:gap-10">
                <div id="veto" className="p-6 md:p-8 bg-[#0a0a0f] rounded-2xl border border-white/5">
                   <div className="flex items-center gap-3 mb-3 md:mb-4">
                      <XCircle className="text-orange-500 flex-shrink-0" size={24}/>
                      <h4 className="text-base md:text-lg font-bold text-white uppercase">Veto Council</h4>
                   </div>
                   <p className="text-xs text-gray-500 leading-relaxed">
                      If 3 guardians veto a proposal, it is rejected even if passed. Prevents flash loan governance attacks and bribery-based voting.
                   </p>
                </div>
                <div id="ragequit" className="p-6 md:p-8 bg-[#0a0a0f] rounded-2xl border border-white/5">
                   <div className="flex items-center gap-3 mb-3 md:mb-4">
                      <LogOut className="text-orange-500 flex-shrink-0" size={24}/>
                      <h4 className="text-base md:text-lg font-bold text-white uppercase">RageQuit</h4>
                   </div>
                   <p className="text-xs text-gray-500 leading-relaxed">
                      Allows users to burn governance tokens and withdraw proportional share of treasury. Protects minority holders.
                   </p>
                </div>
             </div>
          </section>

          {/* ========================= SECTION 7: ACCOUNT ABSTRACTION ========================= */}
          <section id="aa" className="mb-32 md:mb-48 pt-10 md:pt-20 border-t border-white/5">
             <div className="flex items-center gap-4 md:gap-6 mb-12 md:mb-16">
               <div className="p-3 md:p-4 bg-yellow-500/10 rounded-xl md:rounded-2xl border border-yellow-500/20">
                  <Zap className="text-yellow-500 w-8 h-8 md:w-10 md:h-10" />
               </div>
               <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-tighter text-white">Gasless Infrastructure</h2>
             </div>

             <div className="flex flex-col xl:flex-row gap-8 md:gap-12 font-mono">
                <div className="flex-1 bg-[#1a1a20] p-6 md:p-10 rounded-2xl md:rounded-3xl border border-white/5 border-l-4 border-yellow-400 relative overflow-hidden">
                   <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 uppercase">DAOPayMaster.sol</h3>
                   <p className="text-gray-400 text-xs md:text-sm leading-relaxed mb-6 md:mb-8 font-sans">
                      This contract holds an ETH balance from the Treasury. It implements custom validation logic to ensure it ONLY pays for `castVote` and `delegate` functions. Users pay $0 gas.
                   </p>
                   <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded border border-yellow-500/20 uppercase font-bold">ERC-4337 Compliant</span>
                </div>

                <div className="flex-1 bg-[#050505] p-6 md:p-10 rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl overflow-x-auto">
                   <div className="text-gray-600 mb-4 md:mb-6 border-b border-gray-800 pb-2 uppercase tracking-widest text-xs">// USER_OPERATION</div>
                   <div className="space-y-3 font-mono text-[10px] text-gray-300">
                      <div className="break-all">sender: <span className="text-green-400">0xUser_Wallet...</span></div>
                      <div className="break-all">paymaster: <span className="text-yellow-400">0xDAOPaymaster...</span></div>
                      <div className="break-all">signature: <span className="text-purple-400">EIP-712_Typed_Data</span></div>
                   </div>
                </div>
             </div>
          </section>

          {/* ========================= SECTION 8: DEVELOPER SDK & DEPLOYMENT ========================= */}
          <section id="deployment" className="mb-32 md:mb-48 pt-10 md:pt-20 border-t border-white/5">
             <div className="flex items-center gap-4 md:gap-6 mb-12 md:mb-16">
               <div className="p-3 md:p-4 bg-green-500/10 rounded-xl md:rounded-2xl border border-green-500/20">
                  <Terminal className="text-green-500 w-8 h-8 md:w-10 md:h-10" />
               </div>
               <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-tighter text-white">Deployment Pipeline</h2>
             </div>

             <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                <div className="bg-[#0a0a0f] p-6 md:p-8 rounded-2xl border border-white/5">
                   <h4 className="text-white font-bold mb-4 md:mb-6 text-sm uppercase tracking-widest border-b border-white/5 pb-4">Order of Operations</h4>
                   <ol className="space-y-3 md:space-y-4 text-xs font-mono text-gray-500">
                      <li className="flex items-start gap-3"><span className="text-green-500 flex-shrink-0">01.</span> <span>Deploy RoleManager + Token</span></li>
                      <li className="flex items-start gap-3"><span className="text-green-500 flex-shrink-0">02.</span> <span>Deploy Timelock Controller</span></li>
                      <li className="flex items-start gap-3"><span className="text-green-500 flex-shrink-0">03.</span> <span>Deploy Governor + VetoCouncil</span></li>
                      <li className="flex items-start gap-3"><span className="text-green-500 flex-shrink-0">04.</span> <span>Deploy Treasury + Yield Strategy</span></li>
                      <li className="flex items-start gap-3"><span className="text-green-500 flex-shrink-0">05.</span> <span>Wire Everything via DAOCore</span></li>
                   </ol>
                </div>
                <div className="bg-[#0a0a0f] p-6 md:p-8 rounded-2xl border border-white/5">
                   <h4 className="text-white font-bold mb-4 md:mb-6 text-sm uppercase tracking-widest border-b border-white/5 pb-4">Upgradability (UUPS)</h4>
                   <p className="text-xs text-gray-400 leading-relaxed mb-3 md:mb-4">
                      Contracts: <code>GovernanceUUPS.sol</code>, <code>UpgradeExecutor.sol</code>.
                   </p>
                   <p className="text-xs text-gray-500 leading-relaxed">
                      Only the DAO (via Timelock) can upgrade contracts. No backdoors. Batch upgrades supported for atomic migrations.
                   </p>
                </div>
             </div>
          </section>

          {/* ======================== FOOTER ======================== */}
          <footer className="border-t border-white/10 pt-12 md:pt-20 pb-12 mt-20 md:mt-32 relative overflow-hidden font-mono z-10">
            {/* Background Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-t from-[#00f3ff]/5 to-transparent blur-[100px] pointer-events-none"></div>

            <div className="flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                    <div className="p-2 bg-white/5 rounded border border-white/10">
                        <Shield size={20} className="text-[#ff00ff] md:w-6 md:h-6" />
                    </div>
                    <span className="font-black tracking-[0.3em] md:tracking-[0.4em] text-xl md:text-2xl text-white">SENTINEL</span>
                </div>
                
                <p className="text-gray-500 leading-relaxed max-w-lg text-xs mb-8 md:mb-10 font-sans font-light px-4">
                    Architecting deterministic decision-making systems for institutional-grade decentralized organizations. Code is Law. Justice is Algorithmic.
                </p>

                {/* System Status Metrics */}
                <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-8 md:mb-12">
                   <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] text-gray-600 uppercase tracking-widest">Environment</span>
                      <span className="text-[#00f3ff] text-xs font-bold">SEPOLIA_V3</span>
                   </div>
                   <div className="w-px h-8 bg-white/10"></div>
                   <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] text-gray-600 uppercase tracking-widest">Build</span>
                      <span className="text-white text-xs font-bold">2.0.4-STABLE</span>
                   </div>
                   <div className="w-px h-8 bg-white/10"></div>
                   <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] text-gray-600 uppercase tracking-widest">System</span>
                      <span className="text-green-500 text-xs font-bold animate-pulse">OPERATIONAL</span>
                   </div>
                </div>

                <div className="border-t border-white/5 pt-6 md:pt-8 w-full flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] md:text-[10px] text-gray-600 font-mono tracking-widest px-4">
                    <p>
                        &copy; 2026 SENTINEL_PROTOCOL. OPEN_SOURCE(MIT)
                    </p>
                    <p className="flex items-center gap-2 flex-wrap justify-center">
                        ENGINEERED BY <a href="https://github.com/NexTechArchitect" target="_blank" className="text-white hover:text-[#00f3ff] font-bold transition-all px-2 py-0.5 bg-white/5 rounded border border-white/10 uppercase">NexTechArchitect</a>
                    </p>
                </div>
            </div>
          </footer>

        </div>
      </main>
    </div>
  );
}
