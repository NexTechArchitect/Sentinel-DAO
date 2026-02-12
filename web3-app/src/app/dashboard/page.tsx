'use client';



import { useState, useEffect, useRef } from 'react';
import { 
  Shield, ArrowLeft, Loader2, Zap, Activity, 
  CheckCircle, AlertCircle, ShieldAlert, LogOut, 
  Hexagon, BarChart3, Wifi, Key, FileSignature, 
  X, ChevronRight, ExternalLink, Globe, Fingerprint, 
  RefreshCcw, Wallet, Layers, Lock
} from 'lucide-react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit'; 
import { 
  useAccount, 
  useReadContract, 
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain, 
  useSignTypedData
} from 'wagmi';
import { formatEther, parseEther, maxUint256 } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CONTRACT_ADDRESSES, GOV_TOKEN_EXTENDED_ABI, 
  ROLE_MANAGER_ABI, GOV_ANALYTICS_ABI, 
  RAGE_QUIT_ABI, TREASURY_ABI, CHAINLINK_ABI,
  DELEGATION_REGISTRY_ABI, OFFCHAIN_EXECUTOR_ABI, ERC20_ABI
} from '@/config/constants';
import { SessionGuard } from '@/components/SessionGuard';

const EIP712_DOMAIN_NAME = "DAO Delegation"; 
const EIP712_DOMAIN_VERSION = "1";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, filter: "blur(5px)" },
  show: { 
    y: 0, 
    opacity: 1, 
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 60, damping: 20 } 
  }
};

type ToastState = { 
  type: 'SUCCESS' | 'ERROR'; 
  message: string; 
  subMessage?: string; 
  hash?: string; 
} | null;

export default function Dashboard() {
  const { isConnected, address } = useAccount();
  const { switchChain } = useSwitchChain(); 
  
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const [delegateeAddress, setDelegateeAddress] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  
  const [activeAction, setActiveAction] = useState<'APPROVE' | 'RAGEQUIT' | 'DELEGATE' | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      if (spotlightRef.current) {
        spotlightRef.current.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(59, 130, 246, 0.08), transparent 40%)`;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const pollConfig = { refetchInterval: 15000, enabled: !!address };

  const { data: isAdmin } = useReadContract({ address: CONTRACT_ADDRESSES.ROLE_MANAGER as `0x${string}`, abi: ROLE_MANAGER_ABI, functionName: 'isAdmin', args: address ? [address] : undefined, ...pollConfig });
  const { data: isGuardian } = useReadContract({ address: CONTRACT_ADDRESSES.ROLE_MANAGER as `0x${string}`, abi: ROLE_MANAGER_ABI, functionName: 'isGuardian', args: address ? [address] : undefined, ...pollConfig });
  const { data: govStats } = useReadContract({ address: CONTRACT_ADDRESSES.GOV_ANALYTICS as `0x${string}`, abi: GOV_ANALYTICS_ABI, functionName: 'getStats', query: { refetchInterval: 15000 } });
  const { data: ethPriceData } = useReadContract({ address: CONTRACT_ADDRESSES.CHAINLINK_ETH_USD as `0x${string}`, abi: CHAINLINK_ABI, functionName: 'latestRoundData', query: { refetchInterval: 15000 } });
  const { data: treasuryEth } = useReadContract({ address: CONTRACT_ADDRESSES.TREASURY as `0x${string}`, abi: TREASURY_ABI, functionName: 'ethBalance', query: { refetchInterval: 15000 } });
  
  const { data: disoBalance, refetch: refetchBalance } = useReadContract({ address: CONTRACT_ADDRESSES.GOV_TOKEN as `0x${string}`, abi: GOV_TOKEN_EXTENDED_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, ...pollConfig });
  const { data: totalSupply } = useReadContract({ address: CONTRACT_ADDRESSES.GOV_TOKEN as `0x${string}`, abi: GOV_TOKEN_EXTENDED_ABI, functionName: 'totalSupply', query: { refetchInterval: 15000 } });
  const { data: rqAllowance, refetch: refetchAllowance } = useReadContract({ address: CONTRACT_ADDRESSES.GOV_TOKEN as `0x${string}`, abi: ERC20_ABI, functionName: 'allowance', args: address ? [address, CONTRACT_ADDRESSES.RAGE_QUIT as `0x${string}`] : undefined, ...pollConfig });

  const { data: hasRageQuit, refetch: refetchRQ } = useReadContract({ address: CONTRACT_ADDRESSES.RAGE_QUIT as `0x${string}`, abi: RAGE_QUIT_ABI, functionName: 'hasRageQuit', args: address ? [address] : undefined, ...pollConfig });
  const { data: currentNonce, refetch: refetchNonce } = useReadContract({ address: CONTRACT_ADDRESSES.DELEGATION_REGISTRY as `0x${string}`, abi: DELEGATION_REGISTRY_ABI, functionName: 'nonces', args: address ? [address] : undefined, ...pollConfig });

  const ethPrice = ethPriceData ? Number((ethPriceData as any)[1]) / 10**8 : 0;
  const tEth = treasuryEth ? parseFloat(formatEther(treasuryEth as bigint)) : 0;
  const totalProposals = govStats ? Number((govStats as any)[0]) : 0;
  const successProposals = govStats ? Number((govStats as any)[1]) : 0;
  const failedProposals = govStats ? Number((govStats as any)[2]) : 0;
  
  const myDiso = disoBalance ? parseFloat(formatEther(disoBalance as bigint)) : 0;
  const totalDiso = totalSupply ? parseFloat(formatEther(totalSupply as bigint)) : 1; 
  
  const parsedBurnAmount = burnAmount ? parseEther(burnAmount) : BigInt(0);
  const isApprovedForRQ = rqAllowance !== undefined && (rqAllowance as bigint) >= parsedBurnAmount && parsedBurnAmount > BigInt(0);
  const isValidBurnAmount = parsedBurnAmount > BigInt(0) && disoBalance !== undefined && parsedBurnAmount <= (disoBalance as bigint);

  const previewBurnAmount = burnAmount ? parseFloat(burnAmount) : 0;
  const dynamicEstimatedEth = totalDiso > 0 ? (previewBurnAmount * tEth) / totalDiso : 0;
  const dynamicEstimatedUsd = dynamicEstimatedEth * ethPrice;

  const { writeContract: executeWrite, data: txHash, error: txError, reset: resetTx } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });
  const { signTypedDataAsync } = useSignTypedData();

  useEffect(() => {
    if (txHash) setToast({ type: 'SUCCESS', message: 'Transaction Sent', subMessage: 'Awaiting network confirmation...', hash: txHash });
  }, [txHash]);

  useEffect(() => {
    if (isConfirmed) {
      if (activeAction === 'APPROVE') setToast({ type: 'SUCCESS', message: 'Approval Complete', subMessage: 'You can now execute the Burn.', hash: txHash });
      else if (activeAction === 'RAGEQUIT') {
        setToast({ type: 'SUCCESS', message: 'Rage Quit Executed', subMessage: 'ETH has been sent to your wallet.', hash: txHash });
        setBurnAmount('');
      } else if (activeAction === 'DELEGATE') {
        setToast({ type: 'SUCCESS', message: 'Delegation Successful', subMessage: 'Voting power delegated gaslessly.', hash: txHash });
      }
      setActiveAction(null);
      resetTx();
      setTimeout(() => { refetchRQ(); refetchNonce(); refetchAllowance(); refetchBalance(); }, 3000); 
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (txError) {
      setToast({ type: 'ERROR', message: 'Transaction Failed', subMessage: (txError as any)?.shortMessage || 'Request rejected.' });
      setActiveAction(null);
      resetTx();
    }
  }, [txError]);

  const handleApproveRQ = () => {
    if (!address || !isValidBurnAmount) return;
    setActiveAction('APPROVE');
    executeWrite({
      address: CONTRACT_ADDRESSES.GOV_TOKEN as `0x${string}`,
      abi: ERC20_ABI, functionName: 'approve', args: [CONTRACT_ADDRESSES.RAGE_QUIT as `0x${string}`, maxUint256], 
    });
  };

  const handleRageQuit = () => {
    if (!address || !isValidBurnAmount || !isApprovedForRQ) return;
    setActiveAction('RAGEQUIT');
    executeWrite({
      address: CONTRACT_ADDRESSES.RAGE_QUIT as `0x${string}`,
      abi: RAGE_QUIT_ABI, functionName: 'quit', args: [["0x0000000000000000000000000000000000000000"], parsedBurnAmount],
    });
  };

  const handleGaslessDelegation = async () => {
    if (!address || !delegateeAddress || currentNonce === undefined) return;
    try {
      setActiveAction('DELEGATE');
      const deadline = Math.floor(Date.now() / 1000) + 3600; 
      
      const domain = { name: EIP712_DOMAIN_NAME, version: EIP712_DOMAIN_VERSION, chainId: 11155111, verifyingContract: CONTRACT_ADDRESSES.DELEGATION_REGISTRY as `0x${string}` };
      const types = { Delegation: [{ name: "delegator", type: "address" }, { name: "delegatee", type: "address" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }] };
      const message = { delegator: address, delegatee: delegateeAddress as `0x${string}`, nonce: BigInt(currentNonce.toString()), deadline: BigInt(deadline) };

      const signature = await signTypedDataAsync({ domain, types, primaryType: 'Delegation', message });

      executeWrite({
        address: CONTRACT_ADDRESSES.DELEGATION_REGISTRY as `0x${string}`,
        abi: DELEGATION_REGISTRY_ABI, functionName: 'delegateBySig',
        args: [address, delegateeAddress as `0x${string}`, BigInt(currentNonce.toString()), BigInt(deadline), signature],
      });
    } catch (err: any) {
      setToast({ type: 'ERROR', message: 'Signature Rejected', subMessage: err.shortMessage || 'User denied signing.' });
      setActiveAction(null);
    }
  };

  if (!isMounted) return null;

  return (
    <SessionGuard requireSession={true}>
      <div className="min-h-screen w-full bg-[#05050a] text-slate-200 font-sans flex flex-col relative selection:bg-blue-500/30 overflow-x-hidden">
        
        {/* DYNAMIC BACKGROUND */}
        <div className="fixed inset-0 z-0 bg-[#05050a]"></div>
        <motion.div animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.1, 1] }} transition={{ duration: 10, repeat: Infinity }} className="fixed top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
        <motion.div animate={{ opacity: [0.2, 0.4, 0.2], scale: [1.1, 1, 1.1] }} transition={{ duration: 12, repeat: Infinity }} className="fixed bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
        <div ref={spotlightRef} className="fixed inset-0 z-10 pointer-events-none transition-opacity duration-500" />

        {/* NAVBAR */}
        <nav className="border-b border-white/5 bg-[#05050a]/70 backdrop-blur-3xl z-50 sticky top-0 supports-[backdrop-filter]:bg-[#05050a]/40">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 w-full flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold tracking-[0.2em] uppercase">Return</span>
              </Link>
              <div className="h-6 w-px bg-white/10 hidden md:block"></div>
              <div className="flex items-center gap-3">
                 <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <Layers className="text-blue-400" size={18} />
                 </div>
                 <span className="text-lg font-bold text-white tracking-wide">DASHBOARD</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
            </div>
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto relative z-20 pb-20 pt-10 px-4 md:px-8">
          <motion.div 
            variants={containerVariants} initial="hidden" animate="show"
            className="max-w-7xl mx-auto space-y-8"
          >
            
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
               <div>
                  <h1 className="text-3xl md:text-5xl font-medium text-white tracking-tight mb-2">
                    Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 font-bold">Center</span>
                  </h1>
                  <p className="text-slate-400 text-sm md:text-base font-light tracking-wide max-w-xl">
                    Manage your identity, track protocol analytics, and execute cryptographic treasury actions.
                  </p>
               </div>
               <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-full">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#34d399]"></div>
                  <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">System Operational</span>
               </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
       
                <div className="col-span-1 md:col-span-2 bg-[#0a0a0f]/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full group-hover:bg-blue-500/10 transition-colors"></div>
                   <div className="relative z-10 flex flex-col h-full justify-between">
                      <div className="flex items-start justify-between">
                         <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em] mb-1">Total Voting Power</p>
                            <h2 className="text-4xl md:text-5xl font-medium text-white tracking-tight">
                               {myDiso.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}
                               <span className="text-lg md:text-2xl text-slate-500 ml-2 font-light">DISO</span>
                            </h2>
                         </div>
                         <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                            <Wallet className="text-blue-400" size={24} />
                         </div>
                      </div>
                      <div className="mt-6 flex gap-3">
                         {isAdmin && <span className="badge-blue"><RefreshCcw size={14}/> Admin</span>}
                         {isGuardian && <span className="badge-purple"><Fingerprint size={14}/> Guardian</span>}
                         {!isAdmin && !isGuardian && <span className="badge-slate"><Globe size={14}/> Citizen</span>}
                      </div>
                   </div>
                </div>

                {[
                  { label: "Treasury", value: `${tEth.toFixed(2)} ETH`, sub: `$${(tEth * ethPrice).toLocaleString()}`, icon: Shield, color: "text-indigo-400" },
                  { label: "Total Proposals", value: totalProposals, sub: `${successProposals} Passed`, icon: FileSignature, color: "text-emerald-400" },
                ].map((stat, i) => (
                  <motion.div key={i} whileHover={{ y: -5 }} className="bg-[#0a0a0f]/60 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between h-40 shadow-lg">
                     <div className="flex justify-between items-start">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                        <stat.icon className={`${stat.color} opacity-80`} size={20} />
                     </div>
                     <div>
                        <h3 className="text-2xl font-medium text-white mb-1">{stat.value}</h3>
                        <p className="text-xs text-slate-400 font-mono">{stat.sub}</p>
                     </div>
                  </motion.div>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               
               <motion.div variants={itemVariants} className="bg-gradient-to-br from-[#0f0f16] to-[#05050a] p-8 md:p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-purple-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex items-center gap-4 mb-6">
                     <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
                        <Wifi size={24} />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-white">Gasless Delegation</h3>
                        <p className="text-xs text-slate-400">EIP-712 Signature Relay</p>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Nonce</span>
                        <span className="text-xl font-mono text-white">{currentNonce !== undefined ? Number(currentNonce) : '...'}</span>
                     </div>

                     <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Delegatee Address</label>
                        <div className="relative">
                           <input 
                              type="text" 
                              placeholder="0x..." 
                              value={delegateeAddress} 
                              onChange={(e) => setDelegateeAddress(e.target.value)}
                              className="w-full bg-[#0a0a0f] border border-white/10 rounded-2xl py-4 pl-5 pr-12 text-white text-sm focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all font-mono outline-none placeholder:text-slate-700" 
                           />
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600">
                              <Key size={16} />
                           </div>
                        </div>
                     </div>

                     <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleGaslessDelegation} 
                        disabled={!isConnected || activeAction === 'DELEGATE' || !delegateeAddress}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold tracking-[0.15em] uppercase rounded-2xl transition-all shadow-[0_0_30px_rgba(168,85,247,0.3)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none"
                     >
                        {activeAction === 'DELEGATE' ? <Loader2 size={18} className="animate-spin"/> : <FileSignature size={18}/>} 
                        {activeAction === 'DELEGATE' ? 'Signing...' : 'Sign Delegation'}
                     </motion.button>
                  </div>
               </motion.div>

               <motion.div variants={itemVariants} className="bg-gradient-to-br from-red-950/10 to-[#05050a] p-8 md:p-10 rounded-[2.5rem] border border-red-500/10 relative overflow-hidden group shadow-2xl">
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-600/5 blur-[80px] rounded-full pointer-events-none"></div>
                  
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                     <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400">
                        <LogOut size={24} />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-white">Emergency Exit</h3>
                        <p className="text-xs text-slate-400">Treasury Rage Quit Protocol</p>
                     </div>
                  </div>

                  {hasRageQuit ? (
                     <div className="h-64 flex flex-col items-center justify-center bg-red-500/5 rounded-3xl border border-red-500/20 text-center p-6">
                        <ShieldAlert size={48} className="text-red-500 mb-4 opacity-50"/>
                        <h4 className="text-lg font-bold text-red-400 uppercase tracking-widest">Protocol Executed</h4>
                        <p className="text-slate-400 text-sm mt-2">Assets have been withdrawn to your wallet.</p>
                     </div>
                  ) : (
                     <div className="space-y-6 relative z-10">
                        <div className="p-5 bg-black/40 rounded-2xl border border-white/5 flex flex-col gap-1">
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estimated Return</span>
                           <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-medium text-white">{dynamicEstimatedEth.toFixed(4)}</span>
                              <span className="text-sm font-bold text-red-400">ETH</span>
                           </div>
                           <span className="text-xs text-slate-500 font-mono">≈ ${dynamicEstimatedUsd.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>

                        {myDiso === 0 ? (
                           <div className="p-4 text-center border border-dashed border-slate-700 rounded-2xl text-slate-500 text-xs font-bold uppercase tracking-widest">
                              No Tokens Available to Burn
                           </div>
                        ) : (
                           <>
                              <div className="space-y-3">
                                 <div className="flex justify-between">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Burn Amount</label>
                                    <button onClick={() => setBurnAmount(myDiso.toString())} className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider">Max</button>
                                 </div>
                                 <input 
                                    type="number" 
                                    placeholder="0.0" 
                                    value={burnAmount} 
                                    onChange={(e) => setBurnAmount(e.target.value)}
                                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-2xl py-4 px-5 text-white text-sm focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all font-mono outline-none placeholder:text-slate-700" 
                                 />
                              </div>

                              <div className="flex gap-4">
                                 {!isApprovedForRQ ? (
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleApproveRQ} disabled={activeAction !== null || !isValidBurnAmount} 
                                       className="flex-1 py-4 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/30 text-xs font-bold tracking-[0.1em] uppercase rounded-2xl transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                                       {activeAction === 'APPROVE' ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>} Approve
                                    </motion.button>
                                 ) : (
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleRageQuit} disabled={activeAction !== null || !isValidBurnAmount} 
                                       className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold tracking-[0.1em] uppercase rounded-2xl transition-all flex justify-center items-center gap-2 shadow-[0_0_30px_rgba(220,38,38,0.4)] disabled:opacity-50">
                                       {activeAction === 'RAGEQUIT' ? <Loader2 className="animate-spin" size={16}/> : <LogOut size={16}/>} Execute Burn
                                    </motion.button>
                                 )}
                              </div>
                           </>
                        )}
                     </div>
                  )}
               </motion.div>
            </div>

          </motion.div>
        </main>

        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-8 right-0 left-0 md:left-auto md:right-8 z-50 px-4 md:px-0 flex justify-center md:block pointer-events-none"
            >
               <div className="w-full md:w-[400px] pointer-events-auto bg-[#0a0a0f]/95 backdrop-blur-2xl border border-white/10 p-6 rounded-[1.5rem] shadow-2xl flex gap-4 items-start relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${toast.type === 'SUCCESS' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  <div className={`mt-1 p-2 rounded-full ${toast.type === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                     {toast.type === 'SUCCESS' ? <CheckCircle size={20}/> : <ShieldAlert size={20}/>}
                  </div>
                  <div className="flex-1">
                     <h4 className="text-sm font-bold text-white mb-1 tracking-wide">{toast.message}</h4>
                     <p className="text-xs text-slate-400 leading-relaxed mb-3">{toast.subMessage}</p>
                     {toast.hash && (
                        <a href={`https://sepolia.etherscan.io/tx/${toast.hash}`} target="_blank" className="inline-flex items-center gap-2 text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider transition-colors">
                           View on Explorer <ExternalLink size={10}/>
                        </a>
                     )}
                  </div>
                  <button onClick={() => setToast(null)} className="text-slate-600 hover:text-white transition-colors"><X size={18}/></button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </SessionGuard>
  );
}

const badgeBase = "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border";