import { useState, useEffect, type FormEvent } from 'react'
import { X, Lock, Mail, AlertCircle, LogIn, Loader2 } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSignIn: (e: FormEvent<HTMLFormElement>) => Promise<void>
}

export function AuthModal({
  isOpen,
  onClose,
  onSignIn,
}: AuthModalProps) {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Accessible Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    try {
      await onSignIn(e)
    } catch (err) {
      if (err instanceof Error) {
        setErrorMsg(err.message)
      } else {
        setErrorMsg('Authentication failed. Please verify your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0c241e]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Window */}
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-xl border border-[#e2ece7] animate-fade-in z-10">
        <div className="flex items-center justify-between pb-4 border-b border-[#edf3f0]">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-[#164e43] uppercase">
              Institutional Portal
            </span>
            <h2 id="modal-title" className="text-xl font-bold font-heading text-[#13221e]">
              Sign in to LabReserve
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#556c64] hover:bg-[#eff8f4] hover:text-[#164e43] transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-[#556c64]">
          Sign in using your authorized lecturer or administrator credentials to reserve spaces and manage approvals.
        </p>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-[#fdeeed] p-3 text-xs text-[#b03838] border border-[#f8c9c7]">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-bold text-[#3b5049] mb-1.5"
            >
              Institutional Email
            </label>
            <div className="relative rounded-lg shadow-xs">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-4 w-4 text-[#718780]" aria-hidden="true" />
              </div>
              <input
                id="auth-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="lecturer@institution.edu"
                className="block w-full rounded-lg border border-[#d6e2dc] bg-white py-2.5 pl-9 pr-3 text-sm text-[#13221e] placeholder:text-[#91a69f] focus:border-[#164e43] focus:ring-1 focus:ring-[#164e43]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-bold text-[#3b5049] mb-1.5"
            >
              Password
            </label>
            <div className="relative rounded-lg shadow-xs">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-4 w-4 text-[#718780]" aria-hidden="true" />
              </div>
              <input
                id="auth-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="block w-full rounded-lg border border-[#d6e2dc] bg-white py-2.5 pl-9 pr-3 text-sm text-[#13221e] placeholder:text-[#91a69f] focus:border-[#164e43] focus:ring-1 focus:ring-[#164e43]"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-[#d6e2dc] bg-white px-4 py-2.5 text-xs font-semibold text-[#486057] hover:bg-[#f3f8f5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#164e43] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#1b5f52] transition-colors disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
