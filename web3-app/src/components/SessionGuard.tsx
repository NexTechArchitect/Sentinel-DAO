'use client';

import { useAASession } from '@/hooks/useAASession';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Loader2, Lock, ShieldCheck, ShieldAlert } from 'lucide-react';

// FIX: Added requireSession type to stop the TS Error
export function SessionGuard({ 
  children, 
  requireSession = true 
}: { 
  children: React.ReactNode;
  requireSession?: boolean;
}) {
  const { isConnected, isSessionActive, createSession, isLoading, error } = useAASession();

  // 1. Agar Wallet hi connected nahi hai
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#05050a] flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-slate-900/40 p-12 rounded-[3rem] border border-white/10">
          <Lock className="mx-auto text-slate-700 mb-6" size={60}/>
          <h2 className="text-2xl font-black text-white uppercase mb-8">Access Locked</h2>
          <ConnectButton />
        </div>
      </div>
    );
  }

  // 2. Wallet connected hai par OFF-CHAIN SIGNATURE nahi diya
  if (requireSession && !isSessionActive) {
    return (
      <div className="min-h-screen bg-[#05050a] flex items-center justify-center p-6 font-sans">
        <div className="max-w-lg w-full bg-slate-900/80 border border-blue-500/30 p-10 rounded-[3rem] backdrop-blur-3xl shadow-2xl">
          <div className="flex justify-between items-center mb-10 text-white">
             <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
               <ShieldAlert className="text-blue-400" size={32}/>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Security Status</p>
                <p className="text-2xl font-black text-yellow-500 uppercase">Unverified</p>
             </div>
          </div>

          <h2 className="text-3xl font-black text-white uppercase mb-4">Verify Identity</h2>
          <p className="text-slate-400 text-sm mb-10 leading-relaxed font-light">
            Your wallet is linked, but your protocol identity is unverified. You must sign a free, off-chain message to establish a secure session and unlock the DAO.
          </p>

          <button 
            onClick={createSession}
            disabled={isLoading}
            className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_40px_rgba(37,99,235,0.2)] flex items-center justify-center gap-3"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20}/> : <ShieldCheck size={20}/>}
            {isLoading ? 'Awaiting Signature...' : 'Sign & Verify Identity'}
          </button>
          
          {error && <p className="text-red-400 text-[10px] mt-4 font-bold text-center uppercase tracking-tighter">Error: {error}</p>}
        </div>
      </div>
    );
  }

  // 3. Sab theek hai toh protected page ka content dikhao
  return <>{children}</>;
}