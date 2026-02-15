'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { 
  Shield, ArrowLeft, Layers, 
  Cpu, Database, Lock, Key, Zap, 
  CheckCircle, Calculator, Anchor, BookOpen, 
  Network, Search, Command,
  Menu, X, Leaf, Feather, Activity, LogOut, Github, Globe
} from 'lucide-react';
import { motion } from 'framer-motion';

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
    opacity: [ 0, 0.4, 0.4, 0 ], 
    transition: {
      duration: 20 + Math.random() * 15, 
      repeat: Infinity,
      ease: "linear",
      delay: Math.random() * 10
    }
  })
};

const navData = [
  {
    category: "Genesis",
    icon: Leaf,
    color: "text-emerald-800",
    items: [
      { id: "overview", label: "Protocol Overview" },
      { id: "philosophy", label: "Design Philosophy" },
      { id: "architecture", label: "System Architecture" }
    ]
  },
  {
    category: "The Kernel",
    icon: Database,
    color: "text-stone-900",
    items: [
      { id: "core-layer", label: "DAOCore (Registry)" },
      { id: "timelock", label: "DAOTimelock" },
      { id: "treasury", label: "DAOTreasury" }
    ]
  },
  {
    category: "Governance",
    icon: Cpu,
    color: "text-amber-700",
    items: [
      { id: "governor", label: "HybridGovernor" },
      { id: "token", label: "GovernanceToken (DISO)" },
      { id: "strategies", label: "VotingStrategies" },
      { id: "delegation", label: "Delegation (EIP-712)" }
    ]
  },
  {
    category: "Defense",
    icon: Shield,
    color: "text-stone-900",
    items: [
      { id: "security", label: "Security Matrix" },
      { id: "rbac", label: "RoleManager (RBAC)" },
      { id: "veto", label: "VetoCouncil" },
      { id: "pause", label: "EmergencyPause" },
      { id: "ragequit", label: "RageQuit" }
    ]
  },
  {
    category: "Dev Suite",
    icon: Zap,
    color: "text-emerald-700",
    items: [
      { id: "aa", label: "Account Abstraction" },
      { id: "upgrades", label: "UUPS Upgrades" },
      { id: "deployment", label: "Deployment Flow" }
    ]
  }
];

export default function Docs() {
  const mainRef = useRef<HTMLDivElement | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [progress, setProgress] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    document.title = "Sentinel DAO | Technical Manifesto";
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
      { threshold: 0.2, root: mainRef.current }
    );

    document.querySelectorAll("section[id]").forEach((sec) => {
      observer.observe(sec);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    if (target && mainRef.current) {
      mainRef.current.scrollTo({
        top: target.offsetTop - 80,
        behavior: "smooth"
      });
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredNav = navData.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
      section.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  const leafColors = ["#15803d", "#b45309", "#4b5563", "#0f766e"];

  return (
    <div className="h-screen w-full bg-[#F5F2EB] text-black font-serif selection:bg-stone-300 flex flex-col md:flex-row overflow-hidden relative">
      
      <div className="fixed inset-0 z-0 opacity-[0.3] pointer-events-none mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <div className="fixed inset-0 z-0 overflow-hidden h-full pointer-events-none">
        {[...Array(12)].map((_, i) => {
          const isFeather = i % 2 === 0;
          const randomSize = 20 + Math.random() * 20; 
          const randomLeft = Math.floor(Math.random() * 100);
          const color = leafColors[i % leafColors.length];
          
          return (
            <motion.div
              key={i}
              custom={i % 2 === 0 ? 1 : -1}
              variants={fallingVariants}
              initial="initial"
              animate="animate"
              className="absolute"
              style={{ 
                left: `${randomLeft}%`, 
                color: color
              }} 
            >
              {isFeather ? 
                <Feather size={randomSize} strokeWidth={1.5} /> : 
                <Leaf size={randomSize} strokeWidth={1.5} fill={color} fillOpacity={0.2} />
              }
            </motion.div>
          )
        })}
      </div>

      <div className="md:hidden fixed top-0 left-0 right-0 z-[100] bg-[#F5F2EB]/95 backdrop-blur-md border-b border-[#D6D3C0] px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg border border-[#D6D3C0] shadow-sm">
            <Shield className="text-black w-5 h-5" strokeWidth={2} />
          </div>
          <span className="font-bold text-lg tracking-tight text-black font-sans">SENTINEL<span className="text-stone-600 font-medium">DOCS</span></span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2.5 bg-white border border-[#D6D3C0] rounded-lg text-black active:bg-stone-100"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="fixed top-0 right-0 w-1.5 h-full bg-[#E5E0D6] z-[80] hidden md:block">
        <div
          className="bg-black w-full transition-all duration-100 ease-out"
          style={{ height: `${progress}%` }}
        />
      </div>

      <aside className={`
        fixed md:relative
        top-0 left-0
        w-80 md:w-80 
        bg-[#EBE9E4] 
        border-r border-[#cfcdc4] 
        h-full 
        overflow-y-auto 
        z-[95]
        flex-shrink-0 
        flex flex-col 
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        pt-[72px] md:pt-0
        shadow-2xl md:shadow-none
      `}>
        
        <div className="p-8 border-b border-[#cfcdc4] bg-[#EBE9E4] sticky top-0 z-20">
          <Link href="/" className="flex items-center gap-2 text-stone-700 hover:text-black transition-all mb-8 text-[10px] font-bold tracking-[0.2em] group uppercase font-sans">
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform text-black" /> 
            <span>Return to Garden</span>
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white rounded-xl border border-[#cfcdc4] shadow-sm">
               <Shield className="text-black" size={28} strokeWidth={2} />
            </div>
            <div>
                <span className="font-bold text-2xl block leading-none tracking-tight text-black font-sans">SENTINEL</span>
                <div className="flex items-center gap-2 mt-1.5 font-sans">
                   <span className="text-stone-700 text-[10px] font-bold tracking-widest uppercase">Protocol V2.0</span>
                   <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></div>
                </div>
            </div>
          </div>

          <div className="relative group">
             <Search size={14} className="absolute left-3 top-3.5 text-stone-500 group-hover:text-black transition-colors"/>
             <input 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search Modules..." 
               className="w-full bg-white border border-[#cfcdc4] text-black text-xs rounded-lg py-3 pl-9 pr-4 font-sans focus:outline-none focus:border-stone-500 transition-colors font-medium placeholder:text-stone-400" 
             />
             {searchQuery && (
               <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3.5 opacity-50 hover:opacity-100">
                 <X size={12}/>
               </button>
             )}
          </div>
        </div>
        
        <nav className="p-8 space-y-8 flex-1 overflow-y-auto">
          {filteredNav.length > 0 ? (
            filteredNav.map((section, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                   <section.icon size={14} className={section.color} />
                   <p className="text-[11px] font-bold text-stone-500 tracking-[0.2em] uppercase font-sans">{section.category}</p>
                </div>
                <ul className="space-y-1 ml-2 border-l-2 border-stone-300 pl-4 font-sans text-sm">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <button 
                          onClick={() => scrollToSection(item.id)} 
                          className={`block py-2 transition-all text-xs tracking-wide w-full text-left font-bold ${activeSection === item.id ? 'text-black border-l-2 border-black -ml-[18px] pl-2' : 'text-stone-600 hover:text-black'}`}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ))
          ) : (
            <div className="text-center text-stone-500 text-xs py-10 font-sans">
              No modules found.
            </div>
          )}
        </nav>

        <div className="p-6 border-t border-[#cfcdc4] bg-[#E5E0D6] text-[10px] font-sans text-stone-600">
           <div className="flex justify-between items-center mb-2">
              <span className="tracking-widest uppercase font-bold text-stone-500">Network</span>
              <span className="text-black font-bold">Sepolia (0xAA36)</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="tracking-widest uppercase font-bold text-stone-500">Status</span>
              <span className="text-emerald-800 font-bold flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></div> ONLINE</span>
           </div>
        </div>
      </aside>

      <main 
        ref={mainRef}
        className="flex-1 h-full overflow-y-auto scroll-smooth relative z-10 pt-[100px] md:pt-0"
      >
        <div className="max-w-5xl mx-auto p-6 md:p-12 md:pb-32">
          
          <section id="overview" className="mb-32 pt-10">
            <div className="flex items-center gap-4 mb-10">
                <div className="h-[2px] bg-black w-12"></div>
                <span className="text-black text-xs font-bold tracking-[0.3em] uppercase font-sans">Technical Manifesto</span>
                <div className="h-[2px] bg-black w-12"></div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif text-black mb-8 leading-[0.95] tracking-tight">
              SENTINEL <span className="italic text-stone-600">PROTOCOL</span>
            </h1>
            
            <div className="relative mb-16 p-8 md:p-12 bg-white border border-[#D6D3C0] rounded-3xl shadow-sm">
              <p className="text-lg md:text-xl text-black leading-relaxed font-medium mb-8 font-serif">
                The SENTINEL PROTOCOL is a state-of-the-art, modular governance operating system. Built on the robust foundations of Solidity, it delivers a deterministic, gas-optimized decision engine compliant with modern EIP standards.
              </p>
              
              <p className="text-base text-stone-800 leading-relaxed font-sans font-medium">
                By implementing a rigorous <strong>"Registry-Logic-Vault"</strong> tri-layer architecture, Sentinel enforces a Zero-Trust Kernel model. Assets remain secured within immutable Vaults, while governance logic can be evolved seamlessly via UUPS proxies.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-8 rounded-2xl border border-[#D6D3C0] hover:border-black transition-all group shadow-sm">
                  <Layers className="text-stone-800 mb-6 group-hover:scale-110 transition-transform" size={32} strokeWidth={2} />
                  <h3 className="text-lg font-bold mb-3 text-black font-serif">Modular Core</h3>
                  <p className="text-sm text-stone-700 leading-relaxed font-sans font-medium">Swap voting strategies like applications. Zero asset migration required.</p>
               </div>
               <div className="bg-white p-8 rounded-2xl border border-[#D6D3C0] hover:border-black transition-all group shadow-sm">
                  <Lock className="text-stone-800 mb-6 group-hover:scale-110 transition-transform" size={32} strokeWidth={2} />
                  <h3 className="text-lg font-bold mb-3 text-black font-serif">Timelock Matrix</h3>
                  <p className="text-sm text-stone-700 leading-relaxed font-sans font-medium">Cryptographically enforced 48-hour latency on all state mutations.</p>
               </div>
               <div className="bg-white p-8 rounded-2xl border border-[#D6D3C0] hover:border-black transition-all group shadow-sm">
                  <Zap className="text-stone-800 mb-6 group-hover:scale-110 transition-transform" size={32} strokeWidth={2} />
                  <h3 className="text-lg font-bold mb-3 text-black font-serif">Gasless Flow</h3>
                  <p className="text-sm text-stone-700 leading-relaxed font-sans font-medium">Native ERC-4337 Account Abstraction sponsors user voting fees.</p>
               </div>
            </div>
          </section>

          <section id="philosophy" className="mb-32 pt-20 border-t border-[#D6D3C0]">
             <div className="flex items-center gap-4 mb-16">
               <Anchor className="text-black" size={32} strokeWidth={2} />
               <h2 className="text-3xl md:text-4xl font-serif text-black font-bold">Design Philosophy</h2>
             </div>
             <div className="grid lg:grid-cols-2 gap-12">
               <div className="pl-8 border-l-4 border-emerald-700">
                  <h3 className="text-xl font-bold text-black mb-4 font-sans tracking-tight">01. Decentralization</h3>
                  <p className="text-stone-800 leading-relaxed font-medium">
                    No single admin has permanent control. Timelock + governance required for critical changes. The system is designed as a composable governance protocol.
                  </p>
               </div>
               <div className="pl-8 border-l-4 border-stone-400">
                  <h3 className="text-xl font-bold text-black mb-4 font-sans tracking-tight">02. Security First</h3>
                  <p className="text-stone-800 leading-relaxed font-medium">
                    Emergency pause system, Role-based access control (RBAC), Reentrancy guards, and Batch operations. Safety is baked into the bytecode.
                  </p>
               </div>
             </div>
          </section>

          <section id="architecture" className="mb-32 pt-20 border-t border-[#D6D3C0]">
             <div className="flex items-center gap-4 mb-16">
                <Network className="text-black" size={32} strokeWidth={2} />
                <h2 className="text-3xl md:text-4xl font-serif text-black font-bold">Architecture</h2>
             </div>

             <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-[#D6D3C0] shadow-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                   
                   <div className="p-6 bg-[#F5F2EB] border border-stone-300 rounded-2xl">
                      <div className="text-emerald-800 text-xs font-bold mb-4 uppercase tracking-widest font-sans">Governance Layer</div>
                      <ul className="space-y-3 text-sm font-mono text-stone-900 font-bold">
                         <li>├── HybridGovernor</li>
                         <li>├── VetoCouncil</li>
                         <li>├── ProposalGuard</li>
                         <li>└── Analytics</li>
                      </ul>
                   </div>

                   <div className="p-6 bg-[#F5F2EB] border border-stone-300 rounded-2xl">
                      <div className="text-black text-xs font-bold mb-4 uppercase tracking-widest font-sans">Security Layer</div>
                      <ul className="space-y-3 text-sm font-mono text-stone-900 font-bold">
                         <li>├── RoleManager</li>
                         <li>├── EmergencyPause</li>
                         <li>└── RageQuit</li>
                      </ul>
                   </div>

                   <div className="p-6 bg-[#F5F2EB] border border-stone-300 rounded-2xl">
                      <div className="text-amber-800 text-xs font-bold mb-4 uppercase tracking-widest font-sans">Treasury Layer</div>
                      <ul className="space-y-3 text-sm font-mono text-stone-900 font-bold">
                         <li>├── DAOTreasury</li>
                         <li>├── YieldStrategy</li>
                         <li>└── AssetVault</li>
                      </ul>
                   </div>

                   <div className="p-6 bg-[#F5F2EB] border border-stone-300 rounded-2xl">
                      <div className="text-stone-600 text-xs font-bold mb-4 uppercase tracking-widest font-sans">Core Layer</div>
                      <ul className="space-y-3 text-sm font-mono text-stone-900 font-bold">
                         <li>├── DAOCore</li>
                         <li>└── DAOTimelock</li>
                      </ul>
                   </div>

                   <div className="p-6 bg-[#F5F2EB] border border-stone-300 rounded-2xl">
                      <div className="text-black text-xs font-bold mb-4 uppercase tracking-widest font-sans">Execution Layer</div>
                      <ul className="space-y-3 text-sm font-mono text-stone-900 font-bold">
                         <li>├── UpgradeExec</li>
                         <li>└── DAOPayMaster</li>
                      </ul>
                   </div>

                </div>
             </div>
          </section>

          <section id="core-layer" className="mb-32 pt-20 border-t border-[#D6D3C0]">
             <div className="flex items-center gap-4 mb-16">
               <Database className="text-black" size={32} strokeWidth={2} />
               <h2 className="text-3xl md:text-4xl font-serif text-black font-bold">The Kernel Stack</h2>
             </div>
             
             <div className="space-y-16">
                <div id="core-registry" className="grid lg:grid-cols-2 gap-12 items-start">
                   <div className="space-y-6">
                      <h4 className="text-2xl font-bold text-black flex items-center gap-3 font-sans">
                         <span className="text-stone-500">01.</span> DAOCore.sol
                      </h4>
                      <p className="text-stone-800 leading-relaxed font-sans font-medium">
                        The central nervous system. In our Zero-Trust architecture, components do not trust each other implicitly. 
                        They must query registry to verify authorizations.
                      </p>
                      <div className="flex gap-3">
                         <span className="text-[10px] font-bold bg-white border border-[#D6D3C0] px-3 py-1 rounded text-black uppercase tracking-wider">Registry Module</span>
                         <span className="text-[10px] font-bold bg-white border border-[#D6D3C0] px-3 py-1 rounded text-black uppercase tracking-wider">RBAC Enabled</span>
                      </div>
                   </div>
                   <div className="bg-[#1c1917] p-8 rounded-2xl border border-stone-800 font-mono text-xs shadow-xl text-stone-300">
                      <div className="text-stone-500 mb-6 border-b border-stone-700 pb-2 uppercase tracking-widest flex justify-between">
                         <span>// IDAOCore.sol</span>
                         <span className="text-emerald-500">VERIFIED</span>
                      </div>
                      <div className="space-y-2">
                         <div className="text-stone-500">/** @dev Verification Logic */</div>
                         <div><span className="text-purple-400">function</span> <span className="text-yellow-200">isAuthorized</span>(bytes32 id, address caller)</div>
                         <div className="pl-4 text-stone-500">external view returns (bool) {'{'}</div>
                         <div className="pl-8">return <span className="text-emerald-400">_modules</span>[id] == caller;</div>
                         <div className="pl-4 text-stone-500">{'}'}</div>
                      </div>
                   </div>
                </div>

                <div id="timelock" className="bg-white p-10 rounded-3xl border border-[#D6D3C0] shadow-sm">
                   <div className="flex flex-col md:flex-row gap-8 items-center">
                      <div className="p-5 bg-[#F5F2EB] rounded-2xl border border-[#D6D3C0]">
                         <Activity size={32} className="text-black" strokeWidth={2} />
                      </div>
                      <div className="flex-1">
                         <h4 className="text-2xl font-bold mb-4 text-black font-serif">DAOTimelock.sol</h4>
                         <p className="text-stone-800 leading-relaxed mb-6 font-sans font-medium">
                           Speed is the enemy of security. This contract enforces a mandatory <strong>48-hour latency</strong> on all executions. It provides the Veto Council a deterministic window to nullify malicious payloads.
                         </p>
                         <div className="inline-block px-4 py-2 bg-stone-100 rounded border border-stone-300 text-black font-mono text-xs font-bold">
                           172,800 SEC DELAY
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </section>

          <section id="governance" className="mb-32 pt-20 border-t border-[#D6D3C0]">
             <div className="flex items-center gap-4 mb-16">
               <Cpu className="text-black" size={32} strokeWidth={2} />
               <h2 className="text-3xl md:text-4xl font-serif text-black font-bold">Governance Engine</h2>
             </div>

             <div className="bg-[#1c1917] p-10 md:p-14 rounded-[2.5rem] relative overflow-hidden mb-16 text-stone-300 shadow-2xl">
                <div className="grid lg:grid-cols-2 gap-16 relative z-10">
                   <div>
                      <h4 className="text-2xl font-bold text-white mb-6 font-serif">HybridGovernorDynamic.sol</h4>
                      <p className="text-stone-400 leading-relaxed font-sans font-light mb-8">
                        The Brain of the DAO. Combines OpenZeppelin Governor, Timelock control, Quorum fraction, Custom reputation system, and Veto council checks.
                      </p>
                      <ul className="space-y-4 font-mono text-xs text-stone-500">
                         <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500" /> Proposal cooldown logic</li>
                         <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500" /> Reputation-based filtering</li>
                         <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500" /> Strategy locking per proposal</li>
                      </ul>
                   </div>
                   <div className="bg-white/5 p-8 rounded-2xl border border-white/10 font-mono text-xs flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-6">
                         <span className="text-stone-500 uppercase tracking-widest">Token Standard</span>
                         <span className="text-white font-bold">DISO</span>
                      </div>
                      <div className="space-y-4 text-stone-300">
                         <div className="flex justify-between border-b border-white/5 pb-2"><span>Max Supply</span> <span>1,000,000,000</span></div>
                         <div className="flex justify-between border-b border-white/5 pb-2"><span>Initial Mint</span> <span>150,000,000</span></div>
                         <div className="flex justify-between border-b border-white/5 pb-2"><span>Type</span> <span>ERC20Votes + Permit</span></div>
                      </div>
                   </div>
                </div>
             </div>

             <div id="strategies" className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="p-8 bg-white border border-[#D6D3C0] rounded-2xl hover:border-black transition-all group">
                     <Calculator className="text-stone-800 mb-6" size={28} strokeWidth={2}/>
                     <h5 className="text-black font-bold mb-3 font-serif text-lg">Quadratic Funding</h5>
                     <p className="text-sm text-stone-800 leading-relaxed font-sans font-medium">
                       Weight = (sum of sqrt(contributions))^2. Prevents whales from dominating matching pools.
                     </p>
                 </div>
                 <div className="p-8 bg-white border border-[#D6D3C0] rounded-2xl hover:border-black transition-all group">
                     <Activity className="text-stone-800 mb-6" size={28} strokeWidth={2}/>
                     <h5 className="text-black font-bold mb-3 font-serif text-lg">Conviction Voting</h5>
                     <p className="text-sm text-stone-800 leading-relaxed font-sans font-medium">
                       Combines Token amount + Lock duration. Max lock = 4 years (4x multiplier).
                     </p>
                 </div>
                 <div className="p-8 bg-white border border-[#D6D3C0] rounded-2xl hover:border-black transition-all group">
                     <Network className="text-stone-800 mb-6" size={28} strokeWidth={2}/>
                     <h5 className="text-black font-bold mb-3 font-serif text-lg">Delegation (EIP-712)</h5>
                     <p className="text-sm text-stone-800 leading-relaxed font-sans font-medium">
                       Users can delegate voting power off-chain via signature. No on-chain transaction needed.
                     </p>
                 </div>
             </div>
          </section>

          <section id="security" className="mb-32 pt-20 border-t border-[#D6D3C0]">
             <div className="flex items-center gap-4 mb-16">
               <Shield className="text-black" size={32} strokeWidth={2} />
               <h2 className="text-3xl md:text-4xl font-serif text-black font-bold">Defense Matrix</h2>
             </div>

             <div className="grid lg:grid-cols-2 gap-12 mb-16">
                <div className="bg-white p-8 rounded-2xl border border-[#D6D3C0]">
                   <h4 className="text-xl font-bold text-black mb-4 flex items-center gap-2 font-serif">
                      <Key className="text-stone-500" size={20}/> Role-Based Access
                   </h4>
                   <ul className="space-y-4 text-xs font-mono text-stone-800 font-bold">
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div> ADMIN_ROLE (Timelock)</li>
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div> GUARDIAN_ROLE (Veto)</li>
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div> EXECUTOR_ROLE (Upgrade)</li>
                   </ul>
                </div>

                <div id="pause" className="bg-white p-8 rounded-2xl border border-[#D6D3C0]">
                   <h4 className="text-xl font-bold text-black mb-4 flex items-center gap-2 font-serif">
                      <LogOut className="text-stone-500" size={20}/> Emergency Pause
                   </h4>
                   <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-sm text-red-900 leading-relaxed font-sans font-bold">
                     Circuit breaker for DAO. Only Guardians can pause. Auto-resets after 7 days. Protects against exploits and malicious governance proposals.
                   </div>
                </div>
             </div>
          </section>

          <footer className="border-t border-[#D6D3C0] pt-20 pb-12 mt-32 relative overflow-hidden z-10">
            <div className="flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-white rounded border border-[#D6D3C0]">
                        <Shield size={20} className="text-black" />
                    </div>
                    <span className="font-bold tracking-[0.3em] text-xl text-black font-sans">SENTINEL</span>
                </div>
                
                <p className="text-stone-800 leading-relaxed max-w-lg text-sm mb-12 font-sans px-4 font-medium">
                    Architecting deterministic decision-making systems for institutional-grade decentralized organizations. Code is Law. Justice is Algorithmic.
                </p>

                <div className="border-t border-[#D6D3C0] pt-8 w-full flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-stone-600 font-sans tracking-widest px-4 uppercase font-bold">
                    <p>
                        &copy; 2026 SENTINEL_PROTOCOL. MIT_LICENSE
                    </p>
                    <p className="flex items-center gap-2">
                        ENGINEERED BY <a href="https://github.com/NexTechArchitect" target="_blank" className="text-black hover:text-emerald-800 transition-colors">NexTechArchitect</a>
                    </p>
                </div>
            </div>
          </footer>

        </div>
      </main>
    </div>
  );
}