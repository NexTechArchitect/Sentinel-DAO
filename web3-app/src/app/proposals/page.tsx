'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowLeft, RefreshCw, Activity, CheckCircle2, XCircle, 
  Hourglass, Clock, Zap, Shield, Search, ChevronRight, Loader2, Archive,
  Rocket, AlertTriangle, FileText, LayoutGrid, Timer, ShieldCheck, 
  Lock, History, BarChart3, Wallet
} from 'lucide-react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit'; 
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { decodeEventLog, parseEther, createPublicClient, http, formatEther } from 'viem';
import { sepolia } from 'viem/chains';
import { motion, AnimatePresence } from 'framer-motion'; 
import { CONTRACT_ADDRESSES, GOVERNOR_ABI, GOV_TOKEN_ABI } from '@/config/constants';
import { SessionGuard } from '@/components/SessionGuard'; 

const DIRECT_RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';
const SPAM_THRESHOLD = 10000; 

const formatDuration = (seconds: number) => {
  if (seconds <= 0) return "Ready to Propose";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
};

const formatBlocksToTime = (blocks: number) => {
  if (blocks <= 0) return "Voting Closed";
  const sec = blocks * 12;
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  return d > 0 ? `${d} Days ${h} Hrs Left` : `${h} Hours ${Math.floor((sec % 3600) / 60)} Mins Left`;
};

export default function SentinelGovernanceInstitute() {
  const { address, isConnected } = useAccount();
  
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'submit'>('dashboard');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const [cooldownTimer, setCooldownTimer] = useState("Checking System...");
  const [isCooldownActive, setIsCooldownActive] = useState(true);
  const [userTier, setUserTier] = useState<'STANDARD' | 'ELITE'>('STANDARD');

  const [form, setForm] = useState({ title: '', target: '', amount: '', desc: '' });

  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const { data: lastProposalTime } = useReadContract({
    address: CONTRACT_ADDRESSES.GOVERNOR as `0x${string}`, 
    abi: GOVERNOR_ABI, 
    functionName: 'lastProposalTime', 
    args: address ? [address] : undefined,
  });

  const { data: votingPower } = useReadContract({
    address: CONTRACT_ADDRESSES.GOV_TOKEN as `0x${string}`, 
    abi: GOV_TOKEN_ABI, 
    functionName: 'getVotes', 
    args: address ? [address] : undefined,
  });

  const syncLedgerData = useCallback(async () => {
    try {
      setLoading(true);
      const client = createPublicClient({ chain: sepolia, transport: http(DIRECT_RPC_URL) });
      const currentBlock = Number(await client.getBlockNumber());
      
      const logs = await client.request({
        method: 'eth_getLogs',
        params: [{
          address: CONTRACT_ADDRESSES.GOVERNOR,
          fromBlock: `0x${(currentBlock - 8000).toString(16)}`, 
          toBlock: 'latest',
          topics: ["0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0"] 
        }]
      }) as any[];

      const formattedData = await Promise.all(logs.map(async (log: any) => {
        try {
          const decoded = decodeEventLog({ abi: GOVERNOR_ABI, data: log.data, topics: log.topics });
          const args: any = decoded.args;
          
          const state = await client.readContract({
            address: CONTRACT_ADDRESSES.GOVERNOR as `0x${string}`,
            abi: GOVERNOR_ABI, functionName: 'state', args: [args.proposalId]
          }) as number;

          const start = Number(args.voteStart || args.startBlock || 0);
          const end = Number(args.voteEnd || args.endBlock || 0);
          
          let statusLabel = 'RESOLVED';
          if (state === 0) statusLabel = 'PENDING';
          else if (state === 1) statusLabel = 'ACTIVE';
          else if (state === 3) statusLabel = 'DEFEATED';
          else if (state === 7) statusLabel = 'EXECUTED';

          const descText = args.description || "";
          const title = descText.split('\n\n')[0] || "Untitled Proposal";
          const desc = descText.split('\n\n').slice(1).join('\n\n') || "No detailed description provided.";

          return {
            id: args.proposalId.toString(),
            title: title.length > 60 ? title.substring(0, 60) + "..." : title,
            desc: desc,
            status: statusLabel,
            blocksLeft: statusLabel === 'PENDING' ? start - currentBlock : end - currentBlock,
            proposer: args.proposer
          };
        } catch (e) { return null; }
      }));

      setProposals(formattedData.filter(p => p !== null).reverse());
    } catch (e) { console.error("Ledger Sync Failed", e); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!isConnected || lastProposalTime === undefined || votingPower === undefined) {
      setCooldownTimer("Connect Wallet");
      setIsCooldownActive(true);
      return;
    }

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const lastTime = Number(lastProposalTime);
      const votes = parseFloat(formatEther(votingPower as bigint));
      
      const isElite = votes >= SPAM_THRESHOLD;
      setUserTier(isElite ? 'ELITE' : 'STANDARD');

      const requiredCooldown = isElite ? 3600 : 86400; 
      const nextUnlockTime = lastTime + requiredCooldown;
      const remainingSeconds = nextUnlockTime - now;

      if (remainingSeconds <= 0) {
        setCooldownTimer("SYSTEM READY");
        setIsCooldownActive(false);
      } else {
        setCooldownTimer(formatDuration(remainingSeconds));
        setIsCooldownActive(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastProposalTime, votingPower, isConnected]);

  
  useEffect(() => {
    syncLedgerData();
    const handleMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [syncLedgerData]);

  useEffect(() => {
    if (isTxSuccess) {
      setView('dashboard');
      setForm({ title: '', target: '', amount: '', desc: '' });
      syncLedgerData();
    }
  }, [isTxSuccess, syncLedgerData]);

  const filteredProposals = proposals.filter(p => filter === 'ALL' || p.status === filter);

  return (
    <SessionGuard requireSession={true}>
      <div className="min-h-screen bg-[#050508] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
        
        
        <div className="fixed inset-0 pointer-events-none z-0">
          <div 
            className="absolute w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px] transition-transform duration-75 ease-out will-change-transform"
            style={{ left: mousePos.x - 300, top: mousePos.y - 300 }}
          />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
        </div>

        {/* NAVIGATION */}
        <nav className="border-b border-white/5 bg-[#050508]/80 backdrop-blur-2xl sticky top-0 z-50 transition-all duration-300">
          <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
            <Link href="/dashboard" className="group flex items-center gap-3 text-sm font-bold text-slate-400 hover:text-white transition-colors">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:border-indigo-500/50 transition-all">
                <ArrowLeft size={18} />
              </div>
              <span className="tracking-widest">DASHBOARD</span>
            </Link>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                <ShieldCheck size={14} className="text-emerald-400"/>
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Sentinel Institute v2</span>
              </div>
              <button onClick={syncLedgerData} className="p-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-400 border border-transparent hover:border-white/10">
                <RefreshCw size={18} className={loading ? "animate-spin text-indigo-500" : ""} />
              </button>
              <ConnectButton showBalance={false} accountStatus="avatar" />
            </div>
          </div>
        </nav>

        <main className="max-w-[1400px] mx-auto px-6 py-12 relative z-10">
          
          {/* HEADER SECTION */}
          <header className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  Sepolia Network
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">v2.4.0 Live</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-4">
                Governance <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Portal</span>
              </h1>
              <p className="text-slate-400 max-w-xl text-lg leading-relaxed">
                Decentralized decision engine. Submit proposals, vote on upgrades, and track network consensus in real-time.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
              <button onClick={() => setView('dashboard')} className={`px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${view === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}>
                Live Feed
              </button>
              <button onClick={() => setView('submit')} className={`px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${view === 'submit' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}>
                Create Proposal
              </button>
            </motion.div>
          </header>

          <AnimatePresence mode="wait">
            {view === 'dashboard' ? (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-10">
                
                {/* STATUS FILTERS */}
                <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar border-b border-white/5">
                  {[
                    { id: 'ALL', label: 'All Entries' },
                    { id: 'PENDING', label: 'Pending Verification' },
                    { id: 'ACTIVE', label: 'Live Consensus' },
                    { id: 'RESOLVED', label: 'Executed Archive' }
                  ].map((tab) => (
                    <button 
                      key={tab.id} 
                      onClick={() => setFilter(tab.id as any)}
                      className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all whitespace-nowrap ${filter === tab.id ? 'bg-white text-black border-white' : 'bg-transparent text-slate-500 border-transparent hover:bg-white/5'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading && proposals.length === 0 ? (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center">
                      <Loader2 className="animate-spin text-indigo-500 mb-6" size={40} />
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-widest animate-pulse">Syncing Chain Data...</p>
                    </div>
                  ) : filteredProposals.length > 0 ? (
                    filteredProposals.map((prop, idx) => (
                      <ProposalCard key={prop.id} prop={prop} idx={idx} />
                    ))
                  ) : (
                    <div className="col-span-full py-32 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="text-slate-600" size={24}/>
                      </div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No Records Found</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="submit" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto pb-20">
                <div className="bg-[#0A0A0C] border border-white/10 p-10 md:p-14 rounded-[3rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5"><FileText size={200}/></div>
                  
                  <div className="relative z-10 space-y-10">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">Submit Directive</h2>
                      <p className="text-slate-500">Proposals must be technically verifiable. Cooldown applies.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Proposal Title</label>
                        <input 
                          value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white focus:border-indigo-500/50 outline-none transition-all font-bold text-lg placeholder:text-slate-700"
                          placeholder="e.g. TREASURY ALLOCATION V2"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Target (0x)</label>
                          <input 
                            value={form.target} onChange={e => setForm({...form, target: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-indigo-400 font-mono text-sm focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700"
                            placeholder="0x..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Value (ETH)</label>
                          <input 
                            type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700 font-bold"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Rationale</label>
                        <textarea 
                          value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} rows={5}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-slate-300 focus:border-indigo-500/50 outline-none transition-all resize-none placeholder:text-slate-700"
                          placeholder="Technical justification..."
                        />
                      </div>
                    </div>

                    {/* INTELLIGENT COOLDOWN PANEL */}
                    <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${isCooldownActive ? 'bg-red-500/5 border-red-500/10' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                       <div className="flex items-center gap-5 w-full">
                          <div className={`p-3 rounded-xl flex-shrink-0 ${isCooldownActive ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                             {isCooldownActive ? <Lock size={24}/> : <CheckCircle2 size={24}/>}
                          </div>
                          <div>
                             <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isCooldownActive ? 'text-red-400' : 'text-emerald-400'}`}>
                               {isCooldownActive ? 'Cooldown Active' : 'System Ready'}
                             </p>
                             <p className="text-2xl font-mono font-black text-white tracking-tight">{cooldownTimer}</p>
                          </div>
                       </div>
                       
                       <div className="w-full md:w-auto flex-shrink-0 bg-white/5 rounded-xl p-4 border border-white/5 min-w-[180px]">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">User Tier</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${userTier === 'ELITE' ? 'text-purple-400 border-purple-400/20 bg-purple-400/10' : 'text-slate-400 border-slate-600 bg-slate-800'}`}>
                              {userTier}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Req Wait</span>
                            <span className="text-xs text-white font-mono font-bold">
                              {userTier === 'ELITE' ? '1 Hour' : '24 Hours'}
                            </span>
                          </div>
                       </div>
                    </div>

                    <button 
                      onClick={() => writeContract({
                        address: CONTRACT_ADDRESSES.GOVERNOR as `0x${string}`, abi: GOVERNOR_ABI,
                        functionName: 'propose',
                        args: [[form.target as `0x${string}`], [parseEther(form.amount || '0')], ["0x"], `${form.title}\n\n${form.desc}`]
                      })}
                      disabled={isTxLoading || isCooldownActive || !form.title || !form.target}
                      className={`w-full font-bold py-5 rounded-2xl uppercase tracking-[0.15em] shadow-xl transition-all flex justify-center items-center gap-3 ${isCooldownActive ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:shadow-indigo-500/25 text-white transform active:scale-[0.99]'}`}
                    >
                      {isTxLoading ? <Loader2 className="animate-spin" /> : isCooldownActive ? <Lock size={18}/> : <Rocket size={20} />}
                      {isTxLoading ? "Broadcasting..." : isCooldownActive ? "Locked" : "Broadcast Proposal"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </SessionGuard>
  );
}

function ProposalCard({ prop, idx }: { prop: any, idx: number }) {
  const isPending = prop.status === 'PENDING';
  const isActive = prop.status === 'ACTIVE';
  const isResolved = prop.status === 'RESOLVED' || prop.status === 'EXECUTED';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
      className="bg-[#0A0A0C] border border-white/5 rounded-[2rem] p-8 hover:border-indigo-500/30 transition-all group relative overflow-hidden flex flex-col justify-between h-[340px] shadow-lg hover:shadow-2xl hover:shadow-indigo-900/10"
    >
      <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-300">
        <ChevronRight className="text-indigo-500/20" size={80} />
      </div>

      <div>
        <div className="flex justify-between items-center mb-6">
          <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${
            isPending ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' : 
            isActive ? 'bg-blue-500/5 border-blue-500/20 text-blue-500' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-amber-500' : isActive ? 'bg-blue-500' : 'bg-emerald-500'} animate-pulse`}/>
            {prop.status}
          </div>
          <span className="font-mono text-[10px] text-slate-500 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">ID: {prop.id.slice(0,6)}</span>
        </div>
        
        <h3 className="text-2xl font-bold text-slate-100 mb-4 leading-tight group-hover:text-indigo-400 transition-colors line-clamp-2">
          {prop.title}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 font-medium">
          {prop.desc}
        </p>
      </div>

      <div className="pt-6 border-t border-white/5 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isPending ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
            {isPending ? <Hourglass size={16}/> : <Activity size={16}/>}
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{isPending ? 'Starts In' : 'Status'}</p>
            <p className="text-sm font-bold text-white font-mono">{formatBlocksToTime(prop.blocksLeft)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}