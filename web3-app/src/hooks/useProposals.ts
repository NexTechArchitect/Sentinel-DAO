'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem } from 'viem';
import { CONTRACT_ADDRESSES, GOVERNOR_ABI } from '@/config/constants';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'Active' | 'Pending' | 'Executed' | 'Defeated' | 'Succeeded' | 'Queued' | 'Expired' | 'Canceled';
  forVotes: number;
  againstVotes: number;
  endBlock: string;
  startBlock: string;
  timeInfo: string;
}

export function useProposals() {
  const publicClient = usePublicClient();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProposals = useCallback(async () => {
    if (!publicClient) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const currentBlock = await publicClient.getBlockNumber();
      console.log("📍 Current Block:", currentBlock);

      const logs = await publicClient.getLogs({
        address: CONTRACT_ADDRESSES.GOVERNOR as `0x${string}`,
        event: parseAbiItem('event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)'),
        fromBlock: BigInt(5000000), 
        toBlock: 'latest'
      });

      console.log("📋 Events Found:", logs.length);

      if (logs.length === 0) {
        setProposals([]);
        setIsLoading(false);
        return;
      }

      const processedProposals = await Promise.all(
        logs.map(async (log) => {
          try {
            const args = log.args;
            const proposalId = args.proposalId?.toString() || '0';
            
            const fullDesc = args.description || '';
            const [title, ...descParts] = fullDesc.split('\n\n');
            const description = descParts.join('\n\n') || fullDesc;

            const startBlock = args.startBlock ? BigInt(args.startBlock.toString()) : BigInt(0);
            const endBlock = args.endBlock ? BigInt(args.endBlock.toString()) : BigInt(0);

            let status: Proposal['status'] = 'Pending';
            let timeInfo = 'Loading...';

            try {
                const state = await publicClient.readContract({
                address: CONTRACT_ADDRESSES.GOVERNOR as `0x${string}`,
                abi: GOVERNOR_ABI,
                functionName: 'state',
                args: [BigInt(proposalId)],
              }) as number;

              switch (state) {
                case 0: status = 'Pending'; break;
                case 1: status = 'Active'; break;
                case 2: status = 'Canceled'; break;
                case 3: status = 'Defeated'; break;
                case 4: status = 'Succeeded'; break;
                case 5: status = 'Queued'; break;
                case 6: status = 'Expired'; break;
                case 7: status = 'Executed'; break;
                default: status = 'Defeated';
              }

              const SEPOLIA_AVG_BLOCK_TIME = 12; 
              
              if (status === 'Pending') {
                const blocksLeft = startBlock - currentBlock;
                if (blocksLeft > BigInt(0)) {
                   const secs = Number(blocksLeft) * SEPOLIA_AVG_BLOCK_TIME;
                   const hours = Math.floor(secs / 3600);
                   timeInfo = `Starts in ${hours}h ${Math.floor((secs % 3600) / 60)}m`;
                } else {
                   timeInfo = "Starting...";
                }
              } else if (status === 'Active') {
                const blocksLeft = endBlock - currentBlock;
                if (blocksLeft > BigInt(0)) {
                   const secs = Number(blocksLeft) * SEPOLIA_AVG_BLOCK_TIME;
                   const hours = Math.floor(secs / 3600);
                   timeInfo = `Ends in ${hours}h ${Math.floor((secs % 3600) / 60)}m`;
                } else {
                   timeInfo = "Ending...";
                }
              } else {
                timeInfo = status;
              }

            } catch (err) {
              console.warn(`Could not fetch state for ${proposalId}, using fallback.`)
              if (currentBlock < startBlock) status = 'Pending';
              else if (currentBlock <= endBlock) status = 'Active';
              else status = 'Defeated'; 
            }

            return {
              id: proposalId,
              title: title || "Untitled Proposal",
              description: description,
              status,
              forVotes: 0,
              againstVotes: 0, 
              startBlock: startBlock.toString(),
              endBlock: endBlock.toString(),
              timeInfo
            } as Proposal;

          } catch (innerErr) {
            console.error("Error processing single proposal:", innerErr);
            return null;
          }
        })
      );

      const validProposals = processedProposals.filter((p): p is Proposal => p !== null);
      setProposals(validProposals.reverse());

    } catch (error) {
      console.error("Fatal Error fetching proposals:", error);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    fetchProposals();
    const interval = setInterval(fetchProposals, 15000); 
    return () => clearInterval(interval);
  }, [fetchProposals]);

  return { proposals, isLoading, refetch: fetchProposals };
}