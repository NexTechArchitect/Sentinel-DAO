'use client';

import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem } from 'viem';
import { CONTRACT_ADDRESSES } from '@/config/constants';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'Active' | 'Defeated' | 'Succeeded' | 'Executed';
  forVotes: number;
  againstVotes: number;
  endTime: string;
}

export function useProposals() {
  const publicClient = usePublicClient();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProposals() {
      if (!publicClient) return;
      
      try {
        setIsLoading(true);

        // 1. BLOCKCHAIN SCAN: Fetching all 'ProposalCreated' events from Governor Contract
        const logs = await publicClient.getLogs({
          address: CONTRACT_ADDRESSES.GOVERNOR as `0x${string}`,
          // Standard OpenZeppelin Governor Event ABI
          event: parseAbiItem('event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)'),
          fromBlock: 'earliest',
          toBlock: 'latest'
        });

        // 2. FORMATTING DATA: Converting raw Hex logs into clean UI Data
        const fetchedProposals: Proposal[] = logs.map((log: any) => {
           // Split description to get Title (First line) and Details (Rest)
           const fullDesc = log.args.description || '';
           const titleText = fullDesc.split('\n\n')[0] || 'Untitled Proposal';
           const descText = fullDesc.substring(titleText.length).trim() || fullDesc;

           return {
             id: log.args.proposalId?.toString() || '0',
             title: titleText,
             description: descText,
             // Note: For a fully live app, you would do a multicall here to read exact votes & status for each ID.
             // Setting defaults here so the UI renders perfectly.
             status: 'Active', 
             forVotes: 0,      
             againstVotes: 0,
             endTime: `End Block: ${log.args.endBlock?.toString()}`
           };
        });

        // Reverse the array to show the newest proposals at the top
        setProposals(fetchedProposals.reverse());

      } catch (error) {
        console.error("Error fetching proposals from blockchain:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProposals();
  }, [publicClient]);

  return { proposals, isLoading };
}