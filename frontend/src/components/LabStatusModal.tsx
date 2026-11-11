import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { X, Building2, CheckCircle2, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import type { Lab, LabStatusResponse } from '../types'
import { formatDateTime, parseApiError } from '../utils/format'

interface LabStatusModalProps {
  lab: Lab | null
  isOpen: boolean
  onClose: () => void
  onReserve: (lab: Lab) => void
}

export function LabStatusModal({
  lab,
  isOpen,
  onClose,
  onReserve,
}: LabStatusModalProps) {
  const { data, isLoading, isError, error } = useQuery<LabStatusResponse>({
    queryKey: ['lab-status', lab?.code],
    queryFn: async () => {
      const res = await axios.get(`/api/v1/public/labs/${lab?.code}/status`)
      return res.data?.data
    },
    enabled: isOpen && !!lab,
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !lab) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#e8f7f0] text-[#1d7350] border border-[#bcecd6]">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Currently Available
          </span>
        )
      case 'in_session':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fef5e7] text-[#99610b] border border-[#f8dfb1]">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            In Active Session
          </span>
        )
      case 'pending':
        return <span className="rounded-full bg-[#fef5e7] px-3 py-1 text-xs font-bold text-[#99610b]">Pending approval</span>
      case 'closed':
        return <span className="rounded-full bg-[#f1f5f3] px-3 py-1 text-xs font-bold text-[#556c64]">Outside operating hours</span>
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fdeeed] text-[#b03838] border border-[#f8c9c7]">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Under Maintenance / Closed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#f1f5f3] text-[#556c64]">
            {status}
          </span>
        )
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lab-status-title"
    >
      <div
        className="fixed inset-0 bg-[#0c241e]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-[#e2ece7] animate-fade-in z-10">
        <div className="flex items-center justify-between pb-4 border-b border-[#edf3f0]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf4f0] text-[#164e43]">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-[#164e43] uppercase">
                {lab.code}
              </span>
              <h2 id="lab-status-title" className="text-lg font-bold font-heading text-[#13221e]">
                {lab.name}
              </h2>
            </div>
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

        <div className="mt-4 space-y-4">
          {isLoading && (
            <div className="py-8 flex flex-col items-center justify-center text-[#556c64] gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-[#164e43]" aria-hidden="true" />
              <span className="text-xs">Checking live status...</span>
            </div>
          )}

          {isError && (
            <div className="rounded-lg bg-[#fdeeed] p-3 text-xs text-[#b03838] border border-[#f8c9c7]">
              {parseApiError(error)}
            </div>
          )}

          {!isLoading && data && (
            <>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f8faf9] border border-[#e8f0ec]">
                <span className="text-xs font-semibold text-[#486057]">Current schedule status</span>
                {getStatusBadge(data.status)}
              </div>

              <div className="space-y-2 text-xs">
                {data.current && (
                  <div className="p-3 rounded-lg border border-[#e2ece7] bg-white">
                    <span className="block text-[11px] font-bold text-[#b03838] uppercase">
                      Current Active Booking
                    </span>
                    <p className="mt-1 font-semibold text-[#13221e]">
                      {formatDateTime(data.current.start_at)} to {formatDateTime(data.current.end_at)}
                    </p>
                  </div>
                )}

                {data.next ? (
                  <div className="p-3 rounded-lg border border-[#e2ece7] bg-white">
                    <span className="block text-[11px] font-bold text-[#164e43] uppercase">
                      Next Confirmed Booking
                    </span>
                    <p className="mt-1 font-semibold text-[#13221e]">
                      {formatDateTime(data.next.start_at)}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-[#e2ece7] bg-white text-[#556c64]">
                    No upcoming confirmed booking found.
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#edf3f0] flex items-center justify-between text-xs text-[#556c64]">
                <span>Operating hours: 08:00 to 18:00 MYT</span>
                <span>{lab.capacity} Seats</span>
              </div>
            </>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#d6e2dc] bg-white px-4 py-2 text-xs font-semibold text-[#486057] hover:bg-[#f3f8f5] transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose()
                onReserve(lab)
              }}
              className="rounded-lg bg-[#164e43] px-4 py-2 text-xs font-bold text-white hover:bg-[#1b5f52] transition-colors"
            >
              Reserve This Lab
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
