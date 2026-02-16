'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Shield, ArrowLeft, Loader2, Zap, Activity, 
  CheckCircle, AlertCircle, ShieldAlert, LogOut, 
  Hexagon, Lock, Unlock, Users, Crosshair, 
  X, ExternalLink, Globe, Fingerprint, RefreshCcw, 
  Key, ShieldCheck, AlertTriangle, Skull
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
          <div className="h-screen w-full bg-[#F5F2EB] flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-multiply"></div>
             <ShieldAlert size={80} className="text-red-600 mb-6 animate-pulse"/>
             <h1 className="text-3xl md:text-5xl font-black text-stone-900 uppercase tracking-tight mb-4">ACCESS DENIED</h1>
             <p className="text-stone-600 text-sm md:text-base font-medium max-w-md leading-relaxed mb-10 font-sans">
               Your cryptographic identity does not hold GUARDIAN or ADMIN clearance. 
               Intrusion attempts are logged.
             </p>
             
             {/* Return to Home (Landing Page) */}
             <Link href="/" className="px-8 py-4 bg-stone-900 text-white hover:bg-black rounded-2xl font-bold uppercase tracking-widest transition-all shadow-lg text-xs flex items-center gap-2">
               <ArrowLeft size={16}/> Return to Base
             </Link>
          </div>
      );
  }

  return (
   
    <div className="min-h-screen w-full bg-[#F5F2EB] text-stone-900 font-serif flex flex-col relative selection:bg-red-200">
      
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-multiply pointer-events-none"></div>
      
      {/* Progress Bar */}
      <div className="fixed top-0 right-0 w-1 md:w-[4px] h-full bg-[#E5E0D6] z-[100]">
        <div className={`w-full transition-all duration-300 ease-out ${isPaused ? 'bg-red-600' : 'bg-emerald-600'}`} style={{ height: `${progress}%` }} />
      </div>

      <nav className="border-b border-[#D6D3C0] bg-[#F5F2EB]/95 backdrop-blur-xl z-50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 w-full flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 text-stone-600 hover:text-black transition-all text-sm font-bold uppercase tracking-wider font-sans">
              <ArrowLeft size={18} /> <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
            <div className="h-8 w-px bg-stone-300 hidden md:block"></div>
            <div className="flex items-center gap-3">
               <ShieldAlert className={isPaused ? "text-red-600 animate-pulse" : "text-stone-900"} size={24} strokeWidth={2} />
               <span className="font-black text-black text-lg md:text-xl tracking-tight uppercase font-sans">Defense Matrix</span>
            </div>
          </div>
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </nav>

      <main ref={mainRef} className="flex-1 overflow-y-auto custom-scroll relative pb-32 p-4 md:p-12 z-10">
        <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
          
          <div>
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full animate-pulse shadow-sm border border-black/10 ${isPaused ? 'bg-red-600' : 'bg-emerald-600'}`}></div>
                <span className={`text-xs md:text-sm font-bold uppercase tracking-widest font-sans ${isPaused ? 'text-red-700' : 'text-emerald-800'}`}>
                    {isPaused ? 'CRITICAL: SYSTEM PAUSED' : 'SYSTEM SECURE & OPERATIONAL'}
                </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-black tracking-tighter mb-4 font-sans uppercase">Guardian Console</h1>
            <p className="text-stone-600 text-base md:text-lg max-w-2xl leading-relaxed font-medium font-sans">
              Restricted Area. Commands executed here override standard governance delays. Exercise extreme caution.
            </p>
          </div>

          <div className="bg-white p-6 md:p-10 border border-[#D6D3C0] rounded-[2rem] md:rounded-[2.5rem] flex flex-col md:flex-row justify-between gap-8 shadow-sm">
              <div className="space-y-6">
                  <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2 font-sans">
                     <Fingerprint size={16} className="text-black"/> Authenticated Identity
                  </h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-3 font-sans">
                        {isConnected ? (
                        <>
                            {isAdmin && <span className="px-4 py-2 bg-stone-100 border border-stone-300 text-black text-xs font-bold uppercase rounded-lg flex items-center gap-2 tracking-wider"><RefreshCcw size={14}/> MASTER ADMIN</span>}
                            {isGuardian && <span className="px-4 py-2 bg-stone-100 border border-stone-300 text-black text-xs font-bold uppercase rounded-lg flex items-center gap-2 tracking-wider"><Shield size={14}/> VETO GUARDIAN</span>}
                        </>
                        ) : <span className="text-sm text-stone-500 font-medium">Wallet Not Connected</span>}
                    </div>
                    
                    {isAdmin && !isGuardian && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                            <div className="flex items-start gap-3 text-amber-800">
                                <AlertTriangle size={20} className="shrink-0 mt-0.5"/>
                                <div>
                                    <h4 className="text-sm font-bold uppercase tracking-wider mb-1 font-sans">Missing Guardian Clearance</h4>
                                    <p className="text-xs font-medium text-amber-700/80 font-sans">You have Admin rights, but need Guardian rights for Kill Switch.</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleSelfGrantGuardian}
                                disabled={activeAction !== null}
                                className="shrink-0 px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 shadow-md"
                            >
                                {activeAction === 'SELF_GRANT' ? <Loader2 size={16} className="animate-spin"/> : <Key size={16}/>} Grant Myself Access
                            </button>
                        </div>
                    )}
                  </div>
              </div>
              <div className="bg-[#F5F2EB] p-6 md:p-8 rounded-2xl md:rounded-3xl border border-[#D6D3C0] min-w-[280px] flex flex-col justify-center">
                  <p className="text-xs font-bold text-stone-500 uppercase mb-2 tracking-widest font-sans">Network State</p>
                  {isPaused ? (
                     <p className="text-3xl md:text-4xl font-black text-red-600 tracking-tight flex items-center gap-3 font-sans"><Lock size={32}/> HALTED</p>
                  ) : (
                     <p className="text-3xl md:text-4xl font-black text-emerald-700 tracking-tight flex items-center gap-3 font-sans"><Unlock size={32}/> ACTIVE</p>
                  )}
              </div>
          </div>

          <div className="flex gap-4 md:gap-8 mb-8 border-b border-[#D6D3C0] pb-px overflow-x-auto custom-scroll font-sans">
              {[
                  { id: 'DEFENSE', label: 'Kill Switch', icon: Zap },
                  { id: 'ACCESS', label: 'Role Manager', icon: Users },
                  { id: 'VETO', label: 'Veto Council', icon: Crosshair }
              ].map((tab) => (
                  <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`text-xs md:text-sm font-bold uppercase tracking-wider transition-all pb-4 border-b-2 flex items-center gap-2 whitespace-nowrap ${
                      activeTab === tab.id ? 'text-black border-black' : 'text-stone-500 border-transparent hover:text-stone-800'
                  }`}
                  >
                  <tab.icon size={16} className={activeTab === tab.id ? (tab.id === 'DEFENSE' ? 'text-red-600' : 'text-stone-800') : ''}/> {tab.label}
                  </button>
              ))}
          </div>

          <div className="min-h-[400px]">
              
              {activeTab === 'DEFENSE' && (
                 <div className="bg-red-50 p-6 md:p-12 border border-red-100 rounded-[2rem] md:rounded-[3rem] relative shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col lg:flex-row justify-between gap-10 relative z-10">
                       <div className="max-w-2xl space-y-6">
                          <div className="flex items-center gap-4">
                             <Skull size={32} className="text-red-700"/>
                             <h3 className="text-2xl md:text-3xl font-black text-red-800 tracking-tight font-sans uppercase">Emergency Kill Switch</h3>
                          </div>
                          <p className="text-base md:text-lg text-stone-700 leading-relaxed font-medium font-sans">
                             Activating the kill switch will instantly halt all state-mutating functions across the protocol. Use ONLY during an active exploit. Requires GUARDIAN role.
                          </p>
                          
                          <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-red-100 shadow-sm">
                             <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 font-sans">Current Status</h4>
                             {isPaused ? (
                                <div className="text-red-600 flex items-center gap-3 font-bold text-base md:text-lg font-sans"><AlertTriangle/> PROTOCOL IS CURRENTLY FROZEN</div>
                             ) : (
                                <div className="text-emerald-700 flex items-center gap-3 font-bold text-base md:text-lg font-sans"><CheckCircle/> PROTOCOL IS RUNNING NORMALLY</div>
                             )}
                          </div>
                       </div>

                       <div className="w-full lg:w-auto flex flex-col justify-center font-sans">
                          <ConnectButton.Custom>
                             {({ account, chain, openConnectModal, mounted }) => {
                                 const connected = mounted && account && chain;
                                 const wrongNetwork = connected && chain.id !== 11155111;

                                 if (!connected || wrongNetwork) return <button onClick={() => !connected ? openConnectModal() : switchChain({ chainId: 11155111 })} className="w-full md:w-[320px] py-6 bg-stone-900 hover:bg-black text-white rounded-2xl font-bold text-sm transition-all shadow-md uppercase tracking-widest">Connect Wallet</button>;
                                 if (!isGuardian) return <div className="w-full md:w-[320px] py-6 bg-stone-200 text-stone-500 text-center rounded-2xl font-bold text-xs uppercase tracking-widest border border-[#D6D3C0]">Guardian Role Required</div>;

                                 return (
                                     <div className="flex flex-col gap-4 w-full md:w-[320px]">
                                         {isPaused ? (
                                           <button onClick={() => handlePauseToggle(false)} disabled={activeAction !== null} className="w-full py-6 bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-800 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all flex justify-center items-center gap-3 disabled:opacity-50 shadow-lg">
                                                 {activeAction === 'UNPAUSE' ? <Loader2 className="animate-spin" size={20}/> : <Unlock size={20}/>} {activeAction === 'UNPAUSE' ? "RESTORING..." : "UNPAUSE PROTOCOL"}
                                           </button>
                                         ) : (
                                           <button onClick={() => handlePauseToggle(true)} disabled={activeAction !== null} className="w-full py-6 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm tracking-widest uppercase transition-all flex justify-center items-center gap-3 shadow-xl disabled:opacity-50">
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
                 <div className="bg-white p-6 md:p-12 border border-[#D6D3C0] rounded-[2rem] md:rounded-[3rem] relative shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {!isAdmin ? (
                       <div className="text-center py-20">
                          <ShieldAlert size={60} className="mx-auto text-stone-300 mb-6"/>
                          <h3 className="text-2xl font-bold text-stone-900 mb-2 font-serif">Master Admin Required</h3>
                          <p className="text-stone-500 font-medium font-sans">Only the Master Admin can grant or revoke protocol roles.</p>
                       </div>
                    ) : (
                       <div className="flex flex-col lg:flex-row justify-between gap-10 relative z-10">
                          <div className="max-w-xl space-y-6">
                             <h3 className="text-2xl md:text-3xl font-black text-black tracking-tighter flex items-center gap-3 font-sans uppercase">
                                <Users size={32}/> Access Control Center
                             </h3>
                             <p className="text-base text-stone-600 leading-relaxed font-medium font-sans">
                                Assign elevated cryptographic privileges to trusted addresses. Guardians can pause the protocol and veto proposals.
                             </p>
                             
                             <div className="space-y-6 pt-4">
                                <div>
                                   <label className="text-xs font-bold text-stone-400 uppercase tracking-widest block mb-2 px-1 font-sans">Target Address</label>
                                   <input type="text" placeholder="0x..." value={targetAddress} onChange={(e) => setTargetAddress(e.target.value)} className="w-full bg-[#F5F2EB] border border-[#D6D3C0] rounded-2xl py-4 px-6 text-black text-lg outline-none focus:border-black transition-all font-mono font-medium" />
                                </div>
                                <div>
                                   <label className="text-xs font-bold text-stone-400 uppercase tracking-widest block mb-2 px-1 font-sans">Select Clearance Level</label>
                                   <div className="flex gap-4 font-sans">
                                      <button onClick={() => setSelectedRole('GUARDIAN')} className={`flex-1 py-4 rounded-2xl font-bold text-xs md:text-sm tracking-widest uppercase transition-all border ${selectedRole === 'GUARDIAN' ? 'bg-stone-900 text-white border-black' : 'bg-white border-[#D6D3C0] text-stone-500 hover:border-stone-400'}`}>Veto Guardian</button>
                                      <button onClick={() => setSelectedRole('EXECUTOR')} className={`flex-1 py-4 rounded-2xl font-bold text-xs md:text-sm tracking-widest uppercase transition-all border ${selectedRole === 'EXECUTOR' ? 'bg-stone-900 text-white border-black' : 'bg-white border-[#D6D3C0] text-stone-500 hover:border-stone-400'}`}>Executor</button>
                                   </div>
                                </div>
                             </div>
                          </div>

                          <div className="w-full lg:w-auto flex flex-col justify-end gap-4 font-sans">
                             <button onClick={() => handleRoleUpdate(true)} disabled={activeAction !== null || !targetAddress} className="w-full md:w-[320px] py-6 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-sm tracking-widest uppercase transition-all flex justify-center items-center gap-3 disabled:opacity-50 shadow-lg">
                                 {activeAction === 'GRANT' ? <Loader2 className="animate-spin" size={20}/> : <ShieldCheck size={20}/>} GRANT CLEARANCE
                             </button>
                             <button onClick={() => handleRoleUpdate(false)} disabled={activeAction !== null || !targetAddress} className="w-full md:w-[320px] py-6 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all flex justify-center items-center gap-3 disabled:opacity-50">
                                 {activeAction === 'REVOKE' ? <Loader2 className="animate-spin" size={20}/> : <X size={20}/>} REVOKE CLEARANCE
                             </button>
                          </div>
                       </div>
                    )}
                 </div>
              )}

              {activeTab === 'VETO' && (
                 <div className="bg-amber-50 p-6 md:p-12 border border-amber-100 rounded-[2rem] md:rounded-[3rem] relative shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {!isGuardian ? (
                       <div className="text-center py-20">
                          <Crosshair size={60} className="mx-auto text-amber-300 mb-6"/>
                          <h3 className="text-2xl font-bold text-stone-900 mb-2 font-serif">Veto Power Restricted</h3>
                          <p className="text-stone-600 font-medium font-sans">Only authorized Guardians can terminate malicious proposals.</p>
                       </div>
                    ) : (
                       <div className="flex flex-col lg:flex-row justify-between gap-10 relative z-10">
                          <div className="max-w-xl space-y-6">
                             <h3 className="text-2xl md:text-3xl font-black text-amber-800 tracking-tight flex items-center gap-3 font-sans uppercase">
                                <Crosshair size={32}/> Veto Council Authority
                             </h3>
                             <p className="text-base text-stone-700 leading-relaxed font-medium font-sans">
                                If a proposal threatens the integrity of the DAO, Guardians can unilaterally cancel it. Input the Proposal ID to terminate.
                             </p>
                             
                             <div className="space-y-4 pt-4">
                                <div>
                                   <label className="text-xs font-bold text-stone-400 uppercase tracking-widest block mb-2 px-1 font-sans">Target Proposal ID</label>
                                   <input type="number" placeholder="e.g. 1152003..." value={proposalId} onChange={(e) => setProposalId(e.target.value)} className="w-full bg-white border border-amber-200 rounded-2xl py-4 px-6 text-black text-lg outline-none focus:border-amber-500 transition-all font-mono shadow-sm placeholder:text-stone-300" />
                                </div>
                             </div>
                          </div>

                          <div className="w-full lg:w-auto flex flex-col justify-end font-sans">
                             <button onClick={handleVeto} disabled={activeAction !== null || !proposalId} className="w-full md:w-[320px] py-6 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold text-sm tracking-widest uppercase transition-all flex justify-center items-center gap-3 disabled:opacity-50 shadow-lg">
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

      {/* TOASTS */}
      {toast && (
        <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[2000] animate-in slide-in-from-right duration-300 w-[calc(100%-3rem)] md:w-auto font-sans">
           <div className={`flex items-start gap-4 md:gap-6 p-6 md:p-8 rounded-3xl border shadow-xl md:max-w-md bg-white ${
              toast.type === 'SUCCESS' ? 'border-emerald-100' : 'border-red-100'
           }`}>
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${toast.type === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                 {toast.type === 'SUCCESS' ? <CheckCircle size={24} className="md:w-6 md:h-6"/> : <AlertCircle size={24} className="md:w-6 md:h-6"/>}
              </div>
              <div className="flex-1 mt-1">
                 <h4 className={`text-sm md:text-base font-bold uppercase tracking-widest mb-1 md:mb-2 ${toast.type === 'SUCCESS' ? 'text-emerald-800' : 'text-red-800'}`}>
                    {toast.message}
                 </h4>
                 <p className="text-xs md:text-sm text-stone-600 leading-relaxed mb-4 md:mb-5 font-medium">{toast.subMessage}</p>
                 {toast.hash && (
                   <a href={`https://sepolia.etherscan.io/tx/${toast.hash}`} target="_blank" className="inline-flex items-center gap-2 text-[10px] md:text-xs font-bold text-stone-500 uppercase tracking-widest hover:underline bg-stone-100 px-4 py-2 md:px-5 md:py-2.5 rounded-xl border border-stone-200 transition-all hover:bg-stone-200 hover:text-black">
                     <ExternalLink size={14} className="md:w-4 md:h-4"/> View Logs
                   </a>
                 )}
              </div>
              <button onClick={() => setToast(null)} className="text-stone-400 hover:text-black transition-colors p-1 md:p-2 bg-stone-50 rounded-full mt-[-5px] mr-[-5px]"><X size={16} className="md:w-5 md:h-5"/></button>
           </div>
        </div>
      )}
    </div>
  );
}
