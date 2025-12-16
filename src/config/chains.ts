import { defineChain } from 'viem'

// Flare Mainnet
export const flare = defineChain({
  id: 14,
  name: 'Flare',
  nativeCurrency: {
    decimals: 18,
    name: 'Flare',
    symbol: 'FLR',
  },
  rpcUrls: {
    default: {
      http: ['https://flare-api.flare.network/ext/C/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Flare Explorer',
      url: 'https://flare-explorer.flare.network',
    },
  },
  testnet: false,
})

// Coston2 Testnet
export const coston2 = defineChain({
  id: 114,
  name: 'Coston2',
  nativeCurrency: {
    decimals: 18,
    name: 'Coston2 Flare',
    symbol: 'C2FLR',
  },
  rpcUrls: {
    default: {
      http: [
        'https://coston2-api.flare.network/ext/C/rpc',
        'https://coston2.enosys.global/ext/C/rpc',
        'https://rpc.ankr.com/flare_coston2',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Coston2 Explorer',
      url: 'https://coston2-explorer.flare.network',
    },
  },
  testnet: true,
})

// Network selection based on environment
export const isMainnet = process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
export const activeChain = isMainnet ? flare : coston2
