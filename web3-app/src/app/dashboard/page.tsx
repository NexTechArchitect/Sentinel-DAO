'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Shield, ArrowLeft, Loader2, Zap, Activity, 
  CheckCircle, ShieldAlert, LogOut, 
  Key, FileSignature, 
  X, ExternalLink, Globe, Fingerprint, 
  RefreshCcw, Wallet, Layers, Lock, Leaf, Feather, Anchor
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
  DELEGATION_REGISTRY_ABI, ERC20_ABI
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
  hidden: { y: 20, opacity: 0 },
  show: { 
    y: 0, 
    opacity: 1, 
    transition: { type: "spring", stiffness: 60, damping: 20 } 
  }
};

// --- FALLING ANIMATION (Matching Docs Page) ---
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

type ToastState = { 
  type: 'SUCCESS' | 'ERROR'; 
  message: string; 
  subMessage?: string; 
  hash?: string; 
} | null;

export default function Dashboard() {
  const { isConnected, address } = useAccount();
  
  const [toast, setToast] = useState<ToastState>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const [delegateeAddress, setDelegateeAddress] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  
  const [activeAction, setActiveAction] = useState<'APPROVE' | 'RAGEQUIT' | 'DELEGATE' | null>(null);

  useEffect(() => {
    setIsMounted(true);
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

  const leafColors = ["#15803d", "#b45309", "#4b5563", "#0f766e"];

  if (!isMounted) return null;

  return (
    <SessionGuard requireSession={true}>
      <div className="min-h-screen w-full bg-[#F5F2EB] text-stone-900 font-sans flex flex-col relative selection:bg-emerald-200 overflow-x-hidden">
        
        {/* --- BACKGROUND LAYERS --- */}
        <div className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

        {/* Falling Leaves Background */}
        <div className="fixed inset-0 z-0 overflow-hidden h-full pointer-events-none">
          {[...Array(15)].map((_, i) => {
            const isFeather = i % 2 === 0;
            const randomSize = 24 + Math.random() * 24; 
            const randomLeft = Math.floor(Math.random() * 100);
            const color = leafColors[i % leafColors.length];
            return (
              <motion.div
                key={i}
                custom={i % 2 === 0 ? 1 : -1}
                variants={fallingVariants}
                initial="initial"
                animate="animate"
                className="absolute opacity-60"
                style={{ left: `${randomLeft}%`, color: color }} 
              >
                {isFeather ? <Feather size={randomSize} strokeWidth={1.5} /> : <Leaf size={randomSize} strokeWidth={1.5} fill={color} fillOpacity={0.1} />}
              </motion.div>
            )
          })}
        </div>

        {/* NAVBAR */}
        <nav className="border-b border-[#D6D3C0] bg-[#F5F2EB]/95 backdrop-blur-3xl z-50 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 w-full flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 text-stone-600 hover:text-black transition-colors group font-sans">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold tracking-[0.2em] uppercase">Return</span>
              </Link>
              <div className="h-6 w-px bg-stone-300 hidden md:block"></div>
              <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white rounded-lg border border-[#D6D3C0] shadow-sm">
                    <Layers className="text-stone-900" size={18} />
                  </div>
                  <span className="text-lg font-bold text-black tracking-wide font-serif">DASHBOARD</span>
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
            
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[#D6D3C0] pb-8">
               <div>
                  <h1 className="text-3xl md:text-5xl font-medium text-black tracking-tight mb-2 font-serif">
                    Command <span className="italic text-stone-600">Center</span>
                  </h1>
                  <p className="text-stone-600 text-sm md:text-base font-medium tracking-wide max-w-xl font-sans">
                    Manage your identity, track protocol analytics, and execute cryptographic treasury actions.
                  </p>
               </div>
               <div className="flex items-center gap-3 px-4 py-2 bg-white border border-[#D6D3C0] rounded-full shadow-sm">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-emerald-800 tracking-widest uppercase">System Operational</span>
               </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
       
                {/* VOTING POWER CARD */}
                <div className="col-span-1 md:col-span-2 bg-white p-8 rounded-[2rem] border border-[#D6D3C0] hover:border-black transition-all group relative overflow-hidden shadow-sm hover:shadow-md">
                   <div className="relative z-10 flex flex-col h-full justify-between">
                      <div className="flex items-start justify-between">
                         <div>
                            <p className="text-xs font-bold text-stone-500 uppercase tracking-[0.15em] mb-1 font-sans">Total Voting Power</p>
                            <h2 className="text-4xl md:text-5xl font-bold text-black tracking-tight font-serif">
                               {myDiso.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}
                               <span className="text-lg md:text-2xl text-stone-400 ml-2 font-light font-sans">DISO</span>
                            </h2>
                         </div>
                         <div className="p-3 bg-[#F5F2EB] rounded-2xl border border-[#D6D3C0]">
                            <Wallet className="text-stone-800" size={24} />
                         </div>
                      </div>
                      <div className="mt-6 flex gap-3">
                         {isAdmin && <span className="px-3 py-1 bg-stone-100 border border-stone-300 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 text-black"><RefreshCcw size={14}/> Admin</span>}
                         {isGuardian && <span className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 text-amber-800"><Fingerprint size={14}/> Guardian</span>}
                         {!isAdmin && !isGuardian && <span className="px-3 py-1 bg-stone-100 border border-stone-300 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 text-stone-600"><Globe size={14}/> Citizen</span>}
                      </div>
                   </div>
                </div>

                {[
                  { label: "Treasury", value: `${tEth.toFixed(2)} ETH`, sub: `$${(tEth * ethPrice).toLocaleString()}`, icon: Shield, color: "text-amber-700" },
                  { label: "Total Proposals", value: totalProposals, sub: `${successProposals} Passed`, icon: FileSignature, color: "text-emerald-700" },
                ].map((stat, i) => (
                  <motion.div key={i} whileHover={{ y: -5 }} className="bg-white p-6 rounded-[2rem] border border-[#D6D3C0] hover:border-black transition-all flex flex-col justify-between h-40 shadow-sm hover:shadow-md">
                     <div className="flex justify-between items-start">
                        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest font-sans">{stat.label}</p>
                        <stat.icon className={`${stat.color}`} size={20} />
                     </div>
                     <div>
                        <h3 className="text-2xl font-bold text-black mb-1 font-serif">{stat.value}</h3>
                        <p className="text-xs text-stone-500 font-mono font-medium">{stat.sub}</p>
                     </div>
                  </motion.div>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               
               {/* GASLESS DELEGATION */}
               <motion.div variants={itemVariants} className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-[#D6D3C0] relative overflow-hidden group shadow-lg">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="p-3 bg-[#F5F2EB] rounded-xl border border-[#D6D3C0] text-stone-800">
                        <Zap size={24} />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-black font-serif">Gasless Delegation</h3>
                        <p className="text-xs text-stone-500 font-sans font-medium">EIP-712 Signature Relay</p>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="flex justify-between items-center p-4 bg-[#F5F2EB] rounded-2xl border border-[#D6D3C0]">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-widest font-sans">Current Nonce</span>
                        <span className="text-xl font-mono text-black font-bold">{currentNonce !== undefined ? Number(currentNonce) : '...'}</span>
                     </div>

                     <div className="space-y-3">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1 font-sans">Delegatee Address</label>
                        <div className="relative">
                           <input 
                              type="text" 
                              placeholder="0x..." 
                              value={delegateeAddress} 
                              onChange={(e) => setDelegateeAddress(e.target.value)}
                              className="w-full bg-white border border-[#D6D3C0] rounded-2xl py-4 pl-5 pr-12 text-black text-sm focus:border-black focus:ring-1 focus:ring-black/5 transition-all font-mono outline-none placeholder:text-stone-400 font-medium" 
                           />
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">
                              <Key size={16} />
                           </div>
                        </div>
                     </div>

                     <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleGaslessDelegation} 
                        disabled={!isConnected || activeAction === 'DELEGATE' || !delegateeAddress}
                        className="w-full py-4 bg-stone-900 hover:bg-black text-white text-xs font-bold tracking-[0.15em] uppercase rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none font-sans"
                     >
                        {activeAction === 'DELEGATE' ? <Loader2 size={18} className="animate-spin"/> : <FileSignature size={18}/>} 
                        {activeAction === 'DELEGATE' ? 'Signing...' : 'Sign Delegation'}
                     </motion.button>
                  </div>
               </motion.div>

               {/* RAGE QUIT */}
               <motion.div variants={itemVariants} className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-red-200 relative overflow-hidden group shadow-lg">
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-50 blur-[80px] rounded-full pointer-events-none"></div>
                  
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                     <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-red-600">
                        <LogOut size={24} />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-black font-serif">Emergency Exit</h3>
                        <p className="text-xs text-stone-500 font-sans font-medium">Treasury Rage Quit Protocol</p>
                     </div>
                  </div>

                  {hasRageQuit ? (
                     <div className="h-64 flex flex-col items-center justify-center bg-red-50 rounded-3xl border border-red-100 text-center p-6">
                        <ShieldAlert size={48} className="text-red-400 mb-4 opacity-80"/>
                        <h4 className="text-lg font-bold text-red-700 uppercase tracking-widest font-sans">Protocol Executed</h4>
                        <p className="text-stone-600 text-sm mt-2 font-medium">Assets have been withdrawn to your wallet.</p>
                     </div>
                  ) : (
                     <div className="space-y-6 relative z-10">
                        <div className="p-5 bg-[#F5F2EB] rounded-2xl border border-[#D6D3C0] flex flex-col gap-1">
                           <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest font-sans">Estimated Return</span>
                           <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-bold text-black font-serif">{dynamicEstimatedEth.toFixed(4)}</span>
                              <span className="text-sm font-bold text-stone-500">ETH</span>
                           </div>
                           <span className="text-xs text-stone-500 font-mono font-medium">≈ ${dynamicEstimatedUsd.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>

                        {myDiso === 0 ? (
                           <div className="p-4 text-center border border-dashed border-stone-300 rounded-2xl text-stone-400 text-xs font-bold uppercase tracking-widest font-sans">
                              No Tokens Available to Burn
                           </div>
                        ) : (
                           <>
                              <div className="space-y-3">
                                 <div className="flex justify-between">
                                    <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1 font-sans">Burn Amount</label>
                                    <button onClick={() => setBurnAmount(myDiso.toString())} className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 uppercase tracking-wider font-sans">Max</button>
                                 </div>
                                 <input 
                                    type="number" 
                                    placeholder="0.0" 
                                    value={burnAmount} 
                                    onChange={(e) => setBurnAmount(e.target.value)}
                                    className="w-full bg-white border border-[#D6D3C0] rounded-2xl py-4 px-5 text-black text-sm focus:border-red-400 focus:ring-1 focus:ring-red-100 transition-all font-mono outline-none placeholder:text-stone-400 font-medium" 
                                 />
                              </div>

                              <div className="flex gap-4">
                                 {!isApprovedForRQ ? (
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleApproveRQ} disabled={activeAction !== null || !isValidBurnAmount} 
                                       className="flex-1 py-4 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 text-xs font-bold tracking-[0.1em] uppercase rounded-2xl transition-all flex justify-center items-center gap-2 disabled:opacity-50 font-sans">
                                       {activeAction === 'APPROVE' ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>} Approve
                                    </motion.button>
                                 ) : (
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleRageQuit} disabled={activeAction !== null || !isValidBurnAmount} 
                                       className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold tracking-[0.1em] uppercase rounded-2xl transition-all flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 font-sans">
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
               <div className="w-full md:w-[400px] pointer-events-auto bg-white border border-[#D6D3C0] p-6 rounded-[1.5rem] shadow-2xl flex gap-4 items-start relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${toast.type === 'SUCCESS' ? 'bg-emerald-600' : 'bg-red-600'}`}></div>
                  <div className={`mt-1 p-2 rounded-full ${toast.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                     {toast.type === 'SUCCESS' ? <CheckCircle size={20}/> : <ShieldAlert size={20}/>}
                  </div>
                  <div className="flex-1">
                     <h4 className="text-sm font-bold text-black mb-1 tracking-wide font-sans">{toast.message}</h4>
                     <p className="text-xs text-stone-600 leading-relaxed mb-3 font-medium">{toast.subMessage}</p>
                     {toast.hash && (
                        <a href={`https://sepolia.etherscan.io/tx/${toast.hash}`} target="_blank" className="inline-flex items-center gap-2 text-[10px] font-bold text-stone-500 hover:text-black uppercase tracking-wider transition-colors font-sans">
                           View on Explorer <ExternalLink size={10}/>
                        </a>
                     )}
                  </div>
                  <button onClick={() => setToast(null)} className="text-stone-400 hover:text-black transition-colors"><X size={18}/></button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </SessionGuard>
  );
}