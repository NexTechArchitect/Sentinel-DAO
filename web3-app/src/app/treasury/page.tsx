'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ArrowUpRight, ArrowDownLeft, History, ShieldCheck, ArrowLeft, 
  Loader2, Zap, Landmark, X, Image as ImageIcon, ExternalLink, 
  CheckCircle, AlertCircle, LayoutGrid, Layers, Lock
} from 'lucide-react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit'; 
import { 
  useAccount, useReadContract, useWriteContract, 
  useWaitForTransactionReceipt, useBalance 
} from 'wagmi';
import { parseUnits, formatEther, formatUnits } from 'viem';
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
  type: 'DEPOSIT' | 'WITHDRAW' | 'APPROVE';
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
  const { address } = useAccount();
  
  const mainRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'tokens' | 'nft_vault' | 'trans_history'>('tokens');
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [toast, setToast] = useState<ToastState>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0]); 
  const [amount, setAmount] = useState('');

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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

  const { data: userNativeBalance } = useBalance({
    address: address,
    chainId: 11155111,
    query: { refetchInterval: 5000 }
  });

  const { data: userTokenBalance, refetch: refetchTokenBal } = useReadContract({
    address: selectedToken.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { enabled: !selectedToken.isNative && !!address }
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: selectedToken.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, CONTRACT_ADDRESSES.TREASURY as `0x${string}`],
    query: { enabled: !selectedToken.isNative && !!address }
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
        refetchPrice();
        refetchEth();
        refetchDiso();
        refetchTokenBal();
        refetchAllowance();
    }, 10000);
    return () => clearInterval(intervalId);
  }, [refetchPrice, refetchEth, refetchDiso, refetchTokenBal, refetchAllowance]);

  const { writeContract: executeTx, data: txHash, isPending: isTxPending, error: txError, reset: resetTx } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const needsApproval = !selectedToken.isNative && 
                        modalMode === 'DEPOSIT' && 
                        allowance !== undefined && 
                        amount !== '' &&
                        parseFloat(formatUnits(allowance as bigint, selectedToken.decimals)) < parseFloat(amount);

  const lastActionWasApproval = useRef(false);

  useEffect(() => {
    if (txHash && isModalOpen) {
      if (!needsApproval && !lastActionWasApproval.current) {
         setIsModalOpen(false);
      }
      
      const newTx: Transaction = {
        hash: txHash,
        type: needsApproval ? 'APPROVE' : modalMode,
        token: selectedToken.symbol,
        amount: needsApproval ? `Approve ${selectedToken.symbol}` : `${amount} ${selectedToken.symbol}`,
        timestamp: new Date().toLocaleTimeString()
      };
      setRecentTx(prev => [newTx, ...prev]);
      setToast({ type: 'SUCCESS', message: needsApproval ? 'Approving Asset' : 'Transaction Dispatched', subMessage: 'Awaiting confirmation...', hash: txHash });
    }
  }, [txHash]);

  useEffect(() => {
    if (isConfirmed && txHash) {
      setToast({ type: 'SUCCESS', message: 'Confirmed', subMessage: 'Blockchain state updated.', hash: txHash });
      
      if (!lastActionWasApproval.current) {
          setAmount('');
      } else {
          lastActionWasApproval.current = false;
      }
      
      resetTx();
      refetchEth();
      refetchDiso();
      refetchTokenBal();
      refetchAllowance();
    }
    if (txError) {
       setToast({ type: 'ERROR', message: 'Transaction Failed', subMessage: (txError as any)?.shortMessage || "Request rejected." });
       resetTx();
       lastActionWasApproval.current = false;
    }
  }, [isConfirmed, txError]);

  const openModal = (mode: 'DEPOSIT' | 'WITHDRAW') => {
    resetTx(); 
    setModalMode(mode);
    setIsModalOpen(true);
    setAmount('');
    lastActionWasApproval.current = false;
  };

  const getAvailableAmount = () => {
    if (modalMode === 'DEPOSIT') {
      if (selectedToken.isNative) {
        return userNativeBalance ? parseFloat(formatEther(userNativeBalance.value)) : 0;
      } else {
        return userTokenBalance ? parseFloat(formatUnits(userTokenBalance as bigint, selectedToken.decimals)) : 0;
      }
    } else if (modalMode === 'WITHDRAW') {
        return treasuryEthBalance ? parseFloat(formatEther(treasuryEthBalance)) : 0;
    }
    return 0;
  };

  const setMaxAmount = () => {
    if (modalMode === 'DEPOSIT') {
      if (selectedToken.isNative && userNativeBalance) {
        const maxVal = parseFloat(formatEther(userNativeBalance.value)) - 0.01;
        setAmount(maxVal > 0 ? maxVal.toFixed(4) : '0');
      } else if (!selectedToken.isNative && userTokenBalance) {
        setAmount(formatUnits(userTokenBalance as bigint, selectedToken.decimals));
      }
    } else if (modalMode === 'WITHDRAW' && treasuryEthBalance) {
      setAmount(formatEther(treasuryEthBalance));
    }
  };

  const handleAction = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    const parsedAmount = parseUnits(amount, selectedToken.decimals);

    try {
        if (modalMode === 'DEPOSIT') {
            if (selectedToken.isNative) {
                lastActionWasApproval.current = false;
                executeTx({ address: CONTRACT_ADDRESSES.TREASURY as `0x${string}`, abi: TREASURY_ABI, functionName: 'depositEth', value: parsedAmount, chainId: 11155111 });
            } else {
                if (needsApproval) {
                    lastActionWasApproval.current = true; 
                    executeTx({ 
                        address: selectedToken.address as `0x${string}`, 
                        abi: ERC20_ABI, 
                        functionName: 'approve', 
                        args: [CONTRACT_ADDRESSES.TREASURY as `0x${string}`, parsedAmount], 
                        chainId: 11155111 
                    });
                } else {
                    lastActionWasApproval.current = false;
                    executeTx({ 
                        address: CONTRACT_ADDRESSES.TREASURY as `0x${string}`, 
                        abi: TREASURY_ABI, 
                        functionName: 'depositERC20', 
                        args: [selectedToken.address as `0x${string}`, parsedAmount], 
                        chainId: 11155111 
                    });
                }
            }
        } else {
            alert("Governance Proposal Required for Withdrawals.");
        }
    } catch (e) {
        console.error(e);
    }
  };

  if (!isMounted) return null;

  return (
    // Background: Cream | Text: Dark Stone
    <div className="h-screen w-full bg-[#F5F2EB] text-stone-900 font-serif selection:bg-emerald-200 flex flex-col overflow-hidden relative">
      
      {/* Background Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-multiply"></div>

      {/* Progress Bar */}
      <div className="fixed top-0 right-0 w-1.5 h-full bg-[#E5E0D6] z-[100]">
        <div className="bg-emerald-600 w-full transition-all duration-100 ease-out" style={{ height: `${progress}%` }} />
      </div>

      <nav className="border-b border-[#D6D3C0] bg-[#F5F2EB]/95 backdrop-blur-2xl z-50 flex-shrink-0">
        <div className="max-w-[1600px] mx-auto px-6 h-20 w-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="group flex items-center gap-3 text-stone-600 hover:text-black transition-all">
              <div className="p-2 rounded-xl bg-white border border-[#D6D3C0] group-hover:border-stone-400 transition-all">
                <ArrowLeft size={18} /> 
              </div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase font-sans">Back to Terminal</span>
            </Link>
            <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-emerald-100 border border-emerald-200 rounded-full">
               <ShieldCheck size={14} className="text-emerald-700" />
               <span className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase font-sans">Vault Secure</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
              <ConnectButton.Custom>
                 {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
                   const connected = mounted && account && chain;
                   return (
                     <button 
                       onClick={connected ? openAccountModal : openConnectModal}
                       className={`px-6 py-2.5 border rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all font-sans ${connected ? 'bg-white border-[#D6D3C0] text-stone-700 hover:bg-stone-50' : 'bg-stone-900 border-black text-white hover:bg-black'}`}
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
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></div>
                      <span className="text-stone-500 text-[10px] font-bold uppercase tracking-[0.3em] font-sans">Treasury Module Active</span>
                  </div>
                  <h1 className="text-5xl md:text-7xl font-black text-black tracking-tight leading-none mb-6 font-serif">
                    Capital <span className="text-stone-500 italic">Reserves</span>
                  </h1>
                  <div className="flex items-center gap-8 font-sans">
                      <div>
                         <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Value Locked</p>
                         <p className="text-3xl md:text-4xl font-mono font-bold text-stone-900 tracking-tight">
                           ${treasuryEthBalance && ethPrice ? (parseFloat(formatEther(treasuryEthBalance)) * ethPrice).toLocaleString(undefined, {minimumFractionDigits: 2}) : "0.00"}
                         </p>
                      </div>
                      <div className="w-px h-10 bg-[#D6D3C0]"></div>
                      <div>
                         <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest mb-1">Ether Price</p>
                         <p className="text-3xl md:text-4xl font-mono font-bold text-emerald-700">${ethPrice.toLocaleString()}</p>
                      </div>
                  </div>
               </div>
               <div className="flex gap-4 w-full md:w-auto font-sans">
                  <button onClick={() => openModal('DEPOSIT')} className="flex-1 md:flex-none px-8 py-4 bg-stone-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-lg flex items-center justify-center gap-2">
                      <ArrowDownLeft size={16}/> Deposit
                  </button>
                  <button onClick={() => openModal('WITHDRAW')} className="flex-1 md:flex-none px-8 py-4 bg-white border border-[#D6D3C0] text-stone-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-stone-50 transition-all flex items-center justify-center gap-2">
                      <ArrowUpRight size={16}/> Withdraw
                  </button>
               </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-12 gap-8">
             <div className="col-span-12 lg:col-span-3 space-y-4 font-sans">
                {[
                  { id: 'tokens', label: 'Assets', icon: LayoutGrid, desc: 'Balance Sheet' },
                  { id: 'nft_vault', label: 'NFT Vault', icon: Layers, desc: 'Digital Collectibles' },
                  { id: 'trans_history', label: 'Activity', icon: History, desc: 'Transaction Logs' }
                ].map((tab) => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full p-6 rounded-3xl border text-left transition-all duration-300 group relative overflow-hidden ${activeTab === tab.id ? 'bg-white border-black shadow-md' : 'bg-[#E5E0D6] border-transparent hover:bg-[#D6D3C0]'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                        <div className={`p-3 rounded-2xl ${activeTab === tab.id ? 'bg-stone-900 text-white' : 'bg-white text-stone-400'}`}>
                           {tab.id === 'tokens' && <LayoutGrid size={20} />}
                           {tab.id === 'nft_vault' && <Layers size={20} />}
                           {tab.id === 'trans_history' && <History size={20} />}
                        </div>
                        {activeTab === tab.id && <Zap size={16} className="text-amber-500 fill-current" />}
                    </div>
                    <h3 className={`text-lg font-bold uppercase tracking-tight ${activeTab === tab.id ? 'text-black' : 'text-stone-500'}`}>{tab.label}</h3>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{tab.desc}</p>
                  </button>
                ))}
             </div>

             <div className="col-span-12 lg:col-span-9">
               <AnimatePresence mode="wait">
                 {activeTab === 'tokens' && (
                   <motion.div variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-4">
                      <motion.div variants={itemVariants} className="p-8 rounded-[2.5rem] bg-white border border-[#D6D3C0] hover:border-black transition-all group relative overflow-hidden shadow-sm">
                          <div className="absolute top-0 right-0 p-10 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity scale-150"><Landmark size={120}/></div>
                          <div className="flex justify-between items-center relative z-10">
                             <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-3xl bg-[#F5F2EB] border border-[#E5E0D6] flex items-center justify-center text-3xl shadow-sm text-black">⟠</div>
                                <div>
                                   <h3 className="text-2xl font-bold text-black font-serif">Ethereum</h3>
                                   <span className="inline-block mt-1 px-3 py-1 rounded-full border border-[#D6D3C0] bg-[#F5F2EB] text-[10px] font-bold text-stone-500 uppercase tracking-widest font-sans">Native</span>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-3xl font-mono font-bold text-black">{formatEther(treasuryEthBalance ?? BigInt(0)).slice(0, 8)}</p>
                                <p className="text-xs font-mono text-stone-500 mt-1">ETH</p>
                             </div>
                          </div>
                      </motion.div>

                      {SUPPORTED_TOKENS.filter(t => !t.isNative).map(token => {
                          const isDiso = token.symbol === 'DISO';
                          const tokenBalance = isDiso && treasuryDisoBalance ? parseFloat(formatEther(treasuryDisoBalance as bigint)) : 0;
                          return (
                            <motion.div key={token.symbol} variants={itemVariants} className="p-8 rounded-[2.5rem] bg-white border border-[#D6D3C0] hover:border-black transition-all flex items-center justify-between group shadow-sm">
                               <div className="flex items-center gap-6">
                                  <div className="w-16 h-16 rounded-3xl bg-[#F5F2EB] border border-[#E5E0D6] flex items-center justify-center font-bold text-xl shadow-sm text-stone-700">{token.symbol.substring(0,2)}</div>
                                  <div>
                                     <h3 className="text-xl font-bold text-black font-serif">{token.name}</h3>
                                     <span className={`inline-block mt-1 px-3 py-1 rounded-full border border-[#D6D3C0] bg-[#F5F2EB] text-[10px] font-bold uppercase tracking-widest font-sans ${isDiso ? 'text-purple-700' : 'text-stone-500'}`}>{isDiso ? 'Governance' : 'Standard'}</span>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <p className="text-2xl font-mono font-bold text-black">{tokenBalance.toLocaleString()}</p>
                                  <p className="text-xs font-mono text-stone-500 mt-1">{token.symbol}</p>
                               </div>
                            </motion.div>
                          );
                      })}
                   </motion.div>
                 )}

                 {activeTab === 'nft_vault' && (
                   <motion.div variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {DEMO_NFTS.map((nft) => (
                        <motion.div key={nft.id} variants={itemVariants} className="bg-white border border-[#D6D3C0] rounded-[2rem] p-6 hover:shadow-lg transition-all cursor-pointer group">
                           <div className="w-full aspect-square bg-[#F5F2EB] rounded-2xl mb-6 flex items-center justify-center border border-[#E5E0D6] group-hover:border-black transition-colors relative overflow-hidden">
                              <ImageIcon size={40} className="text-stone-400 group-hover:text-black transition-colors"/>
                           </div>
                           <h4 className="text-lg font-bold text-black mb-2 font-serif">{nft.name}</h4>
                           <div className="flex justify-between items-center font-sans">
                              <span className="text-xs text-stone-500 font-bold uppercase tracking-wide">{nft.collection}</span>
                              <span className="text-[10px] font-black text-white bg-black px-3 py-1 rounded-full uppercase tracking-widest">{nft.tier}</span>
                           </div>
                        </motion.div>
                      ))}
                   </motion.div>
                 )}

                 {activeTab === 'trans_history' && (
                   <motion.div variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-4">
                      {recentTx.length > 0 ? recentTx.map((tx, i) => (
                        <motion.div key={i} variants={itemVariants} className="p-6 bg-white border border-[#D6D3C0] rounded-3xl flex items-center justify-between group hover:border-black transition-all shadow-sm">
                           <div className="flex items-center gap-6">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'DEPOSIT' ? 'bg-emerald-100 text-emerald-700' : tx.type === 'APPROVE' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                 {tx.type === 'DEPOSIT' ? <ArrowDownLeft size={20}/> : tx.type === 'APPROVE' ? <Lock size={20}/> : <ArrowUpRight size={20}/>}
                              </div>
                              <div>
                                 <h4 className="font-bold text-black text-sm mb-1 font-serif">
                                    {tx.type === 'DEPOSIT' ? 'Asset Received' : tx.type === 'APPROVE' ? 'Token Approval' : 'Asset Sent'}
                                 </h4>
                                 <span className="text-[10px] font-mono text-stone-500 bg-[#F5F2EB] px-2 py-1 rounded border border-[#D6D3C0]">{tx.timestamp}</span>
                              </div>
                           </div>
                           <div className="text-right">
                              <span className="text-lg font-mono font-bold text-black">{tx.amount}</span>
                              <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" className="flex items-center justify-end gap-1 text-[10px] text-stone-400 font-bold uppercase tracking-widest hover:text-black mt-1 transition-colors font-sans">Explorer <ExternalLink size={10}/></a>
                           </div>
                        </motion.div>
                      )) : (
                        <motion.div variants={itemVariants} className="py-32 text-center border-2 border-dashed border-[#D6D3C0] rounded-[3rem] bg-[#F5F2EB]">
                           <History className="mx-auto text-stone-400 mb-4" size={48}/>
                           <p className="text-xs font-bold text-stone-500 uppercase tracking-widest font-sans">No Recent Activity</p>
                        </motion.div>
                      )}
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
          </div>

          <AnimatePresence>
            {isModalOpen && (
               <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white border border-[#D6D3C0] w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden relative font-sans">
                     <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-stone-800 to-stone-600" />
                     <div className="p-10">
                        <div className="flex justify-between items-center mb-8">
                           <div>
                              <h3 className="text-2xl font-black text-black mb-1 font-serif uppercase tracking-tight">{modalMode} FUNDS</h3>
                              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Secure Gateway</p>
                           </div>
                           <button onClick={() => setIsModalOpen(false)} className="p-3 rounded-full bg-[#F5F2EB] hover:bg-[#E5E0D6] text-stone-600 hover:text-black transition-colors"><X size={20} /></button>
                        </div>
                        <div className="space-y-6">
                           <div className="p-5 rounded-3xl bg-[#F5F2EB] border border-[#E5E0D6] flex items-center justify-between">
                              <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">Select Asset</span>
                              <div className="relative">
                                 <select className="bg-white border border-[#D6D3C0] rounded-xl px-4 py-2 text-sm font-bold text-black outline-none focus:border-black appearance-none pr-8 cursor-pointer" onChange={(e) => { const t = SUPPORTED_TOKENS.find(x => x.symbol === e.target.value); if(t) setSelectedToken(t); }} value={selectedToken.symbol}>
                                    {SUPPORTED_TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                                 </select>
                              </div>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-2">Amount</label>
                              <div className="relative">
                                 <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full p-6 rounded-3xl bg-[#F5F2EB] border border-[#E5E0D6] text-4xl font-mono text-black outline-none focus:border-stone-400 transition-all placeholder:text-stone-300" />
                                 <button onClick={setMaxAmount} className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-900 bg-white border border-[#D6D3C0] px-3 py-1.5 rounded-lg hover:bg-stone-50 uppercase tracking-wide">Max</button>
                              </div>
                              <div className="text-right text-[10px] font-mono text-stone-500">Available: {getAvailableAmount().toLocaleString()} {selectedToken.symbol}</div>
                           </div>
                           
                           <button 
                             onClick={handleAction} 
                             disabled={isTxPending || isConfirming || !amount} 
                             className={`w-full py-6 rounded-2xl font-bold text-sm uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${needsApproval ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-stone-900 text-white hover:bg-black'}`}
                           >
                             {isTxPending || isConfirming ? <Loader2 className="animate-spin" size={18}/> : needsApproval ? <Lock size={18} fill="currentColor"/> : <Zap size={18} fill="currentColor"/>}
                             {isTxPending ? 'Confirming...' : needsApproval ? `Approve ${selectedToken.symbol}` : `Deposit ${selectedToken.symbol}`}
                           </button>
                        </div>
                     </div>
                  </motion.div>
               </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {toast && (
               <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="fixed bottom-10 right-10 z-[2000] max-w-sm w-full font-sans">
                  <div className={`p-6 rounded-3xl border shadow-2xl flex gap-5 items-start bg-white ${toast.type === 'SUCCESS' ? 'border-emerald-200' : 'border-red-200'}`}>
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${toast.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {toast.type === 'SUCCESS' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
                     </div>
                     <div className="flex-1">
                        <h4 className={`text-sm font-bold uppercase tracking-wide mb-1 ${toast.type === 'SUCCESS' ? 'text-black' : 'text-red-800'}`}>{toast.message}</h4>
                        <p className="text-[11px] text-stone-600 leading-relaxed mb-3 font-medium">{toast.subMessage}</p>
                        {toast.hash && <a href={`https://sepolia.etherscan.io/tx/${toast.hash}`} target="_blank" className="inline-flex items-center gap-1.5 text-[10px] font-bold text-stone-500 hover:text-black transition-colors uppercase tracking-widest"><ExternalLink size={10}/> View Explorer</a>}
                     </div>
                     <button onClick={() => setToast(null)} className="text-stone-400 hover:text-black"><X size={16}/></button>
                  </div>
               </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}