'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Database, ArrowUpRight, ArrowDownLeft, Wallet, 
  History, ShieldCheck, ArrowLeft, Loader2, Zap, 
  Landmark, Plus, Search, X, Image as ImageIcon, Box, AlertTriangle, Menu, ExternalLink, CheckCircle, AlertCircle, Command, Shield, Hash, Power
} from 'lucide-react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit'; 
import { 
  useAccount, 
  useReadContract, 
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain, 
  useChainId,
  useBalance 
} from 'wagmi';
import { parseUnits, formatEther } from 'viem';
import { CONTRACT_ADDRESSES, TREASURY_ABI, CHAINLINK_ABI, SUPPORTED_TOKENS, ERC20_ABI } from '@/config/constants';

// --- TYPES ---
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
  { id: 2, name: 'Veto Council Badge', collection: 'Governance', tier: 'Diamond' },
  { id: 3, name: 'Builder NFT #402', collection: 'Early Supporter', tier: 'Silver' },
];

export default function Treasury() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId(); 
  const { switchChain } = useSwitchChain(); 
  
  // --- UI & THEME STATES ---
  const mainRef = useRef<HTMLDivElement | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: -1000, y: -1000 });
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'tokens' | 'nft_vault' | 'trans_history'>('tokens');
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [toast, setToast] = useState<ToastState>(null);

  // --- MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0]); 
  const [amount, setAmount] = useState('');

  // =====================================================
  // EFFECTS — CURSOR MOVEMENT & SCROLL
  // =====================================================
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
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
    if (mainEl) {
      mainEl.addEventListener("scroll", handleScroll);
    }
    return () => mainEl?.removeEventListener("scroll", handleScroll);
  }, []);
  
  // =================================================================================
  // 1. READ CHAINLINK PRICE
  // =================================================================================
  const { data: chainlinkData, refetch: refetchPrice } = useReadContract({
    address: CONTRACT_ADDRESSES.CHAINLINK_ETH_USD as `0x${string}`,
    abi: CHAINLINK_ABI,
    functionName: 'latestRoundData',
    chainId: 11155111, 
    query: { refetchInterval: 15000 }
  });

  const ethPrice = chainlinkData ? Number((chainlinkData as any)[1]) / 10**8 : 0;

  // =================================================================================
  // 2. READ TREASURY ETH BALANCE
  // =================================================================================
  const { data: treasuryEthBalance, refetch: refetchEth } = useReadContract({
    address: CONTRACT_ADDRESSES.TREASURY as `0x${string}`,
    abi: TREASURY_ABI,
    functionName: 'ethBalance',
    chainId: 11155111,
    query: { refetchInterval: 15000 }
  });

  // =================================================================================
  // 3. READ TREASURY DISO (ERC20) BALANCE
  // =================================================================================
  const { data: treasuryDisoBalance, refetch: refetchDiso } = useReadContract({
    address: CONTRACT_ADDRESSES.GOV_TOKEN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [CONTRACT_ADDRESSES.TREASURY as `0x${string}`],
    chainId: 11155111,
    query: { refetchInterval: 15000 }
  });

  // =================================================================================
  // 4. READ USER BALANCE
  // =================================================================================
  const { data: userBalance, refetch: refetchUser } = useBalance({
    address: address,
    chainId: 11155111,
    query: { refetchInterval: 15000 }
  });

  // =================================================================================
  // AUTO REFRESH LOOP
  // =================================================================================
  useEffect(() => {
    const intervalId = setInterval(() => {
        refetchPrice();
        refetchEth();
        refetchDiso();
        refetchUser();
    }, 15000);
    return () => clearInterval(intervalId);
  }, [refetchPrice, refetchEth, refetchDiso, refetchUser]);

  // =================================================================================
  // 5. WRITE CONTRACT LOGIC (WITH REAL-TIME NOTIFICATIONS)
  // =================================================================================
  const { writeContract: executeTx, data: txHash, isPending: isTxPending, error: txError, reset: resetTx } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  // Handle Modal Close and Dispatch Toast
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
      setToast({ type: 'SUCCESS', message: 'Transaction Dispatched', subMessage: 'Awaiting network confirmation...', hash: txHash });
    }
  }, [txHash, isModalOpen]);

  // Handle Final Blockchain Confirmation
  useEffect(() => {
    if (isConfirmed && txHash) {
      setToast({ type: 'SUCCESS', message: 'Transaction Confirmed', subMessage: 'Treasury state successfully updated.', hash: txHash });
      setAmount('');
      resetTx();
      
      // Delay refetch slightly to ensure RPC node has the latest block data
      setTimeout(() => {
        refetchEth();
        refetchDiso();
        refetchUser();
      }, 3000);
    }
    
    if (txError) {
       setToast({ type: 'ERROR', message: 'Transaction Failed', subMessage: (txError as any)?.shortMessage || "The request was rejected or failed." });
       resetTx();
    }
  }, [isConfirmed, txError]);

  // --- HANDLERS ---
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
      const maxVal = parseFloat(formatEther(userBalance.value)) - 0.001; // leave 0.001 for gas
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
        alert("Governance Proposal Required to bypass Timelock. Direct withdrawals are disabled for security.");
    }
  };

  return (
    <div className="h-screen w-full bg-[#05050a] text-gray-300 font-sans selection:bg-[#00f3ff]/30 flex flex-col overflow-hidden relative">
      
      {/* =========================
          CURSOR NEON SPOTLIGHT
      ========================= */}
      <div
        className="fixed z-[60] pointer-events-none w-[400px] h-[400px] rounded-full blur-[180px] bg-[#00f3ff]/5 transition-transform duration-75 mix-blend-screen"
        style={{
          transform: `translate(${cursorPos.x - 200}px, ${cursorPos.y - 200}px)`,
          left: 0,
          top: 0,
        }}
      />

      {/* =========================
          RIGHT SIDE PROGRESS BAR
      ========================= */}
      <div className="fixed top-0 right-0 w-1 h-full bg-white/5 z-[100]">
        <div
          className="bg-gradient-to-b from-[#00f3ff] via-purple-500 to-[#00f3ff] w-full transition-all duration-100 ease-out"
          style={{ height: `${progress}%` }}
        />
      </div>

      {/* =========================
          BACKGROUND (SOFT GLOW)
      ========================= */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00f3ff]/5 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none"></div>
      </div>

      {/* Navbar (Fixed for both Mobile & Laptop) */}
      <nav className="border-b border-white/5 bg-[#05050a]/90 backdrop-blur-md z-50 flex-shrink-0 flex flex-col">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 w-full flex items-center justify-between">
          
          <div className="flex items-center gap-3 md:gap-6">
            <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-all text-[11px] font-mono tracking-widest uppercase">
              <ArrowLeft size={14} /> 
              <span className="hidden sm:inline">Back to Terminal</span>
            </Link>
            <div className="h-6 w-px bg-white/5 hidden md:block"></div>
            <div className="flex items-center gap-2 md:gap-3">
               <Shield className="text-gray-400" size={16} />
               <span className="font-bold tracking-wider text-gray-200 text-sm md:text-lg hidden xs:block">Sentinel Treasury</span>
            </div>
          </div>

          {/* Unified Connect Button for ALL screens */}
          <div className="flex items-center gap-4">
             <ConnectButton.Custom>
                {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
                  const connected = mounted && account && chain;
                  const wrongNetwork = connected && chain.id !== 11155111;
                  return (
                    <button 
                      onClick={wrongNetwork ? () => switchChain({ chainId: 11155111 }) : connected ? openAccountModal : openConnectModal}
                      className={`px-3 md:px-5 py-1.5 md:py-2 border rounded-lg font-mono text-[10px] md:text-[11px] uppercase tracking-wider transition-all flex items-center gap-2 ${
                          wrongNetwork ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' :
                          connected ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 
                          'bg-[#00f3ff]/10 border-[#00f3ff]/20 text-[#00f3ff] hover:bg-[#00f3ff]/20'
                      }`}
                    >
                      {connected ? (
                          wrongNetwork ? (
                            <>
                               <AlertTriangle size={12} className="md:hidden" />
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
      <main ref={mainRef} className="flex-1 overflow-y-auto z-10 custom-scroll relative">
        <div className="max-w-5xl mx-auto p-6 md:p-10 relative z-10">
          
          {/* Header Action Section */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-gray-500 text-[10px] font-mono tracking-widest uppercase">System Secure</span>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
               <div>
                  <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight text-gray-100">
                    Vault Operations
                  </h1>
                  <p className="text-gray-500 text-sm font-light max-w-xl leading-relaxed">
                    Manage and monitor DAO assets. All funds are secured by a 48-hour Timelock delay.
                  </p>
               </div>
               <div className="flex gap-3 w-full md:w-auto">
                  <button onClick={() => openModal('DEPOSIT')} className="flex-1 md:flex-none px-8 py-3 bg-gray-200 text-black font-bold text-sm tracking-wide rounded-xl hover:bg-white transition-all">
                    Deposit
                  </button>
                  <button onClick={() => openModal('WITHDRAW')} className="flex-1 md:flex-none px-8 py-3 bg-[#0a0a0f] border border-white/10 text-gray-300 font-bold text-sm tracking-wide rounded-xl hover:bg-white/5 transition-all">
                    Withdraw
                  </button>
               </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
             <div className="bg-[#0a0a0f] p-6 border border-white/5 rounded-2xl">
                <p className="text-gray-500 text-xs font-mono uppercase tracking-wider mb-2">Total Value Locked</p>
                <h2 className="text-3xl font-bold text-gray-100 font-mono">
                   {treasuryEthBalance && ethPrice 
                      ? `$${(parseFloat(formatEther(treasuryEthBalance)) * ethPrice).toLocaleString(undefined, {minimumFractionDigits: 2})}`
                      : "$0.00"
                   }
                </h2>
             </div>

             <div className="bg-[#0a0a0f] p-6 border border-white/5 rounded-2xl">
                <p className="text-gray-500 text-xs font-mono uppercase tracking-wider mb-2">Oracle Price (ETH)</p>
                <h2 className="text-3xl font-bold text-gray-100 font-mono">${ethPrice.toLocaleString()}</h2>
             </div>

             <div className="bg-[#0a0a0f] p-6 border border-white/5 rounded-2xl">
                <p className="text-gray-500 text-xs font-mono uppercase tracking-wider mb-2">Security Protocol</p>
                <h2 className="text-3xl font-bold text-green-400">Active</h2>
             </div>
          </div>

          {/* Interaction Section */}
          <div className="border-t border-white/5 pt-8">
             <div className="flex gap-8 mb-8 border-b border-white/5 pb-px">
                {[
                  { id: 'tokens', label: 'Assets' },
                  { id: 'nft_vault', label: 'NFT Vault' },
                  { id: 'trans_history', label: 'Activity Log' }
                ].map((tab) => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`text-xs font-bold uppercase tracking-wider transition-all pb-3 border-b-2 ${
                        activeTab === tab.id ? 'text-[#00f3ff] border-[#00f3ff]' : 'text-gray-600 border-transparent hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
             </div>

             <div className="min-h-[400px]">
                {/* TOKENS TAB */}
                {activeTab === 'tokens' && (
                  <div className="grid gap-3">
                     
                     {/* ETH Asset Row */}
                     <div className="bg-[#0a0a0f] p-6 border border-white/5 rounded-2xl flex items-center justify-between hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                              <span className="text-gray-200 font-mono font-bold">ETH</span>
                           </div>
                           <div>
                              <h4 className="font-bold text-gray-200 uppercase tracking-wide">Sepolia Ether</h4>
                              <p className="text-[10px] text-gray-500 font-mono tracking-wider mt-1">Native Asset</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xl font-bold text-gray-200 font-mono">{formatEther(treasuryEthBalance ?? BigInt(0)).slice(0, 8)}</p>
                           <p className="text-xs text-gray-500 font-mono mt-1">≈ ${(parseFloat(formatEther(treasuryEthBalance ?? BigInt(0))) * ethPrice).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        </div>
                     </div>

                     {/* Dynamically Render ERC-20 Tokens (Specifically DISO) */}
                     {SUPPORTED_TOKENS.filter(t => !t.isNative).map(token => {
                        const isDiso = token.symbol === 'DISO';
                        const tokenBalance = isDiso && treasuryDisoBalance ? parseFloat(formatEther(treasuryDisoBalance as bigint)) : 0;
                        
                        return (
                          <div key={token.symbol} className="bg-[#0a0a0f] p-6 border border-white/5 rounded-2xl flex items-center justify-between opacity-80 hover:opacity-100 hover:border-white/10 transition-all">
                             <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                                   <span className={`font-mono font-bold ${isDiso ? 'text-purple-400' : 'text-gray-400'}`}>
                                      {token.symbol.substring(0, 3)}
                                   </span>
                                </div>
                                <div>
                                   <h4 className="font-bold text-gray-300 uppercase tracking-wide">{token.name}</h4>
                                   <p className={`text-[10px] font-mono tracking-wider mt-1 ${isDiso ? 'text-purple-400' : 'text-gray-500'}`}>
                                       {isDiso ? 'Governance Token' : 'ERC-20 Token'}
                                   </p>
                                </div>
                             </div>
                             <div className="text-right">
                                 <p className="text-xl font-bold text-gray-400 font-mono">
                                   {tokenBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                 </p>
                                 <p className="text-xs text-gray-600 font-mono mt-1">--</p>
                             </div>
                          </div>
                        );
                     })}
                  </div>
                )}

                {/* NFT TAB */}
                {activeTab === 'nft_vault' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {DEMO_NFTS.map((nft) => (
                       <div key={nft.id} className="bg-[#0a0a0f] border border-white/5 rounded-2xl p-4 hover:bg-[#101018] transition-colors cursor-pointer">
                          <div className="w-full aspect-square bg-black/50 rounded-xl mb-4 flex items-center justify-center border border-white/5">
                              <ImageIcon size={32} className="text-gray-600"/>
                          </div>
                          <h4 className="text-xs font-bold text-gray-200 mb-1">{nft.name}</h4>
                          <div className="flex justify-between items-center mt-2">
                             <span className="text-[10px] text-gray-500 font-mono">{nft.collection}</span>
                             <span className="text-[9px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded uppercase">{nft.tier}</span>
                          </div>
                       </div>
                     ))}
                  </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'trans_history' && (
                  <div className="space-y-3">
                     {recentTx.length > 0 ? recentTx.map((tx, i) => (
                        <div key={i} className="p-5 bg-[#0a0a0f] border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                           <div className="flex items-center gap-5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'DEPOSIT' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                 {tx.type === 'DEPOSIT' ? <ArrowDownLeft size={14}/> : <ArrowUpRight size={14}/>}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-gray-200">{tx.type}</h4>
                                <span className="text-xs text-gray-500 font-mono">{tx.timestamp}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-6">
                              <span className="text-gray-300 font-mono text-sm">{tx.amount}</span>
                              <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" className="flex items-center gap-1 text-[11px] text-[#00f3ff] hover:underline bg-[#00f3ff]/10 px-2 py-1 rounded">
                                <ExternalLink size={12}/> Explorer
                              </a>
                           </div>
                        </div>
                     )) : (
                        <div className="text-center py-24 border border-dashed border-white/5 rounded-2xl">
                           <History className="mx-auto text-gray-600 mb-3" size={24}/>
                           <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">No Recent Activity</p>
                        </div>
                     )}
                  </div>
                )}
             </div>
          </div>
        </div>
      </main>

      {/* ================= TRANSFER MODAL (SOFT THEME) ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-[#0f0f15] border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#15151c]">
                 <h3 className="text-sm font-bold text-gray-200 tracking-wide flex items-center gap-2">
                    {modalMode === 'DEPOSIT' ? <ArrowDownLeft size={16} className="text-gray-400"/> : <ArrowUpRight size={16} className="text-gray-400"/>}
                    {modalMode} ASSETS
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors">
                    <X size={18}/>
                 </button>
              </div>

              <div className="p-6 space-y-6">
                 {/* Asset Selection */}
                 <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Asset</label>
                    <div className="relative">
                        <select 
                           className="w-full bg-[#1a1a22] border border-white/5 rounded-xl py-3 px-4 text-gray-200 text-sm focus:border-[#00f3ff]/50 outline-none appearance-none transition-all"
                           onChange={(e) => {
                               const token = SUPPORTED_TOKENS.find(t => t.symbol === e.target.value);
                               if(token) setSelectedToken(token);
                           }}
                           value={selectedToken.symbol}
                        >
                           {SUPPORTED_TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.name} ({t.symbol})</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
                    </div>
                 </div>

                 {/* Amount Input */}
                 <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Transfer Amount</label>
                        {isConnected && (
                            <div className="flex items-center gap-2 text-[11px] font-mono text-gray-500">
                               <span>Available: {getAvailableAmount().toFixed(4)} {selectedToken.symbol}</span>
                               <button onClick={setMaxAmount} className="text-[#00f3ff] hover:underline font-bold ml-1">
                                   MAX
                               </button>
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <input 
                           type="number" 
                           placeholder="0.0"
                           value={amount}
                           onChange={(e) => setAmount(e.target.value)}
                           className="w-full bg-[#1a1a22] border border-white/5 rounded-xl py-4 px-4 text-2xl font-mono text-gray-200 outline-none focus:border-[#00f3ff]/50 transition-all placeholder:text-gray-700"
                        />
                    </div>
                 </div>

                 {/* Action Button */}
                 <ConnectButton.Custom>
                    {({ account, chain, openConnectModal, mounted }) => {
                        const connected = mounted && account && chain;
                        const wrongNetwork = connected && chain.id !== 11155111;
                        return (
                            <button 
                                onClick={() => {
                                    if (!connected) openConnectModal();
                                    else if (wrongNetwork) switchChain({ chainId: 11155111 });
                                    else handleAction();
                                }}
                                disabled={connected && !wrongNetwork && (isTxPending || isConfirming || !amount)}
                                className={`w-full py-4 rounded-xl font-bold uppercase text-sm tracking-wide transition-all flex justify-center items-center gap-2 ${
                                    !connected ? 'bg-gray-200 text-black hover:bg-white' :
                                    wrongNetwork ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    'bg-white text-black hover:bg-gray-200'
                                } ${(connected && !wrongNetwork && (!amount || isTxPending || isConfirming)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isTxPending || isConfirming ? <Loader2 className="animate-spin" size={18}/> : null}
                                {!connected ? "Connect Wallet" : wrongNetwork ? "Switch Network" : isTxPending || isConfirming ? "Processing..." : `Confirm ${modalMode}`}
                            </button>
                        );
                    }}
                 </ConnectButton.Custom>
              </div>
           </div>
        </div>
      )}

      {/* ================= GLOBAL TOAST (EXPLORER SYNCED) ================= */}
      {toast && (
        <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[2000] animate-in slide-in-from-right duration-300 w-[calc(100%-3rem)] md:w-auto">
           <div className={`flex items-start gap-4 p-5 rounded-2xl border backdrop-blur-xl shadow-2xl max-w-sm bg-[#0a0a0f]/95 ${
              toast.type === 'SUCCESS' ? 'border-[#00f3ff]/30' : 'border-red-500/30'
           }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'SUCCESS' ? 'bg-[#00f3ff]/10 text-[#00f3ff]' : 'bg-red-500/10 text-red-400'}`}>
                 {toast.type === 'SUCCESS' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
              </div>
              <div className="flex-1 mt-0.5">
                 <h4 className={`text-sm font-bold tracking-wide mb-1 ${toast.type === 'SUCCESS' ? 'text-gray-200' : 'text-red-400'}`}>
                    {toast.message}
                 </h4>
                 <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                    {toast.subMessage}
                 </p>
                 {toast.hash && (
                   <a href={`https://sepolia.etherscan.io/tx/${toast.hash}`} target="_blank" className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#00f3ff] hover:underline bg-[#00f3ff]/10 px-3 py-1.5 rounded-lg border border-[#00f3ff]/20 transition-colors">
                     <ExternalLink size={12}/> View Transaction
                   </a>
                 )}
              </div>
              <button onClick={() => setToast(null)} className="text-gray-500 hover:text-white transition-colors p-1">
                 <X size={16}/>
              </button>
           </div>
        </div>
      )}

    </div>
  );
}