'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';

export function useDAOData() {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [daoStats, setDaoStats] = useState({
    treasuryBalance: '124.50 ETH',
    activeProposals: 3,
    totalMembers: 1420,
    userVotingPower: '1,500 veTokens',
  });

  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1500); 
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  return {
    ...daoStats,
    isLoading,
  };
}