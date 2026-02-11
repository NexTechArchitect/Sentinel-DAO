'use client';

/**
 * SENTINEL PROTOCOL - DASHBOARD (PREMIUM 4K UI + SESSION GUARD)
 * Clean, Readable, Mobile-Optimized & Fully Functional
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Shield, ArrowLeft, Loader2, Zap, Activity, 
  CheckCircle, AlertCircle, ShieldAlert, LogOut, 
  Hexagon, BarChart3, Wifi, Key, FileSignature, 
  X, ChevronRight, ExternalLink, Globe, Fingerprint, 
  RefreshCcw, ShieldCheck
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
import { 
  CONTRACT_ADDRESSES, GOV_TOKEN_EXTENDED_ABI, 
  ROLE_MANAGER_ABI, GOV_ANALYTICS_ABI, 
  RAGE_QUIT_ABI, TREASURY_ABI, CHAINLINK_ABI,
  DELEGATION_REGISTRY_ABI, OFFCHAIN_EXECUTOR_ABI, ERC20_ABI
} from '@/config/constants';
import { SessionGuard } from '@/components/SessionGuard'; // NEW: Imported SessionGuard

// =====================================================
// EIP-712 DOMAIN CONFIGURATION (FIXED FROM DEPLOY SCRIPT)
// =====================================================
const EIP712_DOMAIN_NAME = "DAO Delegation"; 
const EIP712_DOMAIN_VERSION = "1";

type ToastState = { 
  type: 'SUCCESS' | 'ERROR'; 
  message: string; 
  subMessage?: string; 
  hash?: string; 
} | null;

export default function Dashboard() {
  const { isConnected, address } = useAccount();
  const { switchChain } = useSwitchChain(); 
  
  // --- UI & Input States ---
  const mainRef = useRef<HTMLDivElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement>(null); // NEW: High-perf spotlight
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<ToastState>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isHoveringCards, setIsHoveringCards] = useState(false); // NEW: Hide spotlight on hover
  
  // Input fields
  const [delegateeAddress, setDelegateeAddress] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  
  // Explicit action tracking
  const [activeAction, setActiveAction] = useState<'APPROVE' | 'RAGEQUIT' | 'DELEGATE' | null>(null);

  // Background cursor glow (High-Performance DOM Update)
  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Scroll Progress
  useEffect(() => {
    const handleScroll = () => {
      if (!mainRef.current) return;
      const scrolled = (mainRef.current.scrollTop / (mainRef.current.scrollHeight - mainRef.current.clientHeight)) * 100;
      setProgress(scrolled);
    };
    mainRef.current?.addEventListener("scroll", handleScroll);
    return () => mainRef.current?.removeEventListener("scroll", handleScroll);
  }, []);

  // =====================================================
  // 1. DATA FETCHING (ON-CHAIN)
  // =====================================================
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
  const { data: offchainSigner } = useReadContract({ address: CONTRACT_ADDRESSES.OFFCHAIN_EXECUTOR as `0x${string}`, abi: OFFCHAIN_EXECUTOR_ABI, functionName: 'signer', query: { refetchInterval: 15000 } });

  // Value formatting
  const ethPrice = ethPriceData ? Number((ethPriceData as any)[1]) / 10**8 : 0;
  const tEth = treasuryEth ? parseFloat(formatEther(treasuryEth as bigint)) : 0;
  const totalProposals = govStats ? Number((govStats as any)[0]) : 0;
  const successProposals = govStats ? Number((govStats as any)[1]) : 0;
  const failedProposals = govStats ? Number((govStats as any)[2]) : 0;
  
  const myDiso = disoBalance ? parseFloat(formatEther(disoBalance as bigint)) : 0;
  const totalDiso = totalSupply ? parseFloat(formatEther(totalSupply as bigint)) : 1; 
  
  // Logic for Dynamic Burn Approval
  const parsedBurnAmount = burnAmount ? parseEther(burnAmount) : BigInt(0);
  const isApprovedForRQ = rqAllowance !== undefined && (rqAllowance as bigint) >= parsedBurnAmount && parsedBurnAmount > BigInt(0);
  const isValidBurnAmount = parsedBurnAmount > BigInt(0) && disoBalance !== undefined && parsedBurnAmount <= (disoBalance as bigint);

  // Dynamic preview for the ETH the user will get based on their typed amount
  const previewBurnAmount = burnAmount ? parseFloat(burnAmount) : 0;
  const dynamicEstimatedEth = totalDiso > 0 ? (previewBurnAmount * tEth) / totalDiso : 0;
  const dynamicEstimatedUsd = dynamicEstimatedEth * ethPrice;

  // =====================================================
  // 2. TRANSACTIONS & SIGNATURES
  // =====================================================
  const { writeContract: executeWrite, data: txHash, error: txError, reset: resetTx } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });
  const { signTypedDataAsync } = useSignTypedData();

  useEffect(() => {
    if (txHash) setToast({ type: 'SUCCESS', message: 'Transaction Sent', subMessage: 'Awaiting network confirmation...', hash: txHash });
  }, [txHash]);

  useEffect(() => {
    if (isConfirmed) {
      if (activeAction === 'APPROVE') setToast({ type: 'SUCCESS', message: 'Step 1 Complete: Approved', subMessage: 'Tokens approved. You can now execute the Burn.', hash: txHash });
      else if (activeAction === 'RAGEQUIT') {
        setToast({ type: 'SUCCESS', message: 'Tokens Burned Successfully', subMessage: 'Rage Quit executed. ETH has been sent to your wallet.', hash: txHash });
        setBurnAmount('');
      } else if (activeAction === 'DELEGATE') {
        setToast({ type: 'SUCCESS', message: 'Delegation Successful', subMessage: 'Your signature was relayed and verified on-chain.', hash: txHash });
      }
      setActiveAction(null);
      setTimeout(() => { refetchRQ(); refetchNonce(); refetchAllowance(); refetchBalance(); }, 3500); 
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (txError) {
      setToast({ type: 'ERROR', message: 'Transaction Failed', subMessage: (txError as any)?.shortMessage || 'The request was rejected or failed on-chain.' });
      setActiveAction(null);
      resetTx();
    }
  }, [txError]);

  // =====================================================
  // 3. EVENT HANDLERS
  // =====================================================

  const handleApproveRQ = () => {
    if (!address || !isValidBurnAmount) return;
    setActiveAction('APPROVE');
    executeWrite({
      address: CONTRACT_ADDRESSES.GOV_TOKEN as `0x${string}`,
      abi: ERC20_ABI, 
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.RAGE_QUIT as `0x${string}`, maxUint256], 
    });
  };

  const handleRageQuit = () => {
    if (!address || !isValidBurnAmount || !isApprovedForRQ) return;
    setActiveAction('RAGEQUIT');
    executeWrite({
      address: CONTRACT_ADDRESSES.RAGE_QUIT as `0x${string}`,
      abi: RAGE_QUIT_ABI, 
      functionName: 'quit',
      args: [["0x0000000000000000000000000000000000000000"], parsedBurnAmount],
    });
  };

  const handleGaslessDelegation = async () => {
    if (!address || !delegateeAddress || currentNonce === undefined) return;
    try {
      setActiveAction('DELEGATE');
      const deadline = Math.floor(Date.now() / 1000) + 3600; 
      
      const domain = {
        name: EIP712_DOMAIN_NAME,
        version: EIP712_DOMAIN_VERSION,
        chainId: 11155111,
        verifyingContract: CONTRACT_ADDRESSES.DELEGATION_REGISTRY as `0x${string}`
      };

      const types = {
        Delegation: [
            { name: "delegator", type: "address" },
            { name: "delegatee", type: "address" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" }
        ]
      };

      const message = {
        delegator: address,
        delegatee: delegateeAddress as `0x${string}`,
        nonce: BigInt(currentNonce ? currentNonce.toString() : "0"),
        deadline: BigInt(deadline)
      };

      const signature = await signTypedDataAsync({ domain, types, primaryType: 'Delegation', message });

      executeWrite({
        address: CONTRACT_ADDRESSES.DELEGATION_REGISTRY as `0x${string}`,
        abi: DELEGATION_REGISTRY_ABI, 
        functionName: 'delegateBySig',
        args: [address, delegateeAddress as `0x${string}`, BigInt(currentNonce ? currentNonce.toString() : "0"), BigInt(deadline), signature],
      });
    } catch (err: any) {
      setToast({ type: 'ERROR', message: 'Signature Rejected', subMessage: err.shortMessage || 'You denied the signing request.' });
      setActiveAction(null);
    }
  };

  if (!isMounted) return null;

  return (
    <SessionGuard requireSession={true}>
      <div className="min-h-screen w-full bg-[#05050a] text-slate-200 font-sans flex flex-col relative selection:bg-blue-500/30">
        
        {/* PREMIUM AMBIENT BACKGROUND */}
        <div className="fixed inset-0 z-0 bg-[#05050a] pointer-events-none"></div>
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
        
        {/* Scroll Progress Bar */}
        <div className="fixed top-0 right-0 w-1 md:w-[2px] h-full bg-white/5 z-[100]">
          <div className="bg-gradient-to-b from-blue-400 via-purple-500 to-blue-400 w-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(96,165,250,0.5)]" 
                style={{ height: `${progress}%` }} />
        </div>

        {/* Top Navbar */}
        <nav className="border-b border-white/5 bg-[#05050a]/80 backdrop-blur-2xl z-50 sticky top-0 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 w-full flex items-center justify-between">
            <div className="flex items-center gap-4 md:gap-6">
              <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm font-bold tracking-widest uppercase">
                <ArrowLeft size={16} /> <span className="hidden sm:inline">Terminal</span>
              </Link>
              <div className="h-8 w-px bg-white/10 hidden md:block"></div>
              <div className="flex items-center gap-3">
                 <ShieldCheck className="text-blue-400" size={24} />
                 <span className="font-black text-white text-lg md:text-xl tracking-tight uppercase italic">Dashboard</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold text-green-400 tracking-widest uppercase">Identity Secured</span>
              </div>
              <ConnectButton showBalance={false} chainStatus="icon" />
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main ref={mainRef} className="flex-1 overflow-y-auto custom-scroll relative pb-32 p-4 md:p-12 z-10">
          <div 
            className="max-w-6xl mx-auto space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700"
            onMouseEnter={() => setIsHoveringCards(true)}
            onMouseLeave={() => setIsHoveringCards(false)}
          >
            
            {/* Header Section */}
            <div className="mb-12 border-l-4 border-blue-600 pl-6">
              <h1 className="text-5xl font-black tracking-tighter text-white italic uppercase drop-shadow-2xl">
                Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Center</span>
              </h1>
              <p className="text-slate-400 font-mono text-sm mt-2 uppercase tracking-widest flex items-center gap-2">
                <Activity size={14} className="text-blue-500 animate-pulse"/> Review your governance identity & holdings
              </p>
            </div>

            {/* 1. Profile Matrix */}
            <div className="bg-slate-900/40 p-6 md:p-10 border border-white/5 rounded-3xl md:rounded-[2.5rem] flex flex-col md:flex-row justify-between gap-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[50px] group-hover:bg-blue-500/10 transition-all duration-700"></div>
                
                <div className="space-y-4 relative z-10">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <ShieldAlert size={18} className="text-blue-400"/> Current Access Level
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {isConnected ? (
                        <>
                          {isAdmin && <span className="px-5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.15)]"><RefreshCcw size={16}/> Admin Override</span>}
                          {isGuardian && <span className="px-5 py-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-bold uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.15)]"><Fingerprint size={16}/> Veto Guardian</span>}
                          {!isAdmin && !isGuardian && <span className="px-5 py-2.5 bg-slate-800 border border-white/10 text-slate-200 text-sm font-bold uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-lg"><Globe size={16}/> Verified Citizen</span>}
                        </>
                      ) : <span className="text-sm text-slate-500 font-medium">Wallet Not Connected</span>}
                    </div>
                </div>
                <div className="bg-black/50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 min-w-[280px] shadow-inner flex flex-col justify-center relative z-10 group-hover:border-blue-500/30 transition-colors">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Available Voting Power</p>
                    <p className="text-4xl md:text-5xl font-black text-white tracking-tight">{myDiso.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
            </div>

            {/* 2. Global Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[
                 { label: "Total Proposals", value: totalProposals, icon: BarChart3, color: "text-blue-400" },
                 { label: "Passed", value: successProposals, icon: CheckCircle, color: "text-green-400" },
                 { label: "Rejected", value: failedProposals, icon: AlertCircle, color: "text-red-400" },
               ].map((stat, i) => (
                 <div key={i} className="bg-slate-900/40 p-8 border border-white/5 rounded-[2rem] shadow-2xl backdrop-blur-xl group hover:-translate-y-1 hover:border-white/10 transition-all">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                      <stat.icon size={16} className={stat.color}/> {stat.label}
                    </p>
                    <h2 className={`text-4xl font-black tracking-tight ${stat.color}`}>{stat.value}</h2>
                 </div>
               ))}
            </div>

            {/* 3. Off-Chain Matrix */}
            <div className="bg-gradient-to-br from-purple-900/20 via-slate-900/30 to-black/40 p-6 md:p-12 border border-purple-500/20 rounded-3xl md:rounded-[3rem] relative overflow-hidden shadow-2xl backdrop-blur-xl">
               <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>
               
               <h3 className="text-2xl md:text-3xl font-black text-purple-300 mb-4 flex items-center gap-3 uppercase italic tracking-tighter">
                  <Wifi size={28}/> Off-Chain Delegation
               </h3>
               <p className="text-slate-400 text-sm mb-10 max-w-2xl leading-relaxed font-light">Sign cryptographic payloads to delegate your voting power securely without paying any network gas fees. Zero friction.</p>

               <div className="grid md:grid-cols-2 gap-8 md:gap-12 relative z-10">
                   <div className="bg-black/40 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 space-y-6 shadow-inner">
                       <div className="flex flex-col gap-2 border-b border-white/5 pb-6">
                           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2"><Key size={14}/> Current Nonce</span>
                           <span className="text-3xl font-black text-white font-mono">{currentNonce !== undefined ? Number(currentNonce) : '0'}</span>
                       </div>
                       <div className="flex flex-col gap-2">
                           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2"><Activity size={14}/> EIP-712 Domain</span>
                           <span className="text-lg font-bold text-slate-300 tracking-wide">{EIP712_DOMAIN_NAME} <span className="text-xs text-slate-500 ml-2 font-mono">(v{EIP712_DOMAIN_VERSION})</span></span>
                       </div>
                   </div>

                   <div className="flex flex-col justify-center space-y-6">
                       <div>
                           <label className="text-[10px] font-bold text-slate-400 mb-3 block uppercase tracking-widest">Delegatee Wallet Address</label>
                           <input type="text" placeholder="0x..." value={delegateeAddress} onChange={(e) => setDelegateeAddress(e.target.value)}
                              className="w-full bg-black/60 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-purple-500/50 transition-all font-mono shadow-inner" />
                       </div>
                       <button onClick={handleGaslessDelegation} disabled={!isConnected || activeAction === 'DELEGATE' || !delegateeAddress}
                          className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-white text-xs tracking-widest uppercase font-black rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                          {activeAction === 'DELEGATE' ? <Loader2 size={18} className="animate-spin"/> : <FileSignature size={18}/>} 
                          {activeAction === 'DELEGATE' ? 'Waiting for Signature...' : 'Sign & Delegate Gasless'}
                       </button>
                   </div>
               </div>
            </div>

            {/* 4. Emergency Exit */}
            <div className="bg-red-950/20 p-6 md:p-12 border border-red-500/20 rounded-3xl md:rounded-[3rem] relative shadow-2xl backdrop-blur-xl">
               <div className="flex flex-col lg:flex-row justify-between gap-10">
                  <div className="max-w-2xl space-y-6">
                     <div className="flex items-center gap-4">
                        <LogOut size={32} className="text-red-500"/>
                        <h3 className="text-2xl md:text-3xl font-black text-red-400 tracking-tighter uppercase italic">Emergency Exit Protocol</h3>
                     </div>
                     <p className="text-sm md:text-base text-slate-400 leading-relaxed font-light">Burn a specific amount of your tokens to withdraw a proportional share of the Treasury's ETH. <strong className="text-slate-200 font-bold">This action cannot be reversed.</strong></p>
                     
                     {hasRageQuit ? (
                        <div className="inline-flex items-center gap-3 px-6 py-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                           <ShieldAlert size={18}/> Protocol Executed. Assets Withdrawn.
                        </div>
                     ) : (
                        <div className="bg-black/50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 inline-block min-w-full md:min-w-[300px] shadow-inner">
                           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Estimated Withdrawal Output</p>
                           <p className="text-4xl md:text-5xl font-black text-white flex items-baseline gap-2 tracking-tight">
                              {dynamicEstimatedEth.toFixed(4)} <span className="text-red-500 text-xl md:text-2xl font-bold">ETH</span>
                           </p>
                           <p className="text-xs text-slate-500 mt-2 font-mono font-medium">≈ ${dynamicEstimatedUsd.toLocaleString(undefined, {minimumFractionDigits: 2})} USD</p>
                        </div>
                     )}
                  </div>

                  <div className="w-full lg:w-auto flex flex-col gap-4 justify-center">
                     <ConnectButton.Custom>
                        {({ account, chain, openConnectModal, mounted }) => {
                            const connected = mounted && account && chain;
                            const wrongNetwork = connected && chain.id !== 11155111;

                            if (!connected || wrongNetwork) return <button onClick={() => !connected ? openConnectModal() : switchChain({ chainId: 11155111 })} className="w-full md:w-[320px] py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs tracking-widest uppercase transition-all shadow-xl">Connect Wallet to Continue</button>;
                            if (hasRageQuit || myDiso === 0) return <div className="w-full md:w-[320px] py-5 bg-slate-900 text-slate-600 rounded-2xl font-black text-xs tracking-widest uppercase text-center border border-white/5 opacity-50">{hasRageQuit ? "ALREADY EXITED" : "ZERO TOKEN BALANCE"}</div>;

                            return (
                                <div className="flex flex-col gap-4 w-full md:w-[320px]">
                                   <div>
                                       <label className="text-[10px] font-bold text-slate-400 mb-3 block uppercase tracking-widest">Amount to Burn</label>
                                       <div className="relative">
                                           <input 
                                              type="number" 
                                              placeholder="0.0" 
                                              value={burnAmount} 
                                              onChange={(e) => setBurnAmount(e.target.value)}
                                              className="w-full bg-black/60 border border-white/10 rounded-2xl py-4 px-5 text-white text-sm outline-none focus:border-red-500/50 transition-all font-mono shadow-inner" 
                                           />
                                           <button 
                                              onClick={() => setBurnAmount(myDiso.toString())}
                                              className="absolute right-3 top-3 px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black tracking-widest uppercase text-slate-300 transition-colors"
                                           >MAX</button>
                                       </div>
                                   </div>

                                   {!isApprovedForRQ ? (
                                      <button onClick={handleApproveRQ} disabled={activeAction !== null || !isValidBurnAmount} className="w-full py-5 bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-500/30 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all flex justify-center items-center gap-3 disabled:opacity-50">
                                          {activeAction === 'APPROVE' ? <Loader2 className="animate-spin" size={16}/> : <ChevronRight size={16}/>} 
                                          {activeAction === 'APPROVE' ? "Approving..." : "Step 1: Approve Max"}
                                      </button>
                                   ) : (
                                      <button onClick={handleRageQuit} disabled={activeAction !== null || !isValidBurnAmount} className="w-full py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all flex justify-center items-center gap-3 shadow-[0_0_30px_rgba(239,68,68,0.3)] disabled:opacity-50">
                                          {activeAction === 'RAGEQUIT' ? <Loader2 className="animate-spin" size={16}/> : <LogOut size={16}/>} 
                                          {activeAction === 'RAGEQUIT' ? "Burning..." : "Step 2: Execute Burn"}
                                      </button>
                                   )}
                                </div>
                            );
                        }}
                     </ConnectButton.Custom>
                     <p className="text-[10px] text-red-500/70 font-bold uppercase tracking-widest text-center max-w-[320px] mx-auto mt-2">Entering an amount will estimate your returns live.</p>
                  </div>
               </div>
            </div>
          </div>
        </main>

        {/* Explorer Linked Toast Notifications */}
        {toast && (
          <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[2000] animate-in slide-in-from-right duration-300 w-[calc(100%-3rem)] md:w-[400px]">
             <div className={`flex items-start gap-4 md:gap-6 p-6 md:p-8 rounded-[2rem] border backdrop-blur-2xl shadow-2xl bg-[#08080f]/95 ${toast.type === 'SUCCESS' ? 'border-blue-500/30' : 'border-red-500/30'}`}>
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'SUCCESS' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                   {toast.type === 'SUCCESS' ? <CheckCircle size={24} className="md:w-7 md:h-7"/> : <AlertCircle size={24} className="md:w-7 md:h-7"/>}
                </div>
                <div className="flex-1 mt-1">
                   <h4 className={`text-xs md:text-sm font-black tracking-widest uppercase mb-1 ${toast.type === 'SUCCESS' ? 'text-blue-400' : 'text-red-400'}`}>{toast.message}</h4>
                   <p className="text-[10px] md:text-xs font-mono text-slate-400 leading-relaxed mb-4">{toast.subMessage}</p>
                   {toast.hash && (
                     <a href={`https://sepolia.etherscan.io/tx/${toast.hash}`} target="_blank" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 transition-all">
                       <ExternalLink size={12}/> View Transaction
                     </a>
                   )}
                </div>
                <button onClick={() => setToast(null)} className="text-slate-600 hover:text-white transition-colors p-1"><X size={16}/></button>
             </div>
          </div>
        )}
      </div>
    </SessionGuard>
  );
}