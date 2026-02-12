'use client';

import { useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/constants';
import { SessionGuard } from '@/components/SessionGuard';
import { useAASession } from '@/hooks/useAASession';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Activity, Cpu, Fingerprint, Shield, Zap , Loader2 } from 'lucide-react'; 

export default function AADebugPage() {
  const { address, isConnected } = useAccount();
  
  // NEW OFF-CHAIN HOOK DESTRUCTURING
  const { 
    isSessionActive, 
    nonce, 
    createSession,
    isLoading, 
    error 
  } = useAASession();

  return (
    <SessionGuard requireSession={true}>
      <div className="min-h-screen bg-[#05050a] text-slate-200 p-8 selection:bg-blue-500/30">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Section */}
          <div className="mb-12 border-l-4 border-blue-600 pl-6">
            <h1 className="text-5xl font-black tracking-tighter text-white italic uppercase">
              Sentinel <span className="text-blue-500">Identity</span> Hub
            </h1>
            <p className="text-slate-500 font-mono text-sm mt-2 uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} className="text-blue-500 animate-pulse"/> Account Abstraction & Session Management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            
            {/* Connection Status */}
            <div className="bg-slate-900/30 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl group hover:border-blue-500/20 transition-all">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Master Link</h3>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
              </div>
              <p className={`text-2xl font-black italic ${isConnected ? 'text-white' : 'text-red-400'}`}>
                {isConnected ? 'ONLINE' : 'OFFLINE'}
              </p>
            </div>

            {/* Session Status */}
            <div className="bg-slate-900/30 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl group hover:border-purple-500/20 transition-all">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">AA Session</h3>
                <Zap size={14} className={isSessionActive ? 'text-purple-400' : 'text-slate-600'}/>
              </div>
              <p className={`text-2xl font-black italic ${isSessionActive ? 'text-purple-400' : 'text-yellow-500'}`}>
                {isSessionActive ? 'ACTIVE' : 'REQUIRED'}
              </p>
            </div>

            {/* Nonce Counter */}
            <div className="bg-slate-900/30 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl group hover:border-blue-400/20 transition-all">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Protocol Nonce</h3>
                <Cpu size={14} className="text-blue-400"/>
              </div>
              <p className="text-3xl font-black text-blue-400 font-mono tracking-tighter">
                {nonce?.toString() || '0'}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Wallet Info Card */}
            <div className="bg-slate-900/20 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10">
              <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3 italic uppercase">
                <Fingerprint className="text-blue-500" />
                Wallet Information
              </h2>
              
              <div className="space-y-6 font-mono">
                <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
                  <p className="text-[10px] text-slate-500 mb-2 uppercase font-sans font-bold">Authenticated Address</p>
                  <p className="text-xs text-slate-300 break-all">{address || 'Identity Not Found'}</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
                    <p className="text-[10px] text-slate-500 mb-2 uppercase font-sans font-bold">Session Module Endpoint</p>
                    <p className="text-[10px] text-blue-400/60 break-all">{CONTRACT_ADDRESSES.SESSION_KEY_MODULE}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Debug Actions Card */}
            <div className="bg-slate-900/20 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] rounded-full"></div>
              
              <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3 italic uppercase">
                <Shield className="text-purple-500" />
                System Override
              </h2>

              <div className="space-y-6">
                <button
                  onClick={createSession}
                  disabled={!isConnected || isLoading || isSessionActive}
                  className="w-full py-6 px-8 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all transform active:scale-95 shadow-[0_0_40px_rgba(37,99,235,0.2)] flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18}/>
                      Awaiting Signature...
                    </>
                  ) : isSessionActive ? (
                    'Protocol Sync Active'
                  ) : (
                    'Verify Off-chain Identity'
                  )}
                </button>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
                    <AlertCircle className="text-red-400" size={16}/>
                    <p className="text-[10px] font-bold text-red-400 uppercase leading-relaxed">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-12 text-center">
            <ConnectButton />
            <div className="mt-8 flex justify-center items-center gap-6 opacity-30">
               <div className="h-px w-20 bg-white/20"></div>
               <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-slate-500 italic">Sentinel Security Layer</p>
               <div className="h-px w-20 bg-white/20"></div>
            </div>
          </div>

        </div>
      </div>
    </SessionGuard>
  );
}

const AlertCircle = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);