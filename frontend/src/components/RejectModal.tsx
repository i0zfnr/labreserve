import { useState, useEffect, type FormEvent } from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import type { Booking } from '../types'

interface RejectModalProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
  onConfirmReject: (booking: Booking, reason: string) => Promise<void>
}

export function RejectModal({
  booking,
  isOpen,
  onClose,
  onConfirmReject,
}: RejectModalProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleClose = () => {
    setReason('')
    setErrorMsg(null)
    onClose()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setReason('')
        setErrorMsg(null)
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !booking) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setErrorMsg('Please state a reason for rejecting this booking.')
      return
    }
    setLoading(true)
    setErrorMsg(null)
    try {
      await onConfirmReject(booking, reason.trim())
      handleClose()
    } catch (err) {
      if (err instanceof Error) {
        setErrorMsg(err.message)
      } else {
        setErrorMsg('Failed to reject booking. Please try again.')
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
      aria-labelledby="reject-dialog-title"
    >
      <div
        className="fixed inset-0 bg-[#0c241e]/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-[#e2ece7] animate-fade-in z-10">
        <div className="flex items-center justify-between pb-4 border-b border-[#edf3f0]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fdeeed] text-[#b03838]">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="reject-dialog-title" className="text-base font-bold font-heading text-[#13221e]">
                Reject Reservation
              </h2>
              <span className="text-xs text-[#556c64]">
                Ref: {booking.booking_reference}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-[#556c64] hover:bg-[#eff8f4] hover:text-[#164e43] transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-[#556c64]">
          Provide a clear explanation for rejecting <strong>{booking.subject}</strong> requested by {booking.user?.name || 'the lecturer'}. This note will be recorded in the system audit trail.
        </p>

        {errorMsg && (
          <div className="mt-3 rounded-lg bg-[#fdeeed] p-3 text-xs text-[#b03838] border border-[#f8c9c7]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="rejection-reason"
              className="block text-xs font-bold text-[#3b5049] mb-1.5"
            >
              Reason for Decision
            </label>
            <textarea
              id="rejection-reason"
              required
              rows={4}
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Laboratory is scheduled for unscheduled equipment maintenance during this timeframe."
              className="block w-full rounded-lg border border-[#d6e2dc] bg-white p-3 text-sm text-[#13221e] placeholder:text-[#91a69f] focus:border-[#164e43] focus:ring-1 focus:ring-[#164e43]"
            />
            <span className="mt-1 block text-right text-[11px] text-[#718780]">
              {reason.length}/1000 characters
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-lg border border-[#d6e2dc] bg-white px-4 py-2 text-xs font-semibold text-[#486057] hover:bg-[#f3f8f5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#b03838] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#962d2d] transition-colors disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Confirm Rejection</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
