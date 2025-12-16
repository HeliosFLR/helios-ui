'use client'

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http, fallback } from 'viem'
import { activeChain, flare, coston2, isMainnet } from './chains'

// Configure chains based on environment
// In production, show only mainnet. In development, show testnet.
const chains = isMainnet ? [flare] : [coston2]

// Create fallback transports with retry logic for each chain
const coston2Transport = fallback([
  http('https://coston2-api.flare.network/ext/C/rpc', {
    retryCount: 3,
    retryDelay: 1000,
    timeout: 30000,
  }),
  http('https://coston2.enosys.global/ext/C/rpc', {
    retryCount: 3,
    retryDelay: 1000,
    timeout: 30000,
  }),
  http('https://rpc.ankr.com/flare_coston2', {
    retryCount: 3,
    retryDelay: 1000,
    timeout: 30000,
  }),
])

const flareTransport = fallback([
  http('https://flare-api.flare.network/ext/C/rpc', {
    retryCount: 3,
    retryDelay: 1000,
    timeout: 30000,
  }),
  http('https://flare.enosys.global/ext/C/rpc', {
    retryCount: 3,
    retryDelay: 1000,
    timeout: 30000,
  }),
])

export const config = getDefaultConfig({
  appName: 'Helios DEX',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'helios-dex-demo',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chains: chains as any,
  ssr: true,
  transports: {
    [coston2.id]: coston2Transport,
    [flare.id]: flareTransport,
  },
})

export { isMainnet, activeChain }
