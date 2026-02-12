'use client';


import { useState, useEffect, useRef } from 'react';
import { 
  Shield, ArrowLeft, Loader2, Zap, Activity, 
  CheckCircle, AlertCircle, ShieldAlert, LogOut, 
  Hexagon, Lock, Unlock, Users, Crosshair, 
  X, AlertTriangle, ChevronRight, ExternalLink, 
  Globe, Fingerprint, RefreshCcw, Network, Server, Skull, Key,
  ShieldCheck 
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
import { keccak256, toBytes } from 'viem';
import { 
  CONTRACT_ADDRESSES, 
  ROLE_MANAGER_ABI, 
  EMERGENCY_PAUSE_ABI, 
  VETO_COUNCIL_ABI 
} from '@/config/constants';

const ROLES = {
  ADMIN: "0x0000000000000000000000000000000000000000000000000000000000000000",
  GUARDIAN: keccak256(toBytes("GUARDIAN_ROLE")),
  EXECUTOR: keccak256(toBytes("EXECUTOR_ROLE"))
};

type ToastState = { type: 'SUCCESS' | 'ERROR'; message: string; subMessage?: string; hash?: string; } | null;

export default function GuardianMatrix() {
  const { isConnected, address } = useAccount();
  const { switchChain } = useSwitchChain(); 
  
  const mainRef = useRef<HTMLDivElement | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: -1000, y: -1000 });
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<ToastState>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'DEFENSE' | 'ACCESS' | 'VETO'>('DEFENSE');
  
  const [activeAction, setActiveAction] = useState<'PAUSE' | 'UNPAUSE' | 'GRANT' | 'REVOKE' | 'VETO' | 'SELF_GRANT' | null>(null);

  const [targetAddress, setTargetAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState<'GUARDIAN' | 'EXECUTOR'>('GUARDIAN');
  const [proposalId, setProposalId] = useState('');

  useEffect(() => {
    setIsMounted(true);
    const handleMouseMove = (e: MouseEvent) => setCursorPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!mainRef.current) return;
      const scrolled = (mainRef.current.scrollTop / (mainRef.current.scrollHeight - mainRef.current.clientHeight)) * 100;
      setProgress(scrolled);
    };
    mainRef.current?.addEventListener("scroll", handleScroll);
    return () => mainRef.current?.removeEventListener("scroll", handleScroll);
  }, []);

  // --- CONTRACT READS ---
  const pollConfig = { refetchInterval: 10000, enabled: !!address };

  const { data: isAdmin, refetch: refetchAdmin } = useReadContract({ address: CONTRACT_ADDRESSES.ROLE_MANAGER as `0x${string}`, abi: ROLE_MANAGER_ABI, functionName: 'isAdmin', args: address ? [address] : undefined, ...pollConfig });
  const { data: isGuardian, refetch: refetchGuardian } = useReadContract({ address: CONTRACT_ADDRESSES.ROLE_MANAGER as `0x${string}`, abi: ROLE_MANAGER_ABI, functionName: 'isGuardian', args: address ? [address] : undefined, ...pollConfig });
  const { data: isPaused, refetch: refetchPauseState } = useReadContract({ address: CONTRACT_ADDRESSES.EMERGENCY_PAUSE as `0x${string}`, abi: EMERGENCY_PAUSE_ABI, functionName: 'isPaused', ...pollConfig });

  const hasAccess = isAdmin || isGuardian;

  const { writeContract: executeWrite, data: txHash, error: txError, reset: resetTx } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (txHash) setToast({ type: 'SUCCESS', message: 'Command Dispatched', subMessage: 'Awaiting high-priority network confirmation...', hash: txHash });
  }, [txHash]);

  useEffect(() => {
    if (isConfirmed) {
      if (activeAction === 'PAUSE') setToast({ type: 'SUCCESS', message: 'PROTOCOL PAUSED', subMessage: 'Emergency Kill Switch Activated successfully.', hash: txHash });
      else if (activeAction === 'UNPAUSE') setToast({ type: 'SUCCESS', message: 'PROTOCOL RESTORED', subMessage: 'System functions have been unpaused.', hash: txHash });
      else if (activeAction === 'GRANT' || activeAction === 'SELF_GRANT') setToast({ type: 'SUCCESS', message: 'Clearance Granted', subMessage: 'Role successfully assigned. Access elevated.', hash: txHash });
      else if (activeAction === 'REVOKE') setToast({ type: 'SUCCESS', message: 'Clearance Revoked', subMessage: 'Role successfully removed from target address.', hash: txHash });
      else if (activeAction === 'VETO') setToast({ type: 'SUCCESS', message: 'Proposal Vetoed', subMessage: 'Malicious proposal has been terminated.', hash: txHash });
      
      setActiveAction(null); setTargetAddress(''); setProposalId(''); resetTx();
      setTimeout(() => { refetchPauseState(); refetchAdmin(); refetchGuardian(); }, 3500); 
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (txError) {
      setToast({ type: 'ERROR', message: 'Command Rejected', subMessage: (txError as any)?.shortMessage || 'The security request was denied or failed.' });
      setActiveAction(null); resetTx();
    }
  }, [txError]);

  const handlePauseToggle = (pauseSystem: boolean) => {
    if (!address || !isGuardian) return; 
    setActiveAction(pauseSystem ? 'PAUSE' : 'UNPAUSE');
    executeWrite({ address: CONTRACT_ADDRESSES.EMERGENCY_PAUSE as `0x${string}`, abi: EMERGENCY_PAUSE_ABI, functionName: pauseSystem ? 'pause' : 'unpause' });
  };

  const handleRoleUpdate = (grant: boolean) => {
    if (!address || !isAdmin || !targetAddress) return;
    setActiveAction(grant ? 'GRANT' : 'REVOKE');
    const roleHash = selectedRole === 'GUARDIAN' ? ROLES.GUARDIAN : ROLES.EXECUTOR;
    executeWrite({ address: CONTRACT_ADDRESSES.ROLE_MANAGER as `0x${string}`, abi: ROLE_MANAGER_ABI, functionName: grant ? 'grantRole' : 'revokeRole', args: [roleHash, targetAddress as `0x${string}`] });
  };

  const handleSelfGrantGuardian = () => {
    if (!address || !isAdmin) return;
    setActiveAction('SELF_GRANT');
    executeWrite({ address: CONTRACT_ADDRESSES.ROLE_MANAGER as `0x${string}`, abi: ROLE_MANAGER_ABI, functionName: 'grantRole', args: [ROLES.GUARDIAN, address as `0x${string}`] });
  };

  const handleVeto = () => {
    if (!address || !isGuardian || !proposalId) return;
    setActiveAction('VETO');
    executeWrite({ address: CONTRACT_ADDRESSES.VETO_COUNCIL as `0x${string}`, abi: VETO_COUNCIL_ABI, functionName: 'castVeto', args: [BigInt(proposalId)] });
  };

  if (!isMounted) return null;

  if (isConnected && !hasAccess) {
      return (
          <div className="h-screen w-full bg-[#05050a] flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
             <div className="absolute inset-0 bg-red-900/10 blur-[150px] pointer-events-none"></div>
             <ShieldAlert size={80} className="text-red-500 mb-6 animate-pulse"/>
             <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">ACCESS DENIED</h1>
             <p className="text-slate-400 text-sm md:text-base font-light max-w-md leading-relaxed">Your cryptographic identity does not hold GUARDIAN or ADMIN clearance. Intrusion attempts are monitored and logged.</p>
             <Link href="/dashboard" className="mt-10 px-8 py-4 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-2xl font-bold uppercase tracking-widest transition-all">Return to Safe Zone</Link>
          </div>
      );
  }

  return (
    <div className="min-h-screen w-full bg-[#05050a] text-slate-200 font-sans flex flex-col relative selection:bg-red-500/30">
      
      <div className="fixed inset-0 z-0 bg-[#05050a] pointer-events-none"></div>
      <div className={`fixed top-[-10%] right-[-5%] w-[300px] md:w-[700px] h-[300px] md:h-[700px] rounded-full blur-[140px] pointer-events-none transition-colors duration-1000 ${isPaused ? 'bg-red-600/10' : 'bg-blue-500/10'}`}></div>
      <div className={`fixed bottom-[-10%] left-[-5%] w-[300px] md:w-[700px] h-[300px] md:h-[700px] rounded-full blur-[140px] pointer-events-none transition-colors duration-1000 ${isPaused ? 'bg-orange-600/10' : 'bg-purple-500/10'}`}></div>
      
      <div className="fixed top-0 right-0 w-1 md:w-[2px] h-full bg-white/5 z-[100]">
        <div className={`w-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(239,68,68,0.5)] ${isPaused ? 'bg-gradient-to-b from-red-500 via-orange-500 to-red-500' : 'bg-gradient-to-b from-blue-400 via-purple-500 to-blue-400'}`} style={{ height: `${progress}%` }} />
      </div>

      <nav className="border-b border-white/5 bg-[#05050a]/90 backdrop-blur-xl z-50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 w-full flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm font-medium">
              <ArrowLeft size={20} /> <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
            <div className="h-8 w-px bg-white/10 hidden md:block"></div>
            <div className="flex items-center gap-3">
               <ShieldAlert className={isPaused ? "text-red-500 animate-pulse" : "text-blue-400"} size={28} />
               <span className="font-bold text-white text-lg md:text-xl tracking-tight">Defense Matrix</span>
            </div>
          </div>
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </nav>

      <main ref={mainRef} className="flex-1 overflow-y-auto custom-scroll relative pb-32 p-4 md:p-12 z-10">
        <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
          
          <div>
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full animate-pulse shadow-lg ${isPaused ? 'bg-red-500 shadow-red-500' : 'bg-green-500 shadow-green-500'}`}></div>
                <span className={`text-xs md:text-sm font-bold uppercase tracking-widest ${isPaused ? 'text-red-500' : 'text-green-500'}`}>
                    {isPaused ? 'CRITICAL: SYSTEM PAUSED' : 'SYSTEM SECURE & OPERATIONAL'}
                </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-4">Guardian Console</h1>
            <p className="text-slate-400 text-base md:text-lg max-w-2xl leading-relaxed font-light">
              Restricted Area. Exercise extreme caution. Commands executed here override standard governance delays and affect the entire protocol architecture.
            </p>
          </div>

          <div className="bg-slate-900/40 p-6 md:p-10 border border-white/5 rounded-[2rem] md:rounded-[2.5rem] flex flex-col md:flex-row justify-between gap-8 backdrop-blur-md shadow-lg">
              <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Fingerprint size={18} className="text-blue-400"/> Authenticated Identity
                  </h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-4">
                        {isConnected ? (
                        <>
                            {isAdmin && <span className="px-5 md:px-6 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs md:text-sm font-bold rounded-xl flex items-center gap-2"><RefreshCcw size={16}/> MASTER ADMIN</span>}
                            {isGuardian && <span className="px-5 md:px-6 py-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs md:text-sm font-bold rounded-xl flex items-center gap-2"><Shield size={16}/> VETO GUARDIAN</span>}
                        </>
                        ) : <span className="text-sm text-slate-500 font-medium">Wallet Not Connected</span>}
                    </div>
                    
                    {isAdmin && !isGuardian && (
                        <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                            <div className="flex items-start gap-3 text-orange-400">
                                <AlertTriangle size={20} className="shrink-0 mt-0.5"/>
                                <div>
                                    <h4 className="text-sm font-bold uppercase tracking-wider mb-1">Missing Guardian Clearance</h4>
                                    <p className="text-xs font-light text-orange-400/80">You have Admin rights, but you need Guardian rights to use the Kill Switch and Veto Council.</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleSelfGrantGuardian}
                                disabled={activeAction !== null}
                                className="shrink-0 px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                                {activeAction === 'SELF_GRANT' ? <Loader2 size={16} className="animate-spin"/> : <Key size={16}/>} Grant Myself Access
                            </button>
                        </div>
                    )}
                  </div>
              </div>
              <div className="bg-black/30 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 min-w-[280px] shadow-inner flex flex-col justify-center">
                  <p className="text-sm font-semibold text-slate-500 uppercase mb-2 tracking-wide">Network State</p>
                  {isPaused ? (
                     <p className="text-3xl md:text-4xl font-black text-red-500 tracking-tight flex items-center gap-3"><Lock size={32}/> HALTED</p>
                  ) : (
                     <p className="text-3xl md:text-4xl font-black text-green-400 tracking-tight flex items-center gap-3"><Unlock size={32}/> ACTIVE</p>
                  )}
              </div>
          </div>

          <div className="flex gap-4 md:gap-8 mb-8 border-b border-white/5 pb-px overflow-x-auto custom-scroll">
              {[
                  { id: 'DEFENSE', label: 'Kill Switch', icon: Zap },
                  { id: 'ACCESS', label: 'Role Manager', icon: Users },
                  { id: 'VETO', label: 'Veto Council', icon: Crosshair }
              ].map((tab) => (
                  <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`text-xs md:text-sm font-bold uppercase tracking-wider transition-all pb-4 border-b-2 flex items-center gap-2 whitespace-nowrap ${
                      activeTab === tab.id ? 'text-white border-white' : 'text-slate-500 border-transparent hover:text-slate-300'
                  }`}
                  >
                  <tab.icon size={16} className={activeTab === tab.id ? (tab.id === 'DEFENSE' ? 'text-red-500' : 'text-blue-400') : ''}/> {tab.label}
                  </button>
              ))}
          </div>

          <div className="min-h-[400px]">
             
             {activeTab === 'DEFENSE' && (
                <div className="bg-red-950/10 p-6 md:p-12 border border-red-500/20 rounded-[2rem] md:rounded-[3rem] relative shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full pointer-events-none"></div>
                   
                   <div className="flex flex-col lg:flex-row justify-between gap-10 relative z-10">
                      <div className="max-w-2xl space-y-6">
                         <div className="flex items-center gap-4">
                            <Skull size={32} className="text-red-500"/>
                            <h3 className="text-2xl md:text-3xl font-bold text-red-400 tracking-tight">Emergency Kill Switch</h3>
                         </div>
                         <p className="text-base md:text-lg text-slate-400 leading-relaxed font-light">
                            Activating the kill switch will instantly halt all state-mutating functions across the protocol. Use ONLY during an active exploit. Requires GUARDIAN role.
                         </p>
                         
                         <div className="bg-black/40 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-red-500/10 shadow-inner">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Current Status</h4>
                            {isPaused ? (
                               <div className="text-red-500 flex items-center gap-3 font-mono font-bold text-base md:text-lg"><AlertTriangle/> PROTOCOL IS CURRENTLY FROZEN</div>
                            ) : (
                               <div className="text-green-500 flex items-center gap-3 font-mono font-bold text-base md:text-lg"><CheckCircle/> PROTOCOL IS RUNNING NORMALLY</div>
                            )}
                         </div>
                      </div>

                      <div className="w-full lg:w-auto flex flex-col justify-center">
                         <ConnectButton.Custom>
                            {({ account, chain, openConnectModal, mounted }) => {
                                const connected = mounted && account && chain;
                                const wrongNetwork = connected && chain.id !== 11155111;

                                if (!connected || wrongNetwork) return <button onClick={() => !connected ? openConnectModal() : switchChain({ chainId: 11155111 })} className="w-full md:w-[320px] py-6 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-sm transition-all shadow-md">Connect Wallet</button>;
                                if (!isGuardian) return <div className="w-full md:w-[320px] py-6 bg-slate-900 text-slate-500 text-center rounded-2xl font-bold text-xs uppercase tracking-widest border border-white/5">Guardian Role Required</div>;

                                return (
                                    <div className="flex flex-col gap-4 w-full md:w-[320px]">
                                       {isPaused ? (
                                          <button onClick={() => handlePauseToggle(false)} disabled={activeAction !== null} className="w-full py-6 bg-green-600/20 hover:bg-green-600/30 text-green-500 border border-green-500/30 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all flex justify-center items-center gap-3 disabled:opacity-50">
                                              {activeAction === 'UNPAUSE' ? <Loader2 className="animate-spin" size={20}/> : <Unlock size={20}/>} {activeAction === 'UNPAUSE' ? "RESTORING..." : "UNPAUSE PROTOCOL"}
                                          </button>
                                       ) : (
                                          <button onClick={() => handlePauseToggle(true)} disabled={activeAction !== null} className="w-full py-6 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm tracking-widest uppercase transition-all flex justify-center items-center gap-3 shadow-[0_0_40px_rgba(239,68,68,0.4)] disabled:opacity-50">
                                              {activeAction === 'PAUSE' ? <Loader2 className="animate-spin" size={20}/> : <Lock size={20}/>} {activeAction === 'PAUSE' ? "FREEZING..." : "ACTIVATE KILL SWITCH"}
                                          </button>
                                       )}
                                    </div>
                                );
                            }}
                         </ConnectButton.Custom>
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'ACCESS' && (
                <div className="bg-slate-900/30 p-6 md:p-12 border border-blue-500/20 rounded-[2rem] md:rounded-[3rem] relative shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>
                   
                   {!isAdmin ? (
                      <div className="text-center py-20">
                         <ShieldAlert size={60} className="mx-auto text-slate-600 mb-6"/>
                         <h3 className="text-2xl font-bold text-white mb-2">Master Admin Required</h3>
                         <p className="text-slate-400 font-light">Only the Master Admin can grant or revoke protocol roles.</p>
                      </div>
                   ) : (
                      <div className="flex flex-col lg:flex-row justify-between gap-10 relative z-10">
                         <div className="max-w-xl space-y-6">
                            <h3 className="text-2xl md:text-3xl font-bold text-blue-400 tracking-tight flex items-center gap-3">
                               <Users size={32}/> Access Control Center
                            </h3>
                            <p className="text-base text-slate-400 leading-relaxed font-light">
                               Assign elevated cryptographic privileges to trusted addresses. Guardians can pause the protocol and veto proposals.
                            </p>
                            
                            <div className="space-y-6 pt-4">
                               <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Target Address</label>
                                  <input type="text" placeholder="0x..." value={targetAddress} onChange={(e) => setTargetAddress(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-lg outline-none focus:border-blue-500/50 transition-all font-mono shadow-inner" />
                               </div>
                               <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Select Clearance Level</label>
                                  <div className="flex gap-4">
                                     <button onClick={() => setSelectedRole('GUARDIAN')} className={`flex-1 py-4 rounded-2xl font-bold text-xs md:text-sm tracking-widest uppercase transition-all border ${selectedRole === 'GUARDIAN' ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-black/40 border-white/5 text-slate-500 hover:bg-white/5'}`}>Veto Guardian</button>
                                     <button onClick={() => setSelectedRole('EXECUTOR')} className={`flex-1 py-4 rounded-2xl font-bold text-xs md:text-sm tracking-widest uppercase transition-all border ${selectedRole === 'EXECUTOR' ? 'bg-orange-500/20 border-orange-500/50 text-orange-300' : 'bg-black/40 border-white/5 text-slate-500 hover:bg-white/5'}`}>Executor</button>
                                  </div>
                               </div>
                            </div>
                         </div>

                         <div className="w-full lg:w-auto flex flex-col justify-end gap-4">
                            <button onClick={() => handleRoleUpdate(true)} disabled={activeAction !== null || !targetAddress} className="w-full md:w-[320px] py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm tracking-widest uppercase transition-all flex justify-center items-center gap-3 disabled:opacity-50 shadow-lg">
                                {activeAction === 'GRANT' ? <Loader2 className="animate-spin" size={20}/> : <ShieldCheck size={20}/>} GRANT CLEARANCE
                            </button>
                            <button onClick={() => handleRoleUpdate(false)} disabled={activeAction !== null || !targetAddress} className="w-full md:w-[320px] py-6 bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-400 border border-transparent hover:border-red-500/30 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all flex justify-center items-center gap-3 disabled:opacity-50">
                                {activeAction === 'REVOKE' ? <Loader2 className="animate-spin" size={20}/> : <X size={20}/>} REVOKE CLEARANCE
                            </button>
                         </div>
                      </div>
                   )}
                </div>
             )}

             {activeTab === 'VETO' && (
                <div className="bg-slate-900/30 p-6 md:p-12 border border-orange-500/20 rounded-[2rem] md:rounded-[3rem] relative shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 blur-[100px] rounded-full pointer-events-none"></div>
                   
                   {!isGuardian ? (
                      <div className="text-center py-20">
                         <Crosshair size={60} className="mx-auto text-slate-600 mb-6"/>
                         <h3 className="text-2xl font-bold text-white mb-2">Veto Power Restricted</h3>
                         <p className="text-slate-400 font-light">Only authorized Guardians can terminate malicious proposals.</p>
                      </div>
                   ) : (
                      <div className="flex flex-col lg:flex-row justify-between gap-10 relative z-10">
                         <div className="max-w-xl space-y-6">
                            <h3 className="text-2xl md:text-3xl font-bold text-orange-400 tracking-tight flex items-center gap-3">
                               <Crosshair size={32}/> Veto Council Authority
                            </h3>
                            <p className="text-base text-slate-400 leading-relaxed font-light">
                               If a proposal threatens the integrity of the DAO, Guardians can unilaterally cancel it. Input the Proposal ID to terminate.
                            </p>
                            
                            <div className="space-y-4 pt-4">
                               <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Target Proposal ID</label>
                                  <input type="number" placeholder="e.g. 1152003..." value={proposalId} onChange={(e) => setProposalId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-lg outline-none focus:border-orange-500/50 transition-all font-mono shadow-inner" />
                               </div>
                            </div>
                         </div>

                         <div className="w-full lg:w-auto flex flex-col justify-end">
                            <button onClick={handleVeto} disabled={activeAction !== null || !proposalId} className="w-full md:w-[320px] py-6 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-bold text-sm tracking-widest uppercase transition-all flex justify-center items-center gap-3 disabled:opacity-50 shadow-[0_0_40px_rgba(249,115,22,0.3)]">
                                {activeAction === 'VETO' ? <Loader2 className="animate-spin" size={20}/> : <Zap size={20}/>} EXECUTE VETO STRIKE
                            </button>
                         </div>
                      </div>
                   )}
                </div>
             )}

          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[2000] animate-in slide-in-from-right duration-300 w-[calc(100%-3rem)] md:w-auto">
           <div className={`flex items-start gap-4 md:gap-6 p-6 md:p-8 rounded-3xl border backdrop-blur-2xl shadow-2xl md:max-w-md bg-[#08080f]/95 ${
              toast.type === 'SUCCESS' ? 'border-green-500/30' : 'border-red-500/30'
           }`}>
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg ${toast.type === 'SUCCESS' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                 {toast.type === 'SUCCESS' ? <CheckCircle size={24} className="md:w-6 md:h-6"/> : <AlertCircle size={24} className="md:w-6 md:h-6"/>}
              </div>
              <div className="flex-1 mt-1">
                 <h4 className={`text-sm md:text-base font-bold uppercase tracking-widest mb-1 md:mb-2 ${toast.type === 'SUCCESS' ? 'text-green-400' : 'text-red-400'}`}>
                    {toast.message}
                 </h4>
                 <p className="text-xs md:text-sm text-slate-400 leading-relaxed mb-4 md:mb-5 font-light">{toast.subMessage}</p>
                 {toast.hash && (
                   <a href={`https://sepolia.etherscan.io/tx/${toast.hash}`} target="_blank" className="inline-flex items-center gap-2 text-[10px] md:text-xs font-bold text-green-400 uppercase tracking-widest hover:underline bg-green-500/10 px-4 py-2 md:px-5 md:py-2.5 rounded-xl border border-green-500/20 transition-all hover:bg-green-500/20">
                     <ExternalLink size={14} className="md:w-4 md:h-4"/> View Logs
                   </a>
                 )}
              </div>
              <button onClick={() => setToast(null)} className="text-slate-600 hover:text-white transition-colors p-1 md:p-2 bg-white/5 rounded-full mt-[-5px] mr-[-5px]"><X size={16} className="md:w-5 md:h-5"/></button>
           </div>
        </div>
      )}
    </div>
  );
}