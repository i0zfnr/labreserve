import {
  Building2,
  CalendarDays,
  Clock3,
  ArrowRight,
  CalendarPlus,
  Compass,
} from 'lucide-react'
import type { Lab, Booking, User } from '../types'
import { LabCard } from './LabCard'
import { formatDateTime } from '../utils/format'

interface OverviewProps {
  currentUser: User | null | undefined
  labs: Lab[] | undefined
  bookings: Booking[] | undefined
  approvals: Booking[] | undefined
  isLoadingLabs: boolean
  isLoadingBookings: boolean
  onNavigate: (page: string) => void
  onSelectLabForBooking: (lab: Lab) => void
  onCheckStatus: (lab: Lab) => void
  onCancelBooking: (booking: Booking) => void
}

export function Overview({
  currentUser,
  labs = [],
  bookings = [],
  approvals = [],
  isLoadingLabs,
  isLoadingBookings,
  onNavigate,
  onSelectLabForBooking,
  onCheckStatus,
  onCancelBooking,
}: OverviewProps) {
  const isAdmin = currentUser?.role === 'admin'
  const recentBookings = bookings.slice(0, 5)
  const featuredLabs = labs.slice(0, 3)

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#164e43] to-[#1e6154] p-6 sm:p-8 text-white shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-bold tracking-wider uppercase text-emerald-100">
            {isAdmin ? 'Administration Portal' : 'Faculty Booking Portal'}
          </span>
          <h1 className="mt-2 font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">
            {currentUser
              ? `Welcome back, ${currentUser.name}`
              : 'University Laboratory Reservations'}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Schedule research spaces, computer laboratories, and specialized workshop rooms with automated scheduling and administrative conflict prevention.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {currentUser ? (
              <button
                type="button"
                onClick={() => onNavigate('new')}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-[#164e43] shadow-xs hover:bg-[#eff7f3] transition-colors"
              >
                <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                Reserve Space
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onNavigate('labs')}
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-colors border border-white/20"
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              Explore Labs
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row (Strictly Real Data, No Fabricated Claims) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Metric 1 */}
        <article className="rounded-xl border border-[#e2ece7] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#556c64] uppercase tracking-wider">
              Active Laboratories
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef7f2] text-[#164e43]">
              <Building2 className="h-4.5 w-4.5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-heading text-2xl font-extrabold text-[#13221e]">
              {isLoadingLabs ? '...' : labs.length}
            </span>
            <p className="mt-0.5 text-xs text-[#718780]">
              Available spaces in your directory
            </p>
          </div>
        </article>

        {/* Metric 2 */}
        <article className="rounded-xl border border-[#e2ece7] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#556c64] uppercase tracking-wider">
              {isAdmin ? 'System Bookings' : 'Your Reservations'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef7f2] text-[#164e43]">
              <CalendarDays className="h-4.5 w-4.5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-heading text-2xl font-extrabold text-[#13221e]">
              {currentUser ? (isLoadingBookings ? '...' : bookings.length) : 'None'}
            </span>
            <p className="mt-0.5 text-xs text-[#718780]">
              {currentUser ? 'Total records retrieved' : 'Sign in to access your sessions'}
            </p>
          </div>
        </article>

        {/* Metric 3 */}
        <article className="rounded-xl border border-[#e2ece7] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#556c64] uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fef7ee] text-[#915d0d]">
              <Clock3 className="h-4.5 w-4.5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-heading text-2xl font-extrabold text-[#13221e]">
              {isAdmin ? approvals.length : 'N/A'}
            </span>
            <p className="mt-0.5 text-xs text-[#718780]">
              {isAdmin ? 'Requests awaiting officer review' : 'Restricted to administrators'}
            </p>
          </div>
        </article>
      </div>

      {/* Featured Laboratories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-[#13221e]">
              Featured Laboratories
            </h2>
            <p className="text-xs text-[#556c64]">
              High demand spaces for engineering and computing courses.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('labs')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#164e43] hover:text-[#0f342d]"
          >
            <span>View All Labs</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {isLoadingLabs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 rounded-xl border border-[#e2ece7] bg-white p-5 animate-pulse" />
            ))}
          </div>
        ) : featuredLabs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredLabs.map((lab) => (
              <LabCard
                key={lab.id}
                lab={lab}
                onSelectLabForBooking={onSelectLabForBooking}
                onCheckStatus={onCheckStatus}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#d2e2da] bg-white p-8 text-center text-xs text-[#6c827b]">
            No laboratories found in the directory.
          </div>
        )}
      </div>

      {/* Recent Reservations (if authenticated) */}
      {currentUser && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading text-lg font-bold text-[#13221e]">
                Recent Reservations
              </h2>
              <p className="text-xs text-[#556c64]">
                Latest booking activity across your assigned spaces.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('bookings')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#164e43] hover:text-[#0f342d]"
            >
              <span>View All Bookings</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {isLoadingBookings ? (
            <div className="h-48 rounded-xl border border-[#e2ece7] bg-white animate-pulse" />
          ) : recentBookings.length > 0 ? (
            <div className="table-container shadow-xs">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="table-header-cell">Session & Reference</th>
                    <th className="table-header-cell">Laboratory</th>
                    <th className="table-header-cell">Schedule (MYT)</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[#fbfdfc] transition-colors">
                      <td className="table-body-cell">
                        <strong className="block font-semibold text-[#13221e]">
                          {b.subject}
                        </strong>
                        <span className="font-mono text-[11px] text-[#718780]">
                          {b.booking_reference} {isAdmin && b.user ? `(by ${b.user.name})` : ''}
                        </span>
                      </td>
                      <td className="table-body-cell font-medium">
                        {b.lab?.name || `Lab #${b.lab_id}`}
                      </td>
                      <td className="table-body-cell">
                        <span className="block font-medium text-[#13221e]">
                          {formatDateTime(b.start_at)}
                        </span>
                        <span className="text-[11px] text-[#718780]">
                          until {formatDateTime(b.end_at)}
                        </span>
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
                            className="text-xs font-semibold text-[#b03838] hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d2e2da] bg-white p-8 text-center">
              <CalendarDays className="h-8 w-8 text-[#718780] mb-2" aria-hidden="true" />
              <p className="font-heading font-bold text-sm text-[#13221e]">
                No reservations scheduled
              </p>
              <p className="mt-1 text-xs text-[#6c827b]">
                You have not booked any lab sessions yet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
