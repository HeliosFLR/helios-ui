'use client'
import { useState, useEffect, type ReactNode } from 'react'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '@/config/wagmi'
import { ToastProvider } from './Toast'
import { ThemeProvider, useTheme } from './ThemeProvider'
import '@rainbow-me/rainbowkit/styles.css'

// Create query client with better defaults for mobile
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 2,
        refetchOnWindowFocus: false, // Better for mobile
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: reuse the same query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

const heliosDarkTheme = darkTheme({
  accentColor: '#F59E0B',
  accentColorForeground: '#0F0F0F',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
})

const heliosLightTheme = lightTheme({
  accentColor: '#D97706',
  accentColorForeground: '#FFFFFF',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
})

function RainbowKitWithTheme({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  return (
    <RainbowKitProvider
      theme={theme === 'dark' ? heliosDarkTheme : heliosLightTheme}
      modalSize="compact"
    >
      {children}
    </RainbowKitProvider>
  )
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()
  const [mounted, setMounted] = useState(false)

  // Ensure hydration completes before rendering wallet components
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <ThemeProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {mounted ? (
            <RainbowKitWithTheme>
              <ToastProvider>
                {children}
              </ToastProvider>
            </RainbowKitWithTheme>
          ) : (
            <ToastProvider>
              {children}
            </ToastProvider>
          )}
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}
