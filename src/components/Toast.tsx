'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { CheckCircle2, XCircle, AlertCircle, X, ExternalLink, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  txHash?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (title: string, message?: string, txHash?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    const newToast = { ...toast, id }

    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    const duration = toast.duration ?? (toast.type === 'error' ? 8000 : 5000)
    setTimeout(() => removeToast(id), duration)
  }, [removeToast])

  const success = useCallback((title: string, message?: string, txHash?: string) => {
    addToast({ type: 'success', title, message, txHash })
  }, [addToast])

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message })
  }, [addToast])

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message })
  }, [addToast])

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: () => void }) {
  const { type, title, message, txHash } = toast

  const config = {
    success: {
      icon: CheckCircle2,
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      iconColor: 'text-emerald-500',
      titleColor: 'text-emerald-400',
    },
    error: {
      icon: XCircle,
      bg: 'bg-red-500/10 border-red-500/30',
      iconColor: 'text-red-500',
      titleColor: 'text-red-400',
    },
    warning: {
      icon: AlertCircle,
      bg: 'bg-dune-400/10 border-dune-400/30',
      iconColor: 'text-dune-400',
      titleColor: 'text-dune-300',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-500/10 border-blue-500/30',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-400',
    },
  }[type]

  const Icon = config.icon

  return (
    <div
      className={cn(
        'pointer-events-auto glass-card rounded-2xl border p-4 shadow-2xl animate-float-up',
        config.bg
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-1.5 rounded-lg', config.bg)}>
          <Icon className={cn('h-5 w-5', config.iconColor)} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn('font-semibold text-sm', config.titleColor)}>{title}</p>
          {message && (
            <p className="text-xs text-zinc-400 mt-1 break-words">{message}</p>
          )}
          {txHash && (
            <a
              href={`https://coston2-explorer.flare.network/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-dune-400 hover:text-dune-300 mt-2"
            >
              View transaction
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <button
          onClick={onRemove}
          className="p-1 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
