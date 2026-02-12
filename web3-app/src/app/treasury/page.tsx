'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ArrowUpRight, ArrowDownLeft, History, ShieldCheck, ArrowLeft, 
  Loader2, Zap, Landmark, X, Image as ImageIcon, ExternalLink, 
  CheckCircle, AlertCircle, Shield, TrendingUp, LayoutGrid, Layers, Copy, Lock
} from 'lucide-react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit'; 
import { 
  useAccount, useReadContract, useWriteContract, 
  useWaitForTransactionReceipt, useSwitchChain, useChainId, useBalance 
} from 'wagmi';
import { parseUnits, formatEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { CONTRACT_ADDRESSES, TREASURY_ABI, CHAINLINK_ABI, SUPPORTED_TOKENS, ERC20_ABI } from '@/config/constants';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 50 } }
};

type Transaction = {
  hash: string;
  type: 'DEPOSIT' | 'WITHDRAW';
  token: string;
  amount: string;
  timestamp: string;
};

type ToastState = {
  type: 'SUCCESS' | 'ERROR';
  message: string;
  subMessage?: string;
  hash?: string;
} | null;

const DEMO_NFTS = [
  { id: 1, name: 'Sentinel Key #001', collection: 'Access Pass', tier: 'Gold' },
  { id: 2, name: 'Veto Badge', collection: 'Governance', tier: 'Diamond' },
  { id: 3, name: 'Builder #402', collection: 'Supporter', tier: 'Silver' },
];

export default function Treasury() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId(); 
  const { switchChain } = useSwitchChain(); 
  
  const mainRef = useRef<HTMLDivElement | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: -1000, y: -1000 });
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'tokens' | 'nft_vault' | 'trans_history'>('tokens');
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [toast, setToast] = useState<ToastState>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0]); 
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setCursorPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const mainEl = mainRef.current;
      if (!mainEl) return;
      const totalHeight = mainEl.scrollHeight - mainEl.clientHeight;
      const scrolled = (mainEl.scrollTop / totalHeight) * 100;
      setProgress(scrolled);
    };
    const mainEl = mainRef.current;
    if (mainEl) mainEl.addEventListener("scroll", handleScroll);
    return () => mainEl?.removeEventListener("scroll", handleScroll);
  }, []);
  
  const { data: chainlinkData, refetch: refetchPrice } = useReadContract({
    address: CONTRACT_ADDRESSES.CHAINLINK_ETH_USD as `0x${string}`,
    abi: CHAINLINK_ABI,
    functionName: 'latestRoundData',
    chainId: 11155111, 
    query: { refetchInterval: 15000 }
  });

  const ethPrice = chainlinkData ? Number((chainlinkData as any)[1]) / 10**8 : 0;

  const { data: treasuryEthBalance, refetch: refetchEth } = useReadContract({
    address: CONTRACT_ADDRESSES.TREASURY as `0x${string}`,
    abi: TREASURY_ABI,
    functionName: 'ethBalance',
    chainId: 11155111,
    query: { refetchInterval: 15000 }
  });

  const { data: treasuryDisoBalance, refetch: refetchDiso } = useReadContract({
    address: CONTRACT_ADDRESSES.GOV_TOKEN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [CONTRACT_ADDRESSES.TREASURY as `0x${string}`],
    chainId: 11155111,
    query: { refetchInterval: 15000 }
  });

  const { data: userBalance, refetch: refetchUser } = useBalance({
    address: address,
    chainId: 11155111,
    query: { refetchInterval: 15000 }
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
        refetchPrice();
        refetchEth();
        refetchDiso();
        refetchUser();
    }, 15000);
    return () => clearInterval(intervalId);
  }, [refetchPrice, refetchEth, refetchDiso, refetchUser]);

  const { writeContract: executeTx, data: txHash, isPending: isTxPending, error: txError, reset: resetTx } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (txHash && isModalOpen) {
      setIsModalOpen(false);
      const newTx: Transaction = {
        hash: txHash,
        type: modalMode,
        token: selectedToken.symbol,
        amount: `${amount} ${selectedToken.symbol}`,
        timestamp: new Date().toLocaleTimeString()
      };
      setRecentTx(prev => [newTx, ...prev]);
      setToast({ type: 'SUCCESS', message: 'Transaction Dispatched', subMessage: 'Awaiting confirmation...', hash: txHash });
    }
  }, [txHash, isModalOpen]);

  useEffect(() => {
    if (isConfirmed && txHash) {
      setToast({ type: 'SUCCESS', message: 'Transaction Confirmed', subMessage: 'Treasury updated.', hash: txHash });
      setAmount('');
      resetTx();
      setTimeout(() => {
        refetchEth();
        refetchDiso();
        refetchUser();
      }, 3000);
    }
    if (txError) {
       setToast({ type: 'ERROR', message: 'Transaction Failed', subMessage: (txError as any)?.shortMessage || "Request rejected." });
       resetTx();
    }
  }, [isConfirmed, txError]);

  const openModal = (mode: 'DEPOSIT' | 'WITHDRAW') => {
    resetTx(); 
    setModalMode(mode);
    setIsModalOpen(true);
    setAmount('');
  };

  const getAvailableAmount = () => {
    if (modalMode === 'DEPOSIT' && userBalance) {
      return parseFloat(formatEther(userBalance.value));
    } else if (modalMode === 'WITHDRAW' && treasuryEthBalance) {
      return parseFloat(formatEther(treasuryEthBalance));
    }
    return 0;
  };

  const setMaxAmount = () => {
    if (modalMode === 'DEPOSIT' && userBalance) {
      const maxVal = parseFloat(formatEther(userBalance.value)) - 0.001;
      setAmount(maxVal > 0 ? maxVal.toFixed(4) : '0');
    } else if (modalMode === 'WITHDRAW' && treasuryEthBalance) {
      setAmount(formatEther(treasuryEthBalance));
    }
  };

  const handleAction = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    const parsedAmount = parseUnits(amount, selectedToken.decimals);
    if (modalMode === 'DEPOSIT') {
        if (selectedToken.isNative) {
            executeTx({ address: CONTRACT_ADDRESSES.TREASURY as `0x${string}`, abi: TREASURY_ABI, functionName: 'depositEth', value: parsedAmount, chainId: 11155111 });
        } else {
            executeTx({ address: CONTRACT_ADDRESSES.TREASURY as `0x${string}`, abi: TREASURY_ABI, functionName: 'depositERC20', args: [selectedToken.address as `0x${string}`, parsedAmount], chainId: 11155111 });
        }
    } else {
        alert("Governance Proposal Required for Withdrawals.");
    }
  };

  return (
    <div className="h-screen w-full bg-[#030305] text-slate-200 font-sans selection:bg-cyan-500/30 flex flex-col overflow-hidden relative">
      
      <div className="fixed z-[60] pointer-events-none w-[500px] h-[500px] rounded-full blur-[200px] bg-cyan-500/5 transition-transform duration-75 mix-blend-screen" style={{ transform: `translate(${cursorPos.x - 250}px, ${cursorPos.y - 250}px)`, left: 0, top: 0 }} />

      <div className="fixed top-0 right-0 w-1 h-full bg-white/5 z-[100]">
        <div className="bg-gradient-to-b from-cyan-500 via-indigo-500 to-cyan-500 w-full transition-all duration-100 ease-out" style={{ height: `${progress}%` }} />
      </div>

      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-600/5 rounded-full blur-[200px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[200px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
      </div>

      <nav className="border-b border-white/5 bg-[#030305]/80 backdrop-blur-2xl z-50 flex-shrink-0">
        <div className="max-w-[1600px] mx-auto px-6 h-20 w-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="group flex items-center gap-3 text-slate-400 hover:text-white transition-all">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:border-cyan-500/50 transition-all">
                <ArrowLeft size={18} /> 
              </div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Back to Terminal</span>
            </Link>
            <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-cyan-900/10 border border-cyan-500/20 rounded-full">
               <ShieldCheck size={14} className="text-cyan-400" />
               <span className="text-[10px] font-bold tracking-widest text-cyan-300 uppercase">Vault Secure</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <ConnectButton.Custom>
                {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
                  const connected = mounted && account && chain;
                  return (
                    <button 
                      onClick={connected ? openAccountModal : openConnectModal}
                      className={`px-6 py-2.5 border rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${connected ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'}`}
                    >
                      {connected ? account.displayName : "Connect Wallet"}
                    </button>
                  );
                }}
              </ConnectButton.Custom>
          </div>
        </div>
      </nav>

      <main ref={mainRef} className="flex-1 overflow-y-auto z-10 relative custom-scrollbar">
        <div className="max-w-[1600px] mx-auto p-6 md:p-12 relative z-10">
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8">
               <div>
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                     <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Treasury Module Active</span>
                  </div>
                  <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none mb-6">
                    Capital <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">Reserves</span>
                  </h1>
                  <div className="flex items-center gap-8">
                     <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Value Locked</p>
                        <p className="text-3xl md:text-4xl font-mono font-bold text-white tracking-tight">
                           ${treasuryEthBalance && ethPrice ? (parseFloat(formatEther(treasuryEthBalance)) * ethPrice).toLocaleString(undefined, {minimumFractionDigits: 2}) : "0.00"}
                        </p>
                     </div>
                     <div className="w-px h-10 bg-white/10"></div>
                     <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Ether Price</p>
                        <p className="text-3xl md:text-4xl font-mono font-bold text-cyan-400">${ethPrice.toLocaleString()}</p>
                     </div>
                  </div>
               </div>
               <div className="flex gap-4 w-full md:w-auto">
                  <button onClick={() => openModal('DEPOSIT')} className="flex-1 md:flex-none px-8 py-4 bg-white text-black rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2">
                     <ArrowDownLeft size={16}/> Deposit
                  </button>
                  <button onClick={() => openModal('WITHDRAW')} className="flex-1 md:flex-none px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                     <ArrowUpRight size={16}/> Withdraw
                  </button>
               </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-12 gap-8">
             <div className="col-span-12 lg:col-span-3 space-y-4">
                {[
                  { id: 'tokens', label: 'Assets', icon: LayoutGrid, desc: 'Balance Sheet' },
                  { id: 'nft_vault', label: 'NFT Vault', icon: Layers, desc: 'Digital Collectibles' },
                  { id: 'trans_history', label: 'Activity', icon: History, desc: 'Transaction Logs' }
                ].map((tab) => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full p-6 rounded-3xl border text-left transition-all duration-300 group relative overflow-hidden ${activeTab === tab.id ? 'bg-cyan-900/10 border-cyan-500/30' : 'bg-[#0a0a0e] border-white/5 hover:border-white/10'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                       <div className={`p-3 rounded-2xl ${activeTab === tab.id ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'}`}>
                          {tab.id === 'tokens' && <LayoutGrid size={20} />}
                          {tab.id === 'nft_vault' && <Layers size={20} />}
                          {tab.id === 'trans_history' && <History size={20} />}
                       </div>
                       {activeTab === tab.id && <Zap size={16} className="text-cyan-400 fill-current" />}
                    </div>
                    <h3 className={`text-lg font-bold uppercase tracking-tight ${activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{tab.label}</h3>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">{tab.desc}</p>
                  </button>
                ))}
             </div>

             <div className="col-span-12 lg:col-span-9">
               <AnimatePresence mode="wait">
                 {activeTab === 'tokens' && (
                   <motion.div variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-4">
                      {/* ETH CARD */}
                      <motion.div variants={itemVariants} className="p-8 rounded-[2.5rem] bg-[#0a0a0e] border border-white/5 hover:border-cyan-500/20 transition-all group relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity scale-150"><Landmark size={120}/></div>
                         <div className="flex justify-between items-center relative z-10">
                            <div className="flex items-center gap-6">
                               <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center text-3xl shadow-inner">⟠</div>
                               <div>
                                  <h3 className="text-2xl font-bold text-white">Ethereum</h3>
                                  <span className="inline-block mt-1 px-3 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Native</span>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-3xl font-mono font-bold text-white">{formatEther(treasuryEthBalance ?? BigInt(0)).slice(0, 8)}</p>
                               <p className="text-xs font-mono text-slate-500 mt-1">ETH</p>
                            </div>
                         </div>
                      </motion.div>

                      {/* TOKEN CARDS */}
                      {SUPPORTED_TOKENS.filter(t => !t.isNative).map(token => {
                         const isDiso = token.symbol === 'DISO';
                         const tokenBalance = isDiso && treasuryDisoBalance ? parseFloat(formatEther(treasuryDisoBalance as bigint)) : 0;
                         return (
                           <motion.div key={token.symbol} variants={itemVariants} className="p-8 rounded-[2.5rem] bg-[#0a0a0e] border border-white/5 hover:border-white/10 transition-all flex items-center justify-between group">
                              <div className="flex items-center gap-6">
                                 <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center font-bold text-xl shadow-inner text-slate-300">{token.symbol.substring(0,2)}</div>
                                 <div>
                                    <h3 className="text-xl font-bold text-slate-200">{token.name}</h3>
                                    <span className={`inline-block mt-1 px-3 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] font-bold uppercase tracking-widest ${isDiso ? 'text-purple-400' : 'text-slate-500'}`}>{isDiso ? 'Governance' : 'Standard'}</span>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-2xl font-mono font-bold text-slate-300">{tokenBalance.toLocaleString()}</p>
                                 <p className="text-xs font-mono text-slate-600 mt-1">{token.symbol}</p>
                              </div>
                           </motion.div>
                         );
                      })}
                   </motion.div>
                 )}

                 {activeTab === 'nft_vault' && (
                   <motion.div variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {DEMO_NFTS.map((nft) => (
                        <motion.div key={nft.id} variants={itemVariants} className="bg-[#0a0a0e] border border-white/5 rounded-[2rem] p-6 hover:bg-[#0f0f13] transition-all cursor-pointer group">
                           <div className="w-full aspect-square bg-black/40 rounded-2xl mb-6 flex items-center justify-center border border-white/5 group-hover:border-cyan-500/20 transition-colors relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <ImageIcon size={40} className="text-slate-700 group-hover:text-cyan-500/50 transition-colors"/>
                           </div>
                           <h4 className="text-lg font-bold text-white mb-2">{nft.name}</h4>
                           <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">{nft.collection}</span>
                              <span className="text-[10px] font-black text-black bg-white px-3 py-1 rounded-full uppercase tracking-widest">{nft.tier}</span>
                           </div>
                        </motion.div>
                      ))}
                   </motion.div>
                 )}

                 {activeTab === 'trans_history' && (
                   <motion.div variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-4">
                      {recentTx.length > 0 ? recentTx.map((tx, i) => (
                        <motion.div key={i} variants={itemVariants} className="p-6 bg-[#0a0a0e] border border-white/5 rounded-3xl flex items-center justify-between group hover:border-white/10 transition-all">
                           <div className="flex items-center gap-6">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                 {tx.type === 'DEPOSIT' ? <ArrowDownLeft size={20}/> : <ArrowUpRight size={20}/>}
                              </div>
                              <div>
                                 <h4 className="font-bold text-white text-sm mb-1">{tx.type === 'DEPOSIT' ? 'Asset Received' : 'Asset Sent'}</h4>
                                 <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-1 rounded">{tx.timestamp}</span>
                              </div>
                           </div>
                           <div className="text-right">
                              <span className="text-lg font-mono font-bold text-white">{tx.amount}</span>
                              <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" className="flex items-center justify-end gap-1 text-[10px] text-cyan-500 font-bold uppercase tracking-widest hover:text-white mt-1 transition-colors">Explorer <ExternalLink size={10}/></a>
                           </div>
                        </motion.div>
                      )) : (
                        <motion.div variants={itemVariants} className="py-32 text-center border border-dashed border-white/10 rounded-[3rem] bg-white/[0.01]">
                           <History className="mx-auto text-slate-700 mb-4" size={48}/>
                           <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">No Recent Activity</p>
                        </motion.div>
                      )}
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
          </div>

          <AnimatePresence>
            {isModalOpen && (
               <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0e0e12] border border-white/10 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden relative">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-indigo-500" />
                     <div className="p-10">
                        <div className="flex justify-between items-center mb-8">
                           <div>
                              <h3 className="text-2xl font-bold text-white mb-1">{modalMode} FUNDS</h3>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Secure Gateway</p>
                           </div>
                           <button onClick={() => setIsModalOpen(false)} className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
                        </div>
                        <div className="space-y-6">
                           <div className="p-5 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Asset</span>
                              <div className="relative">
                                 <select className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none focus:border-cyan-500/50 appearance-none pr-8" onChange={(e) => { const t = SUPPORTED_TOKENS.find(x => x.symbol === e.target.value); if(t) setSelectedToken(t); }} value={selectedToken.symbol}>
                                    {SUPPORTED_TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                                 </select>
                              </div>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Amount</label>
                              <div className="relative">
                                 <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full p-6 rounded-3xl bg-black/40 border border-white/10 text-4xl font-mono text-white outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-800" />
                                 <button onClick={setMaxAmount} className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-bold text-cyan-500 bg-cyan-500/10 px-3 py-1.5 rounded-lg hover:bg-cyan-500/20 uppercase tracking-wide">Max</button>
                              </div>
                              <div className="text-right text-[10px] font-mono text-slate-500">Available: {getAvailableAmount().toFixed(4)} {selectedToken.symbol}</div>
                           </div>
                           <button onClick={handleAction} disabled={isTxPending || isConfirming || !amount} className="w-full py-6 rounded-2xl bg-white text-black font-bold text-sm uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                             {isTxPending || isConfirming ? <Loader2 className="animate-spin" size={18}/> : <Zap size={18} fill="currentColor"/>}
                             {isTxPending ? 'Confirming...' : 'Execute Transaction'}
                           </button>
                        </div>
                     </div>
                  </motion.div>
               </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {toast && (
               <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="fixed bottom-10 right-10 z-[2000] max-w-sm w-full">
                  <div className={`p-6 rounded-3xl border backdrop-blur-2xl shadow-2xl flex gap-5 items-start ${toast.type === 'SUCCESS' ? 'bg-[#0a0a0f]/95 border-emerald-500/20' : 'bg-[#0a0a0f]/95 border-red-500/20'}`}>
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${toast.type === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {toast.type === 'SUCCESS' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
                     </div>
                     <div className="flex-1">
                        <h4 className={`text-sm font-bold uppercase tracking-wide mb-1 ${toast.type === 'SUCCESS' ? 'text-white' : 'text-red-400'}`}>{toast.message}</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed mb-3 font-medium">{toast.subMessage}</p>
                        {toast.hash && <a href={`https://sepolia.etherscan.io/tx/${toast.hash}`} target="_blank" className="inline-flex items-center gap-1.5 text-[10px] font-bold text-cyan-500 hover:text-white transition-colors uppercase tracking-widest"><ExternalLink size={10}/> View Explorer</a>}
                     </div>
                     <button onClick={() => setToast(null)} className="text-slate-600 hover:text-white"><X size={16}/></button>
                  </div>
               </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}