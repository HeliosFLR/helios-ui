import { isMainnet } from './chains'

// Contract addresses per network
const TESTNET_CONTRACTS = {
  LB_FACTORY: '0xdbfD526E99E458EA640b524cbC671650Be29aFD1' as const,
  LB_ROUTER: '0xe62c4c776A79cBF66426519f282121684Be4fCdE' as const,
  LB_QUOTER: '0xeD0015D2d92fFbeE894f55645dDb4078dFEbE30d' as const,
}

// Mainnet contracts (to be deployed)
const MAINNET_CONTRACTS = {
  LB_FACTORY: '0x0000000000000000000000000000000000000000' as const, // TODO: Deploy to mainnet
  LB_ROUTER: '0x0000000000000000000000000000000000000000' as const,
  LB_QUOTER: '0x0000000000000000000000000000000000000000' as const,
}

export const CONTRACTS = isMainnet ? MAINNET_CONTRACTS : TESTNET_CONTRACTS

export interface Token {
  address: `0x${string}`
  symbol: string
  name: string
  decimals: number
  logoUrl?: string
}

// All testnet tokens (for faucet, pools display, positions)
const TESTNET_ALL_TOKENS: Token[] = [
  {
    address: '0x2b8aD1d8f130881d9b23Cb523E2Bccc996f11B4e',
    symbol: 'WFLR',
    name: 'Wrapped Flare',
    decimals: 18,
    logoUrl: '/tokens/wflr.png',
  },
  {
    address: '0xfB864E898bBc04D1df1a1BCa381BbaefD511fB2A',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logoUrl: '/tokens/usdt.png',
  },
  {
    address: '0x5dcA2A1539c2C36335F4B14D0437C1e4065C8434',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoUrl: '/tokens/usdc.png',
  },
  {
    address: '0xf2F8BDfd3A216f684756768160cb3BFdF26b03f0',
    symbol: 'sFLR',
    name: 'Staked Flare',
    decimals: 18,
    logoUrl: '/tokens/sflr.webp',
  },
]

// Tokens available for swapping (only same-decimal pairs work due to LB bug)
const TESTNET_SWAP_TOKENS: Token[] = [
  TESTNET_ALL_TOKENS[2], // USDC
  TESTNET_ALL_TOKENS[1], // USDT
]

// Legacy export - use ALL_TOKENS for general token list
const TESTNET_TOKENS = TESTNET_ALL_TOKENS

// Mainnet tokens (common tokens on Flare)
const MAINNET_TOKENS: Token[] = [
  {
    address: '0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d', // WFLR on mainnet
    symbol: 'WFLR',
    name: 'Wrapped Flare',
    decimals: 18,
    logoUrl: '/tokens/wflr.png',
  },
  {
    address: '0x0000000000000000000000000000000000000000', // TODO: Add real USDT address
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logoUrl: '/tokens/usdt.png',
  },
  {
    address: '0x0000000000000000000000000000000000000000', // TODO: Add real USDC address
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoUrl: '/tokens/usdc.png',
  },
  {
    address: '0x12e605bc104e93B45e1aD99F9e555f659051c2BB', // sFLR on mainnet
    symbol: 'sFLR',
    name: 'Staked Flare',
    decimals: 18,
    logoUrl: '/tokens/sflr.webp',
  },
]

export const TOKENS: Token[] = isMainnet ? MAINNET_TOKENS : TESTNET_TOKENS

// Tokens available for swapping (limited due to testnet LB decimal bug)
export const SWAP_TOKENS: Token[] = isMainnet ? MAINNET_TOKENS : TESTNET_SWAP_TOKENS

export interface Pool {
  address: `0x${string}`
  tokenX: Token
  tokenY: Token
  binStep: number
}

// Testnet pools - All deployed pools (some have swap issues due to decimal bug)
const TESTNET_POOLS: Pool[] = [
  {
    // WFLR/USDT pool - has decimal bug, swaps don't work but positions display
    address: '0x4eD647bF1821878870e50c115785D2b4674fA5A2',
    tokenX: TESTNET_ALL_TOKENS[0], // WFLR
    tokenY: TESTNET_ALL_TOKENS[1], // USDT
    binStep: 15,
  },
  {
    // USDC/USDT pool - working pool with same decimals
    address: '0x7ceC6A917f881F2916C6243c48D9c43ff5594459',
    tokenX: TESTNET_ALL_TOKENS[2], // USDC
    tokenY: TESTNET_ALL_TOKENS[1], // USDT
    binStep: 15,
  },
]

// Mainnet pools (to be deployed)
const MAINNET_POOLS: Pool[] = [
  // Pools will be added after mainnet deployment
]

export const POOLS: Pool[] = isMainnet ? MAINNET_POOLS : TESTNET_POOLS

export const getTokenBySymbol = (symbol: string): Token | undefined => {
  return TOKENS.find(t => t.symbol === symbol)
}

export const getTokenByAddress = (address: string): Token | undefined => {
  return TOKENS.find(t => t.address.toLowerCase() === address.toLowerCase())
}

// Block explorer URL helper
export const getExplorerUrl = (type: 'tx' | 'address' | 'token', hash: string): string => {
  const baseUrl = isMainnet
    ? 'https://flare-explorer.flare.network'
    : 'https://coston2-explorer.flare.network'

  return `${baseUrl}/${type}/${hash}`
}


// Flare FTSO Contract Addresses
export const FLARE_CONTRACT_REGISTRY = '0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019' as const

// WNat (Wrapped Native) addresses
export const WNAT_ADDRESS = isMainnet
  ? '0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d' as const
  : '0xC67DCE33D7A8efA5FfEB961899C73fe01bCe9273' as const

// FTSO Data Providers for delegation
export interface FTSOProvider {
  address: `0x${string}`
  name: string
  description: string
}

export const FTSO_PROVIDERS: FTSOProvider[] = isMainnet
  ? [
      { address: '0xbf61db1cdb43d196309824473fa82e5b17581159', name: 'FTSO AU', description: 'Australian provider' },
      { address: '0x9a46864a3b0a7805b266c445289c3fad1e48f18e', name: 'FTSO EU', description: 'European provider' },
    ]
  : [
      { address: '0x9565d813a3c1e537B34854bE0E1597E70cA3e0a1', name: 'Test Provider 1', description: 'Coston2 test' },
      { address: '0x3a6e101103ec3d9267d08f484a6b70e1440a8255', name: 'Test Provider 2', description: 'Coston2 test' },
    ]

// FTSO Reward Manager addresses (fetched via FlareContractRegistry)
export const FTSO_REWARD_MANAGER_ADDRESS = isMainnet
  ? '0xc5738334b972745067fFa666040fdeADc66Cb925' as const // Flare mainnet
  : '0x85D193176C4D44Fa80d3d27315bc0ad36d2dd449' as const // Coston2 testnet
