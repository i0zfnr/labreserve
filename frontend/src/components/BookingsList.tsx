import { useState, useMemo } from 'react'
import {
  CalendarDays,
  Search,
  Filter,
  XCircle,
  Building2,
  Clock,
  User as UserIcon,
} from 'lucide-react'
import type { Booking, User } from '../types'
import { formatDateTime } from '../utils/format'

interface BookingsListProps {
  bookings: Booking[] | undefined
  currentUser: User | null | undefined
  isLoading: boolean
  isError: boolean
  onCancelBooking: (booking: Booking) => void
  onNewBooking: () => void
}

export function BookingsList({
  bookings = [],
  currentUser,
  isLoading,
  isError,
  onCancelBooking,
  onNewBooking,
}: BookingsListProps) {
  const isAdmin = currentUser?.role === 'admin'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'rejected'>('all')

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        b.subject.toLowerCase().includes(search.toLowerCase()) ||
        b.booking_reference.toLowerCase().includes(search.toLowerCase()) ||
        (b.lab?.name && b.lab.name.toLowerCase().includes(search.toLowerCase())) ||
        (b.user?.name && b.user.name.toLowerCase().includes(search.toLowerCase()))

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'rejected'
          ? b.status === 'rejected' || b.status === 'cancelled'
          : b.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [bookings, search, statusFilter])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-[#164e43] uppercase">
            Schedule & Records
          </span>
          <h1 className="font-heading text-2xl font-extrabold text-[#13221e]">
            {isAdmin ? 'All Laboratory Bookings' : 'My Session Bookings'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#556c64]">
            {isAdmin
              ? 'Institutional record of all active and historical laboratory sessions.'
              : 'Review your upcoming and completed classroom reservations.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onNewBooking}
          className="self-start sm:self-auto inline-flex items-center gap-2 rounded-lg bg-[#164e43] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1b5f52] transition-colors"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          <span>New Reservation</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#e2ece7] shadow-xs">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-[#718780]" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject, reference code, laboratory, or instructor..."
            className="w-full rounded-lg border border-[#d6e2dc] bg-[#fafcfb] py-2 pl-9 pr-3 text-xs sm:text-sm text-[#13221e] placeholder:text-[#91a69f] focus:border-[#164e43] focus:bg-white focus:ring-1 focus:ring-[#164e43]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-3.5 w-3.5 text-[#718780] mr-1 hidden sm:block" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-[#164e43] text-white'
                : 'bg-[#f5f8f6] text-[#486057] hover:bg-[#eef4f1]'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('confirmed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              statusFilter === 'confirmed'
                ? 'bg-[#164e43] text-white'
                : 'bg-[#f5f8f6] text-[#486057] hover:bg-[#eef4f1]'
            }`}
          >
            Confirmed
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-[#164e43] text-white'
                : 'bg-[#f5f8f6] text-[#486057] hover:bg-[#eef4f1]'
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              statusFilter === 'rejected'
                ? 'bg-[#164e43] text-white'
                : 'bg-[#f5f8f6] text-[#486057] hover:bg-[#eef4f1]'
            }`}
          >
            Closed / Cancelled
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="h-64 rounded-xl border border-[#e2ece7] bg-white animate-pulse" />
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-xl bg-[#fdeeed] p-4 text-xs text-[#b03838] border border-[#f8c9c7]">
          Failed to load reservations. Please check that the backend server is operational.
        </div>
      )}

      {/* Table for Desktop */}
      {!isLoading && !isError && filteredBookings.length > 0 && (
        <>
          <div className="hidden md:block table-container shadow-xs">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="table-header-cell">Session & Reference</th>
                  <th className="table-header-cell">Laboratory Space</th>
                  <th className="table-header-cell">Schedule (MYT)</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#fbfdfc] transition-colors">
                    <td className="table-body-cell">
                      <div className="flex flex-col">
                        <strong className="font-semibold text-[#13221e]">
                          {b.subject}
                        </strong>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#556c64]">
                          <span className="font-mono text-[11px] font-bold text-[#164e43]">
                            {b.booking_reference}
                          </span>
                          {isAdmin && b.user && (
                            <span>by {b.user.name}</span>
                          )}
                        </div>
                        {b.approval_reason && (
                          <span className="mt-1 inline-block text-[11px] text-[#b03838] bg-[#fdeeed] px-2 py-0.5 rounded border border-[#f8c9c7]">
                            Note: {b.approval_reason}
                          </span>
                        )}
                        {b.special_event && (
                          <span className="mt-1 inline-block text-[10px] font-bold text-[#82550f] bg-[#fef7ee] px-1.5 py-0.5 rounded w-max border border-[#fae2c0]">
                            Special Academic Event
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-body-cell">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#718780]" aria-hidden="true" />
                        <div>
                          <p className="font-medium text-[#13221e]">
                            {b.lab?.name || `Lab ID #${b.lab_id}`}
                          </p>
                          <p className="text-[11px] text-[#718780]">
                            {b.lab?.building} {b.lab?.code ? `(${b.lab.code})` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-body-cell">
                      <div className="flex items-start gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#718780] mt-0.5 shrink-0" aria-hidden="true" />
                        <div>
                          <p className="font-medium text-[#13221e]">
                            {formatDateTime(b.start_at)}
                          </p>
                          <p className="text-[11px] text-[#718780]">
                            until {formatDateTime(b.end_at)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-body-cell">
                      <span className={`badge-status badge-${b.status}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="table-body-cell text-right">
                      {['pending', 'confirmed'].includes(b.status) && (
                        <button
                          type="button"
                          onClick={() => onCancelBooking(b)}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-[#b03838] hover:bg-[#fdeeed] transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (Responsive Design R-03) */}
          <div className="md:hidden space-y-3">
            {filteredBookings.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-[#e2ece7] bg-white p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#13221e]">
                      {b.subject}
                    </h3>
                    <span className="font-mono text-[11px] font-bold text-[#164e43]">
                      {b.booking_reference}
                    </span>
                  </div>
                  <span className={`badge-status badge-${b.status}`}>
                    {b.status}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-[#556c64]">
                  <p className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[#718780]" />
                    <span>{b.lab?.name || `Lab #${b.lab_id}`}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#718780]" />
                    <span>{formatDateTime(b.start_at)}</span>
                  </p>
                  {isAdmin && b.user && (
                    <p className="flex items-center gap-1.5">
                      <UserIcon className="h-3.5 w-3.5 text-[#718780]" />
                      <span>{b.user.name}</span>
                    </p>
                  )}
                  {b.approval_reason && (
                    <p className="text-[11px] text-[#b03838] bg-[#fdeeed] p-1.5 rounded">
                      Reason: {b.approval_reason}
                    </p>
                  )}
                </div>

                {['pending', 'confirmed'].includes(b.status) && (
                  <div className="pt-2 border-t border-[#edf3f0] flex justify-end">
                    <button
                      type="button"
                      onClick={() => onCancelBooking(b)}
                      className="text-xs font-bold text-[#b03838] hover:underline"
                    >
                      Cancel Reservation
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredBookings.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d2e2da] bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f9f7] text-[#718780] mb-3">
            <CalendarDays className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="font-heading font-bold text-base text-[#13221e]">
            No reservations found
          </h3>
          <p className="mt-1 text-xs text-[#556c64] max-w-sm">
            {search || statusFilter !== 'all'
              ? 'No bookings match your current filter settings. Try clearing the filter.'
              : 'You do not have any scheduled reservations. Browse available laboratories to request a room.'}
          </p>
          {(search || statusFilter !== 'all') ? (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setStatusFilter('all')
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-[#f0f6f3] text-xs font-bold text-[#164e43] hover:bg-[#e2ece7] transition-colors"
            >
              Reset Filters
            </button>
          ) : (
            <button
              type="button"
              onClick={onNewBooking}
              className="mt-4 px-4 py-2 rounded-lg bg-[#164e43] text-xs font-bold text-white hover:bg-[#1b5f52] transition-colors"
            >
              Make a Reservation
            </button>
          )}
        </div>
      )}
    </div>
  )
}
