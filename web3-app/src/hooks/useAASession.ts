'use client';

import { useAccount, useSignMessage } from 'wagmi';
import { useState, useEffect } from 'react';

interface SessionState {
  isSessionActive: boolean;
  nonce: bigint;
  isLoading: boolean;
  error: string | null;
}

export function useAASession() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  const [sessionState, setSessionState] = useState<SessionState>({
    isSessionActive: false,
    nonce: BigInt(0),
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (isConnected && address) {
      const savedSession = localStorage.getItem(`sentinel_session_${address}`);
      if (savedSession === 'active') {
        setSessionState(prev => ({ 
          ...prev, 
          isSessionActive: true,
          nonce: BigInt(1) 
        }));
      }
    } else {
      setSessionState(prev => ({ ...prev, isSessionActive: false, nonce: BigInt(0) }));
    }
  }, [isConnected, address]);

  const createSession = async () => {
    if (!address) {
      setSessionState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return;
    }

    try {
      setSessionState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const message = `SENTINEL PROTOCOL\n\nVerify your institutional identity to establish a secure off-chain session.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;

      const signature = await signMessageAsync({ message });

      if (signature) {
        localStorage.setItem(`sentinel_session_${address}`, 'active');
        
        setSessionState(prev => ({ 
          ...prev, 
          isLoading: false, 
          isSessionActive: true,
          nonce: BigInt(1),
          error: null
        }));
      }
    } catch (err: any) {
      console.error('Signature failed or rejected:', err);
      setSessionState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: err.shortMessage || 'Signature request rejected by user.' 
      }));
    }
  };

  return {
    ...sessionState,
    createSession,
    isConnected, 
    address
  };
}