'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Shield, ArrowLeft, Loader2, Zap, Activity, 
  CheckCircle, AlertCircle, Cpu, Gavel, X, AlertTriangle, ExternalLink, ChevronRight,
  ThumbsUp, ThumbsDown
} from 'lucide-react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit'; 
import { 
  useAccount, 
  useReadContract, 
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain, 
} from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { CONTRACT_ADDRESSES, GOV_TOKEN_ABI, GOVERNOR_ABI } from '@/config/constants';
import { SessionGuard } from '@/components/SessionGuard'; 
import { useProposals } from '@/hooks/useProposals'; 

type ToastState = { 
  type: 'SUCCESS' | 'ERROR'; 
  message: string; 
  subMessage?: string; 
  hash?: string;
} | null;

export default function Proposals() {
  const { isConnected, address } = useAccount();
  const { switchChain } = useSwitchChain(); 
  const { proposals, isLoading: isLoadingFeed } = useProposals(); 
  
  // --- UI & THEME STATES ---
  const mainRef = useRef<HTMLDivElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement>(null); 
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'feed' | 'create'>('feed');
  const [toast, setToast] = useState<ToastState>(null);
  const [isMounted, setIsMounted] = useState(false);

  // --- SPECIFIC ACTION TRACKING ---
  const [activeAction, setActiveAction] = useState<'DELEGATE' | 'PROPOSE' | 'VOTE' | null>(null);
  const [votingOnId, setVotingOnId] = useState<string | null>(null);

  // --- FORM STATES (CREATE PROPOSAL) ---
  const [propTitle, setPropTitle] = useState('');
  const [propDesc, setPropDesc] = useState('');
  const [targetAddress, setTargetAddress] = useState('');
  const [ethAmount, setEthAmount] = useState('');

  // =====================================================
  // EFFECTS — CURSOR MOVEMENT & SCROLL (OPTIMIZED)
  // =====================================================
  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return;
    const handleMouseMove = (e: MouseEvent) => {
      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate(${e.clientX - 250}px, ${e.clientY - 250}px)`;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!mainRef.current) return;
      const totalHeight = mainRef.current.scrollHeight - mainRef.current.clientHeight;
      const scrolled = (mainRef.current.scrollTop / totalHeight) * 100;
      setProgress(scrolled);
    };
    mainRef.current?.addEventListener("scroll", handleScroll);
    return () => mainRef.current?.removeEventListener("scroll", handleScroll);
  }, []);

  // =====================================================
  // CONTRACT READS (REAL DATA ONLY)
  // =====================================================
  const pollConfig = { refetchInterval: 15000, enabled: !!address };

  // 1. Get User's DISO Token Balance
  const { data: disoBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.GOV_TOKEN as `0x${string}`,
    abi: GOV_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    ...pollConfig
  });

  // 2. Get User's Actual Voting Power
  const { data: votingPower, refetch: refetchPower } = useReadContract({
    address: CONTRACT_ADDRESSES.GOV_TOKEN as `0x${string}`,
    abi: GOV_TOKEN_ABI,
    functionName: 'getVotes',
    args: address ? [address] : undefined,
    ...pollConfig
  });

  // 3. Check if user has Delegated
  const { data: delegatee, refetch: refetchDelegatee } = useReadContract({
    address: CONTRACT_ADDRESSES.GOV_TOKEN as `0x${string}`,
    abi: GOV_TOKEN_ABI,
    functionName: 'delegates',
    args: address ? [address] : undefined,
    ...pollConfig
  });

  const formattedBalance = disoBalance ? parseFloat(formatEther(disoBalance as bigint)).toFixed(2) : '0.00';
  const formattedPower = votingPower ? parseFloat(formatEther(votingPower as bigint)).toFixed(2) : '0.00';
  const isDelegated = delegatee && delegatee !== '0x0000000000000000000000000000000000000000';
  
  const needsDelegation = parseFloat(formattedBalance) > 0 && parseFloat(formattedPower) === 0;

  // =====================================================
  // CONTRACT WRITES & EVENT HANDLING
  // =====================================================
  const { writeContract, data: txHash, error: txError, reset: resetTx } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  // Handle transaction dispatch
  useEffect(() => {
    if (txHash) {
      setToast({ type: 'SUCCESS', message: 'Transaction Sent', subMessage: 'Awaiting network confirmation...', hash: txHash });
    }
  }, [txHash]);

  // Handle explicit success actions
  useEffect(() => {
    if (isConfirmed) {
      if (activeAction === 'DELEGATE') {
        setToast({ type: 'SUCCESS', message: 'Voting Power Activated', subMessage: 'Your tokens are now registered for voting.', hash: txHash });
      } else if (activeAction === 'PROPOSE') {
        setToast({ type: 'SUCCESS', message: 'Proposal Deployed', subMessage: 'Your governance proposal is live on-chain.', hash: txHash });
        setPropTitle(''); setPropDesc(''); setTargetAddress(''); setEthAmount('');
        setActiveTab('feed');
      } else if (activeAction === 'VOTE') {
        setToast({ type: 'SUCCESS', message: 'Vote Cast Successfully', subMessage: 'Your cryptographic signature has been recorded on-chain.', hash: txHash });
        setVotingOnId(null);
      } else {
        setToast({ type: 'SUCCESS', message: 'Action Confirmed', subMessage: 'Blockchain state updated successfully.', hash: txHash });
      }
      
      setActiveAction(null);
      resetTx();

      setTimeout(() => {
        refetchBalance(); refetchPower(); refetchDelegatee();
      }, 3500);
    }
  }, [isConfirmed]);

  // Handle explicit error actions
  useEffect(() => {
    if (txError) {
      setToast({ type: 'ERROR', message: 'Transaction Failed', subMessage: (txError as any)?.shortMessage || "User rejected or network error occurred." });
      setActiveAction(null);
      setVotingOnId(null);
      resetTx();
    }
  }, [txError]);

  // --- ACTIONS ---
  const handleDelegate = () => {
    if (!address) return;
    setActiveAction('DELEGATE');
    writeContract({
      address: CONTRACT_ADDRESSES.GOV_TOKEN as `0x${string}`,
      abi: GOV_TOKEN_ABI,
      functionName: 'delegate',
      args: [address], 
    });
  };

  const handlePropose = () => {
    if (!propTitle || !propDesc || !targetAddress || !ethAmount) {
        setToast({ type: 'ERROR', message: 'Validation Error', subMessage: 'Please fill all fields to deploy a proposal.' });
        return;
    }
    
    let parsedAmount;
    try {
      parsedAmount = parseEther(ethAmount);
    } catch (e) {
      setToast({ type: 'ERROR', message: 'Invalid Amount', subMessage: 'Please enter a valid ETH amount.' });
      return;
    }
    
    setActiveAction('PROPOSE');
    writeContract({
      address: CONTRACT_ADDRESSES.GOVERNOR as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: 'propose',
      args: [
          [targetAddress as `0x${string}`], 
          [parsedAmount],                   
          ["0x"],                           
          `${propTitle}\n\n${propDesc}`     
      ],
    });
  };

  const handleVote = (proposalId: string, support: number) => {
    if (!proposalId) return;
    setActiveAction('VOTE');
    setVotingOnId(proposalId);
    writeContract({
      address: CONTRACT_ADDRESSES.GOVERNOR as `0x${string}`,
      abi: GOVERNOR_ABI,
      functionName: 'castVote',
      args: [BigInt(proposalId), support], 
    });
  };

  if (!isMounted) return null;

  return (
    <SessionGuard requireSession={true}>
      <div className="h-screen w-full bg-[#05050a] text-slate-200 font-sans selection:bg-purple-500/30 flex flex-col overflow-hidden relative">
        
        {/* Background Lighting */}
        <div className="fixed inset-0 z-0 bg-[#05050a] pointer-events-none"></div>
        <div className="fixed top-[-10%] right-[-5%] w-[300px] md:w-[700px] h-[300px] md:h-[700px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="fixed bottom-[-10%] left-[-5%] w-[300px] md:w-[700px] h-[300px] md:h-[700px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none"></div>

        <div
          ref={spotlightRef}
          className="fixed z-[60] pointer-events-none w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full blur-[180px] bg-purple-500/10 transition-opacity duration-150 mix-blend-screen hidden md:block"
        />

        <div className="fixed top-0 right-0 w-1 md:w-[2px] h-full bg-white/5 z-[100]">
          <div className="bg-gradient-to-b from-blue-400 via-purple-500 to-blue-400 w-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(168,85,247,0.5)]" 
                style={{ height: `${progress}%` }} />
        </div>

        {/* Navbar */}
        <nav className="border-b border-white/[0.05] bg-[#05050a]/90 backdrop-blur-xl z-50 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 w-full flex items-center justify-between">
            <div className="flex items-center gap-4 md:gap-6">
              <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm font-medium">
                <ArrowLeft size={20} /> <span className="hidden sm:inline">Back</span>
              </Link>
              <div className="h-8 w-px bg-white/10 hidden md:block"></div>
              <div className="flex items-center gap-2 md:gap-3">
                 <Cpu className="text-purple-400" size={24} />
                 <span className="font-black text-white text-lg md:text-xl tracking-tight uppercase">Governance Portal</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <ConnectButton.Custom>
                  {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
                    const connected = mounted && account && chain;
                    const wrongNetwork = connected && chain.id !== 11155111;
                    return (
                      <button 
                        onClick={wrongNetwork ? () => switchChain({ chainId: 11155111 }) : connected ? openAccountModal : openConnectModal}
                        className={`px-4 md:px-6 py-2.5 rounded-xl font-bold text-[10px] md:text-xs uppercase transition-all flex items-center gap-2 md:gap-3 border shadow-2xl ${
                            wrongNetwork ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20' :
                            connected ? 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10' : 
                            'bg-purple-600/10 text-purple-400 border-purple-500/30 hover:bg-purple-600/20'
                        }`}
                      >
                        {connected ? (
                            wrongNetwork ? (
                              <>
                                 <AlertTriangle size={14} className="md:hidden" />
                                 <span className="hidden md:inline">Wrong Network</span>
                              </>
                            ) : account.displayName
                        ) : (
                            <>
                               <span className="hidden sm:inline">Connect Wallet</span>
                               <span className="sm:hidden">Connect</span>
                            </>
                        )}
                      </button>
                    );
                  }}
                </ConnectButton.Custom>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main ref={mainRef} className="flex-1 overflow-y-auto custom-scroll relative pb-32 p-4 md:p-12 z-10">
          <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
            
            {/* Header Action Section */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse"></div>
                  <span className="text-slate-400 text-sm font-medium uppercase tracking-wide">System Operational</span>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                 <div className="max-w-2xl">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-4">
                      Decision Engine
                    </h1>
                    <p className="text-slate-400 text-base md:text-lg leading-relaxed">
                      Shape the protocol's future. Propose system upgrades, allocate treasury funds, and participate in gasless consensus.
                    </p>
                 </div>
                 <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0 p-1 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
                    <button onClick={() => setActiveTab('feed')} className={`flex-1 md:flex-none px-8 py-3 font-bold text-sm md:text-base rounded-xl transition-all ${activeTab === 'feed' ? 'bg-slate-200 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                      Live Feed
                    </button>
                    <button onClick={() => setActiveTab('create')} className={`flex-1 md:flex-none px-8 py-3 font-bold text-sm md:text-base rounded-xl transition-all ${activeTab === 'create' ? 'bg-slate-200 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                      New Proposal
                    </button>
                 </div>
              </div>
            </div>

            {/* User Power Grid (Delegation logic) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-slate-900/30 p-8 border border-white/5 rounded-[2rem] relative overflow-hidden shadow-xl hover:border-purple-500/20 transition-all">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-3">My Voting Power</p>
                  <div className="flex items-baseline gap-2 mb-2">
                     <h2 className="text-4xl md:text-5xl font-black text-white">{formattedPower}</h2>
                     <span className="text-sm md:text-base text-purple-400 font-bold">DISO</span>
                  </div>
                  {needsDelegation && (
                      <button 
                          onClick={handleDelegate}
                          disabled={activeAction === 'DELEGATE' || isConfirming}
                          className="mt-6 w-full py-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs md:text-sm font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                      >
                          {activeAction === 'DELEGATE' || isConfirming ? <Loader2 size={18} className="animate-spin"/> : <Zap size={18}/>}
                          {activeAction === 'DELEGATE' || isConfirming ? 'Processing...' : 'Activate Votes'}
                      </button>
                  )}
                  {!needsDelegation && isConnected && (
                      <div className="mt-6 inline-flex items-center gap-2 bg-green-500/10 text-green-400 text-xs md:text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-lg border border-green-500/20">
                         <CheckCircle size={16}/> Votes Activated
                      </div>
                  )}
               </div>

               <div className="bg-slate-900/30 p-8 border border-white/5 rounded-[2rem] relative overflow-hidden shadow-xl hover:border-blue-500/20 transition-all">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50"></div>
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-3">Token Balance</p>
                  <div className="flex items-baseline gap-2">
                     <h2 className="text-4xl md:text-5xl font-black text-white">{formattedBalance}</h2>
                     <span className="text-sm md:text-base text-slate-500 font-bold">DISO</span>
                  </div>
               </div>

               <div className="bg-slate-900/30 p-8 border border-white/5 rounded-[2rem] relative overflow-hidden shadow-xl">
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-3">Network Quorum</p>
                  <h2 className="text-4xl md:text-5xl font-black text-white">15.00%</h2>
                  <p className="text-xs md:text-sm text-slate-500 mt-4">Minimum votes required to pass a proposal.</p>
               </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="mt-8">
               
               {/* ===================== ACTIVE FEED TAB (NO FAKE DATA) ===================== */}
               {activeTab === 'feed' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-4">
                         <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <Activity size={24} className="text-purple-400"/> Consensus Feed
                         </h3>
                     </div>

                     {isLoadingFeed ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
                          <p className="font-bold uppercase tracking-widest text-xs">Syncing with Protocol...</p>
                        </div>
                     ) : proposals.length > 0 ? (
                        <div className="grid gap-6">
                           {proposals.map((prop) => {
                             const totalVotes = prop.forVotes + prop.againstVotes;
                             const forPercent = totalVotes > 0 ? (prop.forVotes / totalVotes) * 100 : 0;
                             const againstPercent = totalVotes > 0 ? (prop.againstVotes / totalVotes) * 100 : 0;
                             const isVotingThis = activeAction === 'VOTE' && votingOnId === prop.id;

                             return (
                               <div key={prop.id} className="bg-slate-900/40 border border-white/5 hover:border-purple-500/30 rounded-[2rem] p-8 md:p-10 transition-all shadow-2xl group">
                                 <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                   <div>
                                      <div className="flex items-center gap-3 mb-3">
                                        <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 rounded-lg border border-blue-500/20">{prop.id}</span>
                                        <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400 bg-green-500/10 rounded-lg border border-green-500/20 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>{prop.status}</span>
                                      </div>
                                      <h4 className="text-2xl font-black text-white leading-tight">{prop.title}</h4>
                                   </div>
                                   <div className="text-right shrink-0 bg-white/5 px-4 py-2 rounded-xl">
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Time Remaining</p>
                                      <p className="text-sm font-mono text-white">{prop.endTime}</p>
                                   </div>
                                 </div>
                                 
                                 <p className="text-sm text-slate-400 leading-relaxed mb-8 max-w-4xl">{prop.description}</p>
                                 
                                 <div className="mb-8 space-y-4 bg-black/40 p-6 rounded-2xl border border-white/5">
                                    <div>
                                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2">
                                        <span className="text-green-400">For ({prop.forVotes.toLocaleString()})</span>
                                        <span className="text-white">{forPercent.toFixed(1)}%</span>
                                      </div>
                                      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${forPercent}%` }}></div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2">
                                        <span className="text-red-400">Against ({prop.againstVotes.toLocaleString()})</span>
                                        <span className="text-white">{againstPercent.toFixed(1)}%</span>
                                      </div>
                                      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${againstPercent}%` }}></div>
                                      </div>
                                    </div>
                                 </div>

                                 <div className="flex flex-col sm:flex-row gap-4 border-t border-white/5 pt-8">
                                    <button 
                                      onClick={() => handleVote(prop.id, 1)}
                                      disabled={activeAction !== null || parseFloat(formattedPower) === 0}
                                      className="flex-1 py-4 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                      {isVotingThis ? <Loader2 size={16} className="animate-spin"/> : <ThumbsUp size={16}/>}
                                      Vote For
                                    </button>
                                    <button 
                                      onClick={() => handleVote(prop.id, 0)}
                                      disabled={activeAction !== null || parseFloat(formattedPower) === 0}
                                      className="flex-1 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                      {isVotingThis ? <Loader2 size={16} className="animate-spin"/> : <ThumbsDown size={16}/>}
                                      Vote Against
                                    </button>
                                 </div>
                               </div>
                             );
                           })}
                        </div>
                     ) : (
                        <div className="bg-slate-900/30 border border-white/5 rounded-[2rem] p-12 md:p-20 flex flex-col items-center justify-center text-center shadow-lg">
                            <div className="bg-white/5 p-6 rounded-full mb-6">
                              <Shield className="w-12 h-12 text-slate-500" />
                            </div>
                            <h4 className="text-2xl font-bold text-white mb-3">No Active Proposals</h4>
                            <p className="text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
                                The governance queue is currently empty on-chain. Deploy a new cryptographic payload to initiate a network consensus event.
                            </p>
                            <button 
                               onClick={() => setActiveTab('create')}
                               className="mt-8 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center gap-2"
                            >
                                Deploy Proposal <ChevronRight size={18}/>
                            </button>
                        </div>
                     )}
                  </div>
               )}

               {/* ===================== CREATE PROPOSAL TAB ===================== */}
               {activeTab === 'create' && (
                  <div className="bg-slate-900/30 p-6 md:p-12 border border-white/5 rounded-[2.5rem] relative overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-40"></div>
                     
                     <div className="mb-10">
                         <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Deploy New Proposal</h3>
                         <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-3xl">
                             Submit an execution payload to the DAO. If the proposal passes consensus, the Timelock will automatically execute the parameters defined below. (Min 100 characters in description).
                         </p>
                     </div>

                     <div className="space-y-8">
                        <div className="space-y-3">
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Proposal Title</label>
                           <input 
                              type="text" 
                              placeholder="e.g. Upgrade Security Module"
                              value={propTitle}
                              onChange={(e) => setPropTitle(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-lg outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-600"
                           />
                        </div>

                        <div className="space-y-3">
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Execution Target Address</label>
                           <input 
                              type="text" 
                              placeholder="0x..."
                              value={targetAddress}
                              onChange={(e) => setTargetAddress(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 font-mono text-white text-lg outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-600"
                           />
                        </div>

                        <div className="space-y-3">
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Transfer Value (ETH)</label>
                           <input 
                              type="number" 
                              placeholder="0.00"
                              value={ethAmount}
                              onChange={(e) => setEthAmount(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 font-mono text-white text-lg outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-600"
                           />
                        </div>

                        <div className="space-y-3">
                           <div className="flex justify-between items-center px-1">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detailed Description</label>
                              <span className={`text-xs font-bold ${propDesc.length < 100 ? 'text-red-400' : 'text-green-400'}`}>{propDesc.length}/100</span>
                           </div>
                           <textarea 
                              rows={5}
                              placeholder="Explain the technical and strategic reasons for this proposal..."
                              value={propDesc}
                              onChange={(e) => setPropDesc(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-base outline-none focus:border-purple-500/50 transition-all resize-none placeholder:text-slate-600"
                           />
                        </div>

                        <ConnectButton.Custom>
                          {({ account, chain, openConnectModal, mounted }) => {
                              const connected = mounted && account && chain;
                              const wrongNetwork = connected && chain.id !== 11155111;
                              const isReady = propTitle && propDesc.length >= 100 && targetAddress && ethAmount;

                              return (
                                  <button 
                                      onClick={() => {
                                          if (!connected) openConnectModal();
                                          else if (wrongNetwork) switchChain({ chainId: 11155111 });
                                          else handlePropose();
                                      }}
                                      disabled={connected && !wrongNetwork && (activeAction === 'PROPOSE' || isConfirming || !isReady)}
                                      className={`w-full py-5 md:py-6 rounded-2xl font-bold uppercase text-sm md:text-base tracking-widest transition-all flex justify-center items-center gap-3 mt-4 shadow-xl ${
                                          !connected ? 'bg-slate-200 text-slate-900 hover:bg-white' :
                                          wrongNetwork ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                          'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                                      } ${(connected && !wrongNetwork && (!isReady || activeAction === 'PROPOSE' || isConfirming)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                      {activeAction === 'PROPOSE' || isConfirming ? <Loader2 className="animate-spin" size={24}/> : <Gavel size={24}/>}
                                      {!connected ? "Connect Wallet" : wrongNetwork ? "Switch to Sepolia" : activeAction === 'PROPOSE' || isConfirming ? "Processing..." : "Deploy Proposal"}
                                  </button>
                              );
                          }}
                        </ConnectButton.Custom>
                     </div>
                  </div>
               )}
            </div>
          </div>
        </main>

        {/* Explorer Linked Toast Notifications */}
        {toast && (
          <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[2000] animate-in slide-in-from-right duration-300 w-[calc(100%-3rem)] md:w-auto">
             <div className={`flex items-start gap-4 md:gap-6 p-6 md:p-8 rounded-3xl border backdrop-blur-2xl shadow-2xl md:max-w-md bg-[#08080f]/95 ${
                toast.type === 'SUCCESS' ? 'border-blue-500/30' : 'border-red-500/30'
             }`}>
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg ${toast.type === 'SUCCESS' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                   {toast.type === 'SUCCESS' ? <CheckCircle size={24} className="md:w-6 md:h-6"/> : <AlertCircle size={24} className="md:w-6 md:h-6"/>}
                </div>
                <div className="flex-1 mt-1">
                   <h4 className={`text-sm md:text-base font-bold uppercase tracking-wide mb-1 md:mb-2 ${toast.type === 'SUCCESS' ? 'text-blue-400' : 'text-red-400'}`}>
                      {toast.message}
                   </h4>
                   <p className="text-xs md:text-sm text-slate-400 leading-relaxed mb-4 md:mb-5 font-light">
                      {toast.subMessage}
                   </p>
                   {toast.hash && (
                     <a 
                      href={`https://sepolia.etherscan.io/tx/${toast.hash}`} 
                      target="_blank" 
                      className="inline-flex items-center gap-2 text-[10px] md:text-xs font-bold text-blue-400 uppercase tracking-widest hover:underline bg-blue-500/10 px-4 py-2 md:px-5 md:py-2.5 rounded-xl border border-blue-500/20 transition-all hover:bg-blue-500/20"
                     >
                       <ExternalLink size={14} className="md:w-4 md:h-4"/> View on Explorer
                     </a>
                   )}
                </div>
                <button onClick={() => setToast(null)} className="text-slate-600 hover:text-white transition-colors p-1 md:p-2 bg-white/5 rounded-full mt-[-5px] mr-[-5px]">
                   <X size={16} className="md:w-5 md:h-5"/>
                </button>
             </div>
          </div>
        )}
      </div>
    </SessionGuard>
  );
}