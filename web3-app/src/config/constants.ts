export const CONTRACT_ADDRESSES = {
  CORE: "0xf4ffd6558454c60E50ef97799C3D69758CB68cf6",
  GOVERNOR: "0x24BC3F0e1D0e8732Ce30fbf07EF36beCC9a9CAD3",
  GOV_TOKEN: "0x7F78740d138edEBC17334217b927F5c4D50ec1DB",
  TIMELOCK: "0xC4c57946dE2b9b585d05D21423Eee82501466FCd",
  CONFIG: "0x2DE65ABEA5dC9C0f18a4975e07E281a2a25C6EC1",
  TREASURY: "0xE113199AE42eF5E9df14a455a67ACC26C8901A4E",
  YIELD_STRATEGY: "0x843abAd0B13436b93E7ab71e075bED679586b524",
  ROLE_MANAGER: "0xa5720e4434da10b6c47D8D84542d5a77861A9d8F",
  VETO_COUNCIL: "0x4Abd12fAED0eabc8cC7825b503EB2B853C8a5278",
  PROPOSAL_GUARD: "0xC4015518192B3f86bF9F27DDeBEd253267D9C3bE",
  EMERGENCY_PAUSE: "0x5407869765C92dA9c3B039979170aaBFFaB3Ba96",
  RAGE_QUIT: "0x2c26e0b0BdA62434aA4e694a767cF2643C7b44a2",
  QF: "0xFb0455c92908b57c978Fe4B7BE9D1f870B58b198",
  CONVICTION_VOTING: "0x1142Fb9dCDB89eb98cea6fd7D2F606a16ea97A9b",
  CONVICTION_STAKING: "0x8C2b526d18fcF5F0bf3C820C12c3AAdcBbF7a8D7",
  DELEGATION_REGISTRY: "0x891addA9FfC646e5CB67015F5F6e667741b76B68",
  GOV_ANALYTICS: "0xD964E20628e5DC1A50592627AAfDF081FbA6d9CA",
  VOTING_SNAPSHOT: "0xaD95c644c731bbF6f5140D94354392fda6C100B4",
  UPGRADE_EXEC: "0x000D778BF4Bac6a4fF47C55Da82242bA23776D8D",
  OFFCHAIN_EXECUTOR: "0x3a40D29433453e241415f822364Afdf0a7d5996F",
  AA_FACTORY: "0x7B587a4A5F571486f4A8dc1bd6aDB745F71fE96e",
  PAYMASTER: "0x6927fc2B44008b5D05611194d47fa3451f9fE9cD",
  SESSION_KEY_MODULE: "0xA8F129d87Ba978aedFbd40D764445a706dAA95Fa",
  ENTRY_POINT: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  CHAINLINK_ETH_USD: "0x694AA1769357215DE4FAC081bf1f309aDC325306"
} as const;

export const SUPPORTED_TOKENS = [
  { symbol: 'ETH', name: 'Sepolia Ether', address: '0x0000000000000000000000000000000000000000', decimals: 18, isNative: true },
  { symbol: 'USDC', name: 'USD Coin', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6, isNative: false },
  { symbol: 'LINK', name: 'Chainlink', address: '0x779877A7B0D9E8603169DdbD7836e478b4624789', decimals: 18, isNative: false },
  { symbol: 'DISO', name: 'Sentinel Gov', address: CONTRACT_ADDRESSES.GOV_TOKEN, decimals: 18, isNative: false },
];

export const CHAINLINK_ABI = [
  { inputs: [], name: "latestRoundData", outputs: [{ name: "roundId", type: "uint80" }, { name: "answer", type: "int256" }, { name: "startedAt", type: "uint256" }, { name: "updatedAt", type: "uint256" }, { name: "answeredInRound", type: "uint80" }], stateMutability: "view", type: "function" }
] as const;

export const TREASURY_ABI = [
  { name: 'ethBalance', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'depositEth', type: 'function', stateMutability: 'payable', inputs: [], outputs: [] },
  { name: 'depositERC20', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'Withdrawal', type: 'event', inputs: [{ name: 'to', type: 'address', indexed: true }, { name: 'amount', type: 'uint256', indexed: false }] }
] as const;

export const ERC20_ABI = [
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }
] as const;

export const GOV_TOKEN_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'getVotes', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'delegates', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'address' }] },
  { name: 'delegate', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'delegatee', type: 'address' }], outputs: [] }
] as const;

export const GOVERNOR_ABI = [
  { name: 'propose', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'targets', type: 'address[]' }, { name: 'values', type: 'uint256[]' }, { name: 'calldatas', type: 'bytes[]' }, { name: 'description', type: 'string' }], outputs: [{ type: 'uint256' }] },
  { name: 'castVote', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'proposalId', type: 'uint256' }, { name: 'support', type: 'uint8' }], outputs: [{ type: 'uint256' }] },
  { name: 'state', type: 'function', stateMutability: 'view', inputs: [{ name: 'proposalId', type: 'uint256' }], outputs: [{ type: 'uint8' }] },
  { name: 'proposalThreshold', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'lastProposalTime', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'ProposalCreated', type: 'event', inputs: [{ name: 'proposalId', type: 'uint256', indexed: false }, { name: 'proposer', type: 'address', indexed: false }, { name: 'targets', type: 'address[]', indexed: false }, { name: 'values', type: 'uint256[]', indexed: false }, { name: 'signatures', type: 'string[]', indexed: false }, { name: 'calldatas', type: 'bytes[]', indexed: false }, { name: 'startBlock', type: 'uint256', indexed: false }, { name: 'endBlock', type: 'uint256', indexed: false }, { name: 'description', type: 'string', indexed: false }] }
] as const;

export const ROLE_MANAGER_ABI = [
  { name: 'isAdmin', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'bool' }] },
  { name: 'isGuardian', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'bool' }] },
  { name: 'grantRole', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'role', type: 'bytes32' }, { name: 'account', type: 'address' }], outputs: [] },
  { name: 'revokeRole', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'role', type: 'bytes32' }, { name: 'account', type: 'address' }], outputs: [] }
] as const;

export const GOV_ANALYTICS_ABI = [{ name: 'getStats', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: 'total', type: 'uint256' }, { name: 'successful', type: 'uint256' }, { name: 'failed', type: 'uint256' }] }] as const;

export const RAGE_QUIT_ABI = [{ name: 'hasRageQuit', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ type: 'bool' }] }, { name: 'quit', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'assets', type: 'address[]' }, { name: 'amount', type: 'uint256' }], outputs: [] }] as const;

export const GOV_TOKEN_EXTENDED_ABI = [...GOV_TOKEN_ABI, { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }] as const;

export const OFFCHAIN_EXECUTOR_ABI = [{ name: 'signer', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] }] as const;

export const DELEGATION_REGISTRY_ABI = [{ name: 'nonces', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ type: 'uint256' }] }, { name: 'delegateBySig', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'delegator', type: 'address' }, { name: 'delegatee', type: 'address' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }, { name: 'signature', type: 'bytes' }], outputs: [] }] as const;

export const SNAPSHOT_ABI = [{ name: 'createSnapshot', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'proposalId', type: 'uint256' }], outputs: [] }] as const;

export const EMERGENCY_PAUSE_ABI = [{ name: 'isPaused', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] }, { name: 'pause', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] }, { name: 'unpause', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] }] as const;

export const VETO_COUNCIL_ABI = [{ name: 'castVeto', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'proposalId', type: 'uint256' }], outputs: [] }] as const;

export const AA_FACTORY_ABI = [
  { name: 'createAccount', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'owner', type: 'address' }, { name: 'salt', type: 'uint256' }], outputs: [{ name: 'account', type: 'address' }] }
] as const;

export const SESSION_KEY_MODULE_ABI = [
  { 
    name: 'createSession', 
    type: 'function', 
    stateMutability: 'nonpayable', 
    inputs: [{ name: 'authorizedSigner', type: 'address' }], 
    outputs: [] 
  },
  { 
    name: 'getNonce', 
    type: 'function', 
    stateMutability: 'view', 
    inputs: [{ name: 'wallet', type: 'address' }], 
    outputs: [{ name: '', type: 'uint256' }] 
  },
  { 
    name: 'isSessionValid', 
    type: 'function', 
    stateMutability: 'view', 
    inputs: [{ name: 'wallet', type: 'address' }, { name: 'signer', type: 'address' }], 
    outputs: [{ name: '', type: 'bool' }] 
  }
] as const; 

export const SMART_ACCOUNT_ABI = [
  { name: 'execute', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'dest', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'func', type: 'bytes' }], outputs: [] }
] as const;