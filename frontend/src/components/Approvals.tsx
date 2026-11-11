import { useState } from 'react'
import {
  ShieldCheck,
  Check,
  X,
  Building2,
  User as UserIcon,
  AlertCircle,
  Users2,
  Calendar,
  Loader2,
} from 'lucide-react'
import type { Booking } from '../types'
import { formatDateTime } from '../utils/format'

interface ApprovalsProps {
  approvals: Booking[] | undefined
  isLoading: boolean
  isError: boolean
  onApprove: (booking: Booking) => Promise<void>
  onOpenRejectModal: (booking: Booking) => void
}

export function Approvals({
  approvals = [],
  isLoading,
  isError,
  onApprove,
  onOpenRejectModal,
}: ApprovalsProps) {
  const [approvingId, setApprovingId] = useState<number | null>(null)

  const handleApprove = async (b: Booking) => {
    setApprovingId(b.id)
    try {
      await onApprove(b)
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold tracking-wider text-[#164e43] uppercase">
          Administrative Queue
        </span>
        <h1 className="font-heading text-2xl font-extrabold text-[#13221e]">
          Pending Approval Requests
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#556c64]">
          Review and decide on laboratory reservation requests that require manual faculty authorization.
        </p>
      </div>

      {/* Error state */}
      {isError && (
        <div className="flex items-center gap-2.5 rounded-xl bg-[#fdeeed] p-4 text-xs text-[#b03838] border border-[#f8c9c7]">
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>Could not retrieve pending approval requests. Please verify your administrator privileges.</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-44 rounded-xl border border-[#e2ece7] bg-white p-6 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Approvals List */}
      {!isLoading && !isError && approvals.length > 0 && (
        <div className="space-y-4">
          {approvals.map((b) => (
            <article
              key={b.id}
              className="rounded-xl border border-[#e2ece7] bg-white p-5 sm:p-6 shadow-xs hover:border-[#b8d4c9] transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#edf3f0]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#164e43] bg-[#eaf4f0] px-2 py-0.5 rounded border border-[#cce6dc]">
                      {b.booking_reference}
                    </span>
                    {b.special_event && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#915d0d] bg-[#fef7ee] px-2 py-0.5 rounded border border-[#f4dfbe]">
                        Special Event
                      </span>
                    )}
                  </div>
                  <h2 className="mt-1.5 font-heading text-lg font-bold text-[#13221e]">
                    {b.subject}
                  </h2>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-start lg:self-auto">
                  <button
                    type="button"
                    onClick={() => onOpenRejectModal(b)}
                    disabled={approvingId === b.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2ece7] bg-white px-3.5 py-2 text-xs font-bold text-[#b03838] hover:bg-[#fdeeed] transition-colors"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    <span>Reject</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApprove(b)}
                    disabled={approvingId === b.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#164e43] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1b5f52] transition-colors disabled:opacity-60"
                  >
                    {approvingId === b.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>Approving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" aria-hidden="true" />
                        <span>Approve Request</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Details grid */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <UserIcon className="h-4 w-4 text-[#718780] mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="block font-semibold text-[#13221e]">
                      {b.user?.name || 'Instructor'}
                    </span>
                    <span className="text-[11px] text-[#718780]">
                      {b.user?.email || 'Authorized User'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Building2 className="h-4 w-4 text-[#718780] mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="block font-semibold text-[#13221e]">
                      {b.lab?.name || `Lab ID #${b.lab_id}`}
                    </span>
                    <span className="text-[11px] text-[#718780]">
                      {b.lab?.building} · {b.lab?.capacity} seats
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar className="h-4 w-4 text-[#718780] mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="block font-semibold text-[#13221e]">
                      {formatDateTime(b.start_at)}
                    </span>
                    <span className="text-[11px] text-[#718780]">
                      to {formatDateTime(b.end_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Users2 className="h-4 w-4 text-[#718780] mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="block font-semibold text-[#13221e]">
                      {b.expected_students ? `${b.expected_students} Students` : 'Not specified'}
                    </span>
                    <span className="text-[11px] text-[#718780]">
                      Expected attendance
                    </span>
                  </div>
                </div>
              </div>

              {/* Purpose Box */}
              {b.purpose && (
                <div className="mt-4 rounded-lg bg-[#f8faf9] border border-[#edf3f0] p-3.5 text-xs">
                  <span className="block font-bold text-[#3b5049] mb-1">
                    Stated Academic Purpose:
                  </span>
                  <p className="text-[#556c64] whitespace-pre-wrap leading-relaxed">
                    {b.purpose}
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && approvals.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d2e2da] bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf4f0] text-[#164e43] mb-3">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="font-heading font-bold text-base text-[#13221e]">
            Queue is clear
          </h3>
          <p className="mt-1 text-xs text-[#556c64] max-w-sm">
            There are no pending laboratory reservation requests requiring administrator approval at this time.
          </p>
        </div>
      )}
    </div>
  )
}
