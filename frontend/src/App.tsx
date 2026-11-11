import { lazy, Suspense, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Toaster, toast } from 'sonner'
import type { User, Lab, Booking } from './types'
import { parseApiError } from './utils/format'

import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { Overview } from './components/Overview'
import { Laboratories } from './components/Laboratories'
import { LabManagement } from './components/LabManagement'
const Availability = lazy(() => import('./components/Availability').then(module => ({ default: module.Availability })))
import { BookingsList } from './components/BookingsList'
import { Approvals } from './components/Approvals'
import { NewBookingView } from './components/NewBookingView'
import { AuthModal } from './components/AuthModal'
import { RejectModal } from './components/RejectModal'
import { LabStatusModal } from './components/LabStatusModal'
import Lecturers from './Lecturers'

axios.defaults.withCredentials = true
axios.defaults.withXSRFToken = true
axios.defaults.headers.common.Accept = 'application/json'

const API_BASE = '/api/v1'

export default function App() {
  const qc = useQueryClient()
  const [currentPage, setCurrentPage] = useState<string>('overview')
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false)
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false)
  const [selectedLabForBooking, setSelectedLabForBooking] = useState<Lab | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<{ start: string; end: string } | null>(null)
  const [statusModalLab, setStatusModalLab] = useState<Lab | null>(null)
  const [rejectModalBooking, setRejectModalBooking] = useState<Booking | null>(null)
  const [cancelTargetBooking, setCancelTargetBooking] = useState<Booking | null>(null)

  // Current authenticated user session
  const me = useQuery<User | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${API_BASE}/auth/me`)
        return res.data.data
      } catch {
        return null
      }
    },
    retry: false,
  })

  const currentUser = me.data
  const isAdmin = currentUser?.role === 'admin'

  // Laboratories Directory
  const labs = useQuery<Lab[]>({
    queryKey: ['labs', !!currentUser],
    queryFn: async () => {
      const endpoint = currentUser ? `${API_BASE}/labs` : `${API_BASE}/public/labs`
      const res = await axios.get(endpoint)
      return res.data.data
    },
  })

  // Bookings list (for lecturers and admin)
  const bookings = useQuery<Booking[]>({
    queryKey: ['bookings'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/bookings`)
      return res.data.data
    },
    enabled: !!currentUser,
  })

  // Pending Approvals queue (Admin only)
  const approvals = useQuery<Booking[]>({
    queryKey: ['approvals'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/admin/approvals`)
      return res.data.data
    },
    enabled: isAdmin,
  })

  const refreshBookingData = () => {
    qc.invalidateQueries({ queryKey: ['bookings'] })
    qc.invalidateQueries({ queryKey: ['approvals'] })
  }

  // Auth: Sign In
  async function handleSignIn(e: FormEvent<HTMLFormElement>) {
    const form = new FormData(e.currentTarget)
    try {
      await axios.get('/sanctum/csrf-cookie')
      await axios.post(`${API_BASE}/auth/login`, {
        email: form.get('email'),
        password: form.get('password'),
      })
      await qc.invalidateQueries({ queryKey: ['me'] })
      setLoginModalOpen(false)
      toast.success('Signed in successfully. Welcome back to LabReserve.')
    } catch (err) {
      throw new Error(parseApiError(err))
    }
  }

  // Auth: Sign Out
  async function handleSignOut() {
    try {
      await axios.post(`${API_BASE}/auth/logout`)
      qc.clear()
      setCurrentPage('overview')
      toast.success('Signed out of LabReserve.')
    } catch (err) {
      toast.error(parseApiError(err))
    }
  }

  // Action: Create Reservation
  async function handleCreateBooking(e: FormEvent<HTMLFormElement>) {
    const form = e.currentTarget
    const f = new FormData(form)

    const labIdVal = Number(f.get('lab_id'))
    const startAtRaw = String(f.get('start_at'))
    const endAtRaw = String(f.get('end_at'))

    // Append Asia/Kuala_Lumpur offset (+08:00) as required by backend regex
    const startAt = `${startAtRaw}:00+08:00`
    const endAt = `${endAtRaw}:00+08:00`

    try {
      const res = await axios.post(`${API_BASE}/bookings`, {
        lab_id: labIdVal,
        subject: f.get('subject'),
        purpose: f.get('purpose'),
        start_at: startAt,
        end_at: endAt,
        expected_students: Number(f.get('expected_students')) || null,
        special_event: f.get('special_event') === 'on',
      })

      const newBooking = res.data.data
      toast.success(
        `Reservation ${newBooking.booking_reference} confirmed with status: ${newBooking.status}`
      )
      form.reset()
      setSelectedLabForBooking(null)
      refreshBookingData()
      setCurrentPage('bookings')
    } catch (err) {
      toast.error(parseApiError(err))
      throw err
    }
  }

  // Action: Cancel Booking
  async function handleConfirmCancel() {
    if (!cancelTargetBooking) return
    try {
      await axios.post(`${API_BASE}/bookings/${cancelTargetBooking.id}/cancel`, {
        reason: 'Cancelled by user request',
      })
      toast.success(`Booking ${cancelTargetBooking.booking_reference} was cancelled.`)
      setCancelTargetBooking(null)
      refreshBookingData()
    } catch (err) {
      toast.error(parseApiError(err))
    }
  }

  // Action: Approve Booking (Admin)
  async function handleApproveBooking(b: Booking) {
    try {
      await axios.post(`${API_BASE}/admin/approvals/${b.id}/approve`)
      toast.success(`Reservation ${b.booking_reference} approved.`)
      refreshBookingData()
    } catch (err) {
      toast.error(parseApiError(err))
    }
  }

  // Action: Reject Booking (Admin)
  async function handleRejectBooking(b: Booking, reason: string) {
    try {
      await axios.post(`${API_BASE}/admin/approvals/${b.id}/reject`, { reason })
      toast.success(`Reservation ${b.booking_reference} has been rejected.`)
      refreshBookingData()
    } catch (err) {
      toast.error(parseApiError(err))
      throw err
    }
  }

  // Quick Action: Preselect Lab and Navigate to Booking Form
  function handleSelectLabForBooking(lab: Lab) {
    if (!currentUser) {
      setLoginModalOpen(true)
      return
    }
    setSelectedPeriod(null)
    setSelectedLabForBooking(lab)
    setCurrentPage('new')
  }

  return (
    <div className="min-h-screen flex bg-[#f5f8f6] text-[#13221e]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        currentUser={currentUser}
        approvalsCount={approvals.data?.length || 0}
        onOpenLogin={() => setLoginModalOpen(true)}
        onSignOut={handleSignOut}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentPage={currentPage}
          currentUser={currentUser}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onNewBooking={() => {
            setSelectedPeriod(null)
            setSelectedLabForBooking(null)
            setCurrentPage('new')
          }}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {/* Overview Screen */}
          {currentPage === 'overview' && (
            <Overview
              currentUser={currentUser}
              labs={labs.data}
              bookings={bookings.data}
              approvals={approvals.data}
              isLoadingLabs={labs.isLoading}
              isLoadingBookings={bookings.isLoading}
              onNavigate={setCurrentPage}
              onSelectLabForBooking={handleSelectLabForBooking}
              onCheckStatus={setStatusModalLab}
              onCancelBooking={setCancelTargetBooking}
            />
          )}

          {/* Laboratories Directory Screen */}
          {currentPage === 'labs' && (
            <Laboratories
              labs={labs.data}
              isLoading={labs.isLoading}
              isError={labs.isError}
              onSelectLabForBooking={handleSelectLabForBooking}
              onCheckStatus={setStatusModalLab}
            />
          )}

          {currentPage === 'manage-labs' && isAdmin && <LabManagement />}

          {currentPage === 'availability' && <Suspense fallback={<p>Loading calendar…</p>}><Availability labs={labs.data || []} authenticated={!!currentUser} onBook={(lab, period) => { setSelectedLabForBooking(lab); setSelectedPeriod(period); setCurrentPage('new') }} /></Suspense>}

          {/* Bookings Management Screen */}
          {currentPage === 'bookings' && (
            <BookingsList
              bookings={bookings.data}
              currentUser={currentUser}
              isLoading={bookings.isLoading}
              isError={bookings.isError}
              onCancelBooking={setCancelTargetBooking}
              onNewBooking={() => {
                setSelectedLabForBooking(null)
                setCurrentPage('new')
              }}
            />
          )}

          {/* Approvals Screen (Admin Only) */}
          {currentPage === 'approvals' && isAdmin && (
            <Approvals
              approvals={approvals.data}
              isLoading={approvals.isLoading}
              isError={approvals.isError}
              onApprove={handleApproveBooking}
              onOpenRejectModal={setRejectModalBooking}
            />
          )}

          {/* Lecturers Management Screen (Admin Only) */}
          {currentPage === 'lecturers' && isAdmin && <Lecturers />}

          {/* New Reservation Screen */}
          {currentPage === 'new' && (
            <NewBookingView
              labs={labs.data}
              selectedLabId={selectedLabForBooking?.id}
              initialStart={selectedPeriod?.start}
              initialEnd={selectedPeriod?.end}
              onSubmitBooking={handleCreateBooking}
              onCancel={() => setCurrentPage('overview')}
            />
          )}
        </main>
      </div>

      {/* Toaster for Toast Notifications */}
      <Toaster richColors position="top-right" />

      {/* Auth Modal */}
      <AuthModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSignIn={handleSignIn}
      />

      {/* Live Lab Status Modal */}
      <LabStatusModal
        lab={statusModalLab}
        isOpen={!!statusModalLab}
        onClose={() => setStatusModalLab(null)}
        onReserve={handleSelectLabForBooking}
      />

      {/* Rejection Decision Modal */}
      <RejectModal
        booking={rejectModalBooking}
        isOpen={!!rejectModalBooking}
        onClose={() => setRejectModalBooking(null)}
        onConfirmReject={handleRejectBooking}
      />

      {/* Cancellation Confirmation Modal */}
      {cancelTargetBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-[#0c241e]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setCancelTargetBooking(null)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-[#e2ece7] animate-fade-in z-10">
            <h3 className="font-heading font-bold text-base text-[#13221e]">
              Cancel Reservation?
            </h3>
            <p className="mt-2 text-xs text-[#556c64] leading-relaxed">
              Are you sure you want to cancel booking <strong>{cancelTargetBooking.booking_reference}</strong> ({cancelTargetBooking.subject})? This time slot will immediately become available to other faculty.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCancelTargetBooking(null)}
                className="rounded-lg border border-[#d6e2dc] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#486057] hover:bg-[#f3f8f5]"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="rounded-lg bg-[#b03838] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#942d2d] transition-colors"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
