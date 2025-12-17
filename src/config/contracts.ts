import { isMainnet } from './chains'

// Contract addresses per network
const TESTNET_CONTRACTS = {
  LB_FACTORY: '0xdbfD526E99E458EA640b524cbC671650Be29aFD1' as const,
  LB_ROUTER: '0x39883bb80737ADeC305dE54e5BF16466862e6992' as const,
  LB_QUOTER: '0xBB40204e7DEEdF6209D5DD8B4dFf7A9ba12c88aB' as const,
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
    address: '0xC67DCE33D7A8efA5FfEB961899C73fe01bCe9273',
    symbol: 'WC2FLR',
    name: 'Wrapped C2FLR',
    decimals: 18,
    logoUrl: '/tokens/wflr.png',
  },
  {
    address: '0xC1A5B41512496B80903D1f32d6dEa3a73212E71F',
    symbol: 'USDT0',
    name: 'Test USDT',
    decimals: 6,
    logoUrl: '/tokens/usdt.png',
  },
  {
    address: '0x0b6A3645c240605887a5532109323A3E12273dc7',
    symbol: 'FXRP',
    name: 'FTestXRP',
    decimals: 18,
    logoUrl: '/tokens/xrp.png',
  },
  {
    address: '0xfB864E898bBc04D1df1a1BCa381BbaefD511fB2A',
    symbol: 'USDT',
    name: 'Mock USDT',
    decimals: 6,
    logoUrl: '/tokens/usdt.png',
  },
  {
    address: '0x5dcA2A1539c2C36335F4B14D0437C1e4065C8434',
    symbol: 'USDC',
    name: 'Mock USDC',
    decimals: 6,
    logoUrl: '/tokens/usdc.png',
  },
]

// Tokens available for swapping
const TESTNET_SWAP_TOKENS: Token[] = [
  TESTNET_ALL_TOKENS[0], // WC2FLR
  TESTNET_ALL_TOKENS[1], // USDT0
  TESTNET_ALL_TOKENS[2], // FXRP
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

// Testnet pools - Coston2 deployed pools
const TESTNET_POOLS: Pool[] = [
  {
    // WC2FLR/USDT0 pool - main trading pool
    address: '0x081D1B7FB116081E33fB8CE4bC1b67e1beC8fC5b',
    tokenX: TESTNET_ALL_TOKENS[0], // WC2FLR
    tokenY: TESTNET_ALL_TOKENS[1], // USDT0
    binStep: 10,
  },
  {
    // WC2FLR/FXRP pool
    address: '0x973b97F283dc6aC10b3b8ba3289dc55494f86540',
    tokenX: TESTNET_ALL_TOKENS[0], // WC2FLR
    tokenY: TESTNET_ALL_TOKENS[2], // FXRP
    binStep: 10,
  },
  {
    // FXRP/USDT0 pool
    address: '0x63865F25f55aC6D2A35eB1Ad16E9Cbd14Ed335A9',
    tokenX: TESTNET_ALL_TOKENS[2], // FXRP
    tokenY: TESTNET_ALL_TOKENS[1], // USDT0
    binStep: 10,
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
