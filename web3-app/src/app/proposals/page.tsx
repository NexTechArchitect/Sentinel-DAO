'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, RefreshCw, Activity, ShieldCheck, 
  Hourglass, Rocket, Search, ChevronRight, Loader2, 
  FileText, ThumbsUp, ThumbsDown, Lock, Megaphone, CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit'; 
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { decodeEventLog, parseEther, createPublicClient, http, formatEther } from 'viem';
import { sepolia } from 'viem/chains';
import { CONTRACT_ADDRESSES, GOVERNOR_ABI, GOV_TOKEN_ABI } from '@/config/constants';
import { SessionGuard } from '@/components/SessionGuard'; 

const DIRECT_RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';
const SPAM_THRESHOLD = 10000; 

const formatBlocksToTime = (blocks: number) => {
  if (blocks <= 0) return "Closed";
  const sec = blocks * 12; 
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  return d > 0 ? `${d}d ${h}h Left` : `${h}h Left`;
};

export default function ProposalsPage() {
  const { address, isConnected } = useAccount();
  
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'submit'>('dashboard');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [mounted, setMounted] = useState(false); 
  const [form, setForm] = useState({ title: '', target: '', amount: '', desc: '' });

  const { writeContract: writeProposal, data: txHash } = useWriteContract();
  const { writeContract: writeDelegate, isPending: isDelegating } = useWriteContract(); 
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const { data: votingPower } = useReadContract({
    address: CONTRACT_ADDRESSES.GOV_TOKEN as `0x${string}`, 
    abi: GOV_TOKEN_ABI, 
    functionName: 'getVotes', 
    args: address ? [address] : undefined,
  });

  const hasVotingPower = votingPower ? Number(formatEther(votingPower as bigint)) > 0 : false;

  const syncLedgerData = useCallback(async () => {
    try {
      setLoading(true);
      const client = createPublicClient({ chain: sepolia, transport: http(DIRECT_RPC_URL) });
      const currentBlock = Number(await client.getBlockNumber());
      
      const CHUNK_SIZE = 45000;
      const CHUNKS_TO_FETCH = 3; 
      let allLogs: any[] = [];

      for (let i = 0; i < CHUNKS_TO_FETCH; i++) {
        const toBlock = currentBlock - (i * CHUNK_SIZE);
        const fromBlock = toBlock - CHUNK_SIZE;
        if (toBlock <= 0) break;

        try {
          const logs = await client.request({
            method: 'eth_getLogs',
            params: [{
              address: CONTRACT_ADDRESSES.GOVERNOR,
              fromBlock: `0x${fromBlock.toString(16)}`, 
              toBlock: `0x${toBlock.toString(16)}`,
              topics: ["0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0"] 
            }]
          }) as any[];
          allLogs = [...allLogs, ...logs];
        } catch (err) { console.warn(`Chunk ${i} failed`, err); }
      }

      const formattedData = await Promise.all(allLogs.map(async (log: any) => {
        try {
          const decoded = decodeEventLog({ abi: GOVERNOR_ABI, data: log.data, topics: log.topics });
          const args: any = decoded.args;
          const state = await client.readContract({
            address: CONTRACT_ADDRESSES.GOVERNOR as `0x${string}`,
            abi: GOVERNOR_ABI, functionName: 'state', args: [args.proposalId]
          }) as number;

          const start = Number(args.voteStart || args.startBlock || 0);
          const end = Number(args.voteEnd || args.endBlock || 0);
          const current = Number(await client.getBlockNumber());
          
          let statusLabel = 'RESOLVED';
          if (state === 0) statusLabel = 'PENDING';
          else if (state === 1) statusLabel = 'ACTIVE'; 
          else if (state === 3) statusLabel = 'DEFEATED';
          else if (state === 7) statusLabel = 'EXECUTED';
          else if (state === 2) statusLabel = 'CANCELED';

          const descText = args.description || "";
          const parts = descText.split('\n');
          const title = parts[0] || "Untitled Proposal";
          const desc = parts.slice(1).join('\n') || "No details provided.";

          return {
            id: args.proposalId.toString(),
            title: title.length > 50 ? title.substring(0, 50) + "..." : title,
            desc: desc,
            status: statusLabel,
            blocksLeft: statusLabel === 'PENDING' ? start - current : end - current,
            proposer: args.proposer,
            rawId: args.proposalId 
          };
        } catch (e) { return null; }
      }));

      const cleanData = formattedData.filter(p => p !== null).sort((a:any, b:any) => Number(b.id) - Number(a.id));
      setProposals(cleanData);
    } catch (e) { console.error("Sync Failed:", e); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setMounted(true);
    syncLedgerData();
  }, [syncLedgerData]);

  useEffect(() => {
    if (isTxSuccess) {
      setView('dashboard');
      setForm({ title: '', target: '', amount: '', desc: '' });
      setTimeout(() => syncLedgerData(), 5000);
    }
  }, [isTxSuccess, syncLedgerData]);

  if (!mounted) return <div className="min-h-screen bg-[#050508] flex items-center justify-center text-indigo-500 font-bold">Loading...</div>;

  const filteredProposals = proposals.filter(p => {
    if (filter === 'ALL') return true;
    if (filter === 'RESOLVED') return p.status !== 'PENDING' && p.status !== 'ACTIVE';
    return p.status === filter;
  });

  return (
    <SessionGuard requireSession={false}>
      <div className="min-h-screen bg-[#050508] text-slate-200 font-sans selection:bg-indigo-500/30">
        <div className="fixed inset-0 pointer-events-none z-0 bg-[#050508]">
           <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-900/10 rounded-full blur-[120px]" />
        </div>

        <nav className="border-b border-white/5 bg-[#050508]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 text-sm font-bold text-slate-400 hover:text-white">
              <ShieldCheck size={20} className="text-indigo-500"/>
              <span className="tracking-widest">SENTINEL</span>
            </Link>
            <div className="flex items-center gap-4">
              {!hasVotingPower && isConnected && (
                <button 
                  onClick={() => writeDelegate({
                    address: CONTRACT_ADDRESSES.GOV_TOKEN as `0x${string}`,
                    abi: GOV_TOKEN_ABI,
                    functionName: 'delegate',
                    args: [address as `0x${string}`]
                  })}
                  disabled={isDelegating}
                  className="px-4 py-2 bg-amber-500/10 text-amber-500 text-xs font-bold uppercase rounded-lg border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center gap-2"
                >
                  {isDelegating ? <Loader2 className="animate-spin" size={14}/> : <Megaphone size={14}/>}
                  {isDelegating ? "Delegating..." : "Delegate"}
                </button>
              )}
              
              <button onClick={syncLedgerData} className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 border border-transparent">
                <RefreshCw size={18} className={loading ? "animate-spin text-indigo-500" : ""} />
              </button>
              <ConnectButton showBalance={false} accountStatus="avatar" />
            </div>
          </div>
        </nav>

        <main className="max-w-[1400px] mx-auto px-6 py-12 relative z-10">
          {view === 'dashboard' ? (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-6">
                <div>
                  <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">Governance</h1>
                  <p className="text-slate-500">Decentralized decision engine.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setView('submit')} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm uppercase tracking-wider transition-all">
                    Create Proposal
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-4 border-b border-white/5 no-scrollbar">
                {[{ id: 'ALL', label: 'All Entries' }, { id: 'PENDING', label: 'Pending' }, { id: 'ACTIVE', label: 'Active Votes' }, { id: 'RESOLVED', label: 'History' }].map((tab) => (
                  <button key={tab.id} onClick={() => setFilter(tab.id as any)} className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase border whitespace-nowrap transition-all ${filter === tab.id ? 'bg-white text-black' : 'border-transparent text-slate-500 hover:bg-white/5'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading && proposals.length === 0 ? (
                  <div className="col-span-full py-32 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-500 mb-6" size={40} />
                    <p className="text-xs font-bold text-slate-600 uppercase">Syncing Chain Data...</p>
                  </div>
                ) : filteredProposals.length > 0 ? (
                  filteredProposals.map((prop, idx) => (
                    <ProposalCard key={prop.id + idx} prop={prop} />
                  ))
                ) : (
                  <div className="col-span-full py-32 text-center border border-dashed border-white/10 rounded-3xl">
                    <p className="text-sm font-bold text-slate-500 uppercase">No Records Found</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto pt-10">
              <button onClick={() => setView('dashboard')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">
                <ArrowLeft size={16}/> Back to Feed
              </button>
              <div className="bg-[#0A0A0C] border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-8">New Proposal</h2>
                <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">Title</label>
                      <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-indigo-500/50 transition-all" placeholder="Enter title" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Target Address</label>
                        <input value={form.target} onChange={e => setForm({...form, target: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-indigo-400 font-mono text-sm outline-none focus:border-indigo-500/50 transition-all" placeholder="0x..." />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">ETH Value</label>
                        <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-indigo-500/50 transition-all" placeholder="0.00" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">Description</label>
                      <textarea value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-slate-300 outline-none focus:border-indigo-500/50 transition-all resize-none" placeholder="Explain your proposal..." />
                    </div>
                    <button 
                      onClick={() => writeProposal({
                        address: CONTRACT_ADDRESSES.GOVERNOR as `0x${string}`, abi: GOVERNOR_ABI,
                        functionName: 'propose',
                        args: [[form.target as `0x${string}`], [parseEther(form.amount || '0')], ["0x"], `${form.title}\n\n${form.desc}`]
                      })}
                      disabled={isTxLoading || !form.title}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-widest transition-all flex justify-center items-center gap-2"
                    >
                      {isTxLoading ? <Loader2 className="animate-spin" /> : <Rocket size={18}/>}
                      {isTxLoading ? "Processing..." : "Submit Proposal"}
                    </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </SessionGuard>
  );
}

function VoteProgress({ proposalId }: { proposalId: string }) {
  const { data: votes } = useReadContract({
    address: CONTRACT_ADDRESSES.GOVERNOR as `0x${string}`,
    abi: GOVERNOR_ABI,
    functionName: 'proposalVotes',
    args: [BigInt(proposalId)],
    query: { refetchInterval: 5000 }
  });

  if (!votes) return <div className="h-1.5 w-full bg-white/5 rounded-full mt-4 animate-pulse" />;

  // @ts-ignore
  const against = votes[0] ? Number(formatEther(votes[0])) : 0;
  // @ts-ignore
  const forVote = votes[1] ? Number(formatEther(votes[1])) : 0;
  
  const total = against + forVote;
  const forPercent = total > 0 ? (forVote / total) * 100 : 0;
  const againstPercent = total > 0 ? (against / total) * 100 : 0;

  return (
    <div className="mt-6 space-y-2">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
        <span className="text-emerald-400">For: {forVote.toFixed(2)}</span>
        <span className="text-red-400">Against: {against.toFixed(2)}</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
        <div style={{ width: `${forPercent}%` }} className="h-full bg-emerald-500 transition-all duration-500" />
        <div style={{ width: `${againstPercent}%` }} className="h-full bg-red-500 transition-all duration-500" />
      </div>
    </div>
  );
}

function ProposalCard({ prop }: { prop: any }) {
  const { address } = useAccount();
  const isPending = prop.status === 'PENDING';
  const isActive = prop.status === 'ACTIVE';
  
  const { writeContract, isPending: isVoting } = useWriteContract();

  const { data: hasVoted } = useReadContract({
    address: CONTRACT_ADDRESSES.GOVERNOR as `0x${string}`,
    abi: GOVERNOR_ABI,
    functionName: 'hasVoted',
    args: [BigInt(prop.rawId), address as `0x${string}`],
    query: { enabled: !!address }
  });

  const handleVote = (support: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.GOVERNOR as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: 'castVote',
      args: [BigInt(prop.rawId), support]
    });
  };

  return (
    <div className="bg-[#0A0A0C] border border-white/5 rounded-[2rem] p-8 hover:border-indigo-500/30 transition-all flex flex-col justify-between min-h-[380px] shadow-lg group">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${
            isPending ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' : 
            isActive ? 'bg-blue-500/5 border-blue-500/20 text-blue-500' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-amber-500' : isActive ? 'bg-blue-500' : 'bg-emerald-500'}`}/>
            {prop.status}
          </div>
          <span className="font-mono text-[10px] text-slate-500 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">#{prop.id.slice(0,4)}</span>
        </div>
        
        <h3 className="text-xl font-bold text-slate-100 mb-3 leading-tight line-clamp-2 group-hover:text-indigo-400 transition-colors">
          {prop.title}
        </h3>
        <p className="text-slate-500 text-xs leading-relaxed line-clamp-3 font-medium">
          {prop.desc}
        </p>
      </div>

      <div>
        <VoteProgress proposalId={prop.rawId} />

        <div className="pt-4 mt-4 border-t border-white/5 flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isPending ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
            {isPending ? <Hourglass size={14}/> : <Activity size={14}/>}
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{isPending ? 'Starts In' : 'Status'}</p>
            <p className="text-xs font-bold text-white font-mono">{formatBlocksToTime(prop.blocksLeft)}</p>
          </div>
        </div>

        {isActive ? (
          hasVoted ? (
            <div className="mt-4 w-full py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <CheckCircle2 size={14}/> You Voted
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-4">
               <button 
                 onClick={() => handleVote(1)} 
                 disabled={isVoting}
                 className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all font-bold text-[10px] uppercase hover:scale-[1.02] active:scale-[0.98]"
               >
                 {isVoting ? <Loader2 className="animate-spin" size={12}/> : <ThumbsUp size={12}/>} For
               </button>
               <button 
                 onClick={() => handleVote(0)} 
                 disabled={isVoting}
                 className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all font-bold text-[10px] uppercase hover:scale-[1.02] active:scale-[0.98]"
               >
                  {isVoting ? <Loader2 className="animate-spin" size={12}/> : <ThumbsDown size={12}/>} Against
               </button>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}