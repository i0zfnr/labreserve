import { useState, useEffect, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import {
  Users,
  Plus,
  Mail,
  Building,
  Lock,
  User as UserIcon,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { parseApiError } from './utils/format'

interface Lecturer {
  id: number
  name: string
  email: string
  department: string | null
  is_active: boolean
}

interface PageData {
  data: Lecturer[]
  current_page: number
  last_page: number
  total: number
}

export default function Lecturers() {
  const client = useQueryClient()
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [statusConfirmUser, setStatusConfirmUser] = useState<Lecturer | null>(null)

  const query = useQuery<PageData>({
    queryKey: ['lecturers', page],
    queryFn: async () =>
      (await axios.get('/api/v1/admin/lecturers', { params: { page } })).data,
  })

  // Escape listener for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false)
        setStatusConfirmUser(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const values = new FormData(form)
    setBusy(true)

    try {
      await axios.post('/api/v1/admin/lecturers', {
        name: values.get('name'),
        email: values.get('email'),
        department: values.get('department') || null,
        password: values.get('password'),
      })
      form.reset()
      setShowModal(false)
      setPage(1)
      await client.invalidateQueries({ queryKey: ['lecturers'] })
      toast.success('Lecturer account created successfully')
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleStatus(user: Lecturer) {
    setBusy(true)
    try {
      await axios.patch(`/api/v1/admin/lecturers/${user.id}`, {
        is_active: !user.is_active,
      })
      setStatusConfirmUser(null)
      await client.invalidateQueries({ queryKey: ['lecturers'] })
      toast.success(
        `Account for ${user.name} has been ${user.is_active ? 'deactivated' : 'activated'}.`
      )
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-[#164e43] uppercase">
            Faculty Directory
          </span>
          <h1 className="font-heading text-2xl font-extrabold text-[#13221e]">
            Lecturer Accounts
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#556c64]">
            Manage faculty authorization, account activation, and department assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 rounded-lg bg-[#164e43] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1b5f52] transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add Lecturer</span>
        </button>
      </div>

      {/* Error state */}
      {query.isError && (
        <div className="flex items-center gap-2.5 rounded-xl bg-[#fdeeed] p-4 text-xs text-[#b03838] border border-[#f8c9c7]">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Could not load lecturer accounts. Verify administrative session.</span>
        </div>
      )}

      {/* Loading state */}
      {query.isLoading && (
        <div className="h-64 rounded-xl border border-[#e2ece7] bg-white animate-pulse" />
      )}

      {/* Table */}
      {query.data && (
        <div className="space-y-4">
          <div className="table-container shadow-xs">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="table-header-cell">Lecturer Name</th>
                  <th className="table-header-cell">Institutional Email</th>
                  <th className="table-header-cell">Department</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell text-right">Access Control</th>
                </tr>
              </thead>
              <tbody>
                {query.data.data.map((user) => (
                  <tr key={user.id} className="hover:bg-[#fbfdfc] transition-colors">
                    <td className="table-body-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f4ef] text-[#164e43] text-xs font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <strong className="font-semibold text-[#13221e]">
                          {user.name}
                        </strong>
                      </div>
                    </td>
                    <td className="table-body-cell text-xs font-mono text-[#556c64]">
                      {user.email}
                    </td>
                    <td className="table-body-cell text-xs">
                      {user.department || (
                        <span className="text-[#91a69f] italic">Unassigned</span>
                      )}
                    </td>
                    <td className="table-body-cell">
                      <span
                        className={`badge-status ${
                          user.is_active ? 'badge-confirmed' : 'badge-rejected'
                        }`}
                      >
                        {user.is_active ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" aria-hidden="true" />
                            Disabled
                          </>
                        )}
                      </span>
                    </td>
                    <td className="table-body-cell text-right">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setStatusConfirmUser(user)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-md transition-colors ${
                          user.is_active
                            ? 'text-[#b03838] hover:bg-[#fdeeed]'
                            : 'text-[#164e43] hover:bg-[#eaf4f0]'
                        }`}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty Table */}
          {query.data.data.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d2e2da] bg-white p-12 text-center">
              <Users className="h-8 w-8 text-[#718780] mb-2" aria-hidden="true" />
              <p className="font-heading font-bold text-base text-[#13221e]">
                No lecturers found
              </p>
              <p className="mt-1 text-xs text-[#556c64]">
                Create your first authorized faculty account using the button above.
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {query.data.last_page > 1 && (
            <div className="flex items-center justify-between px-2 pt-2 text-xs text-[#556c64]">
              <button
                type="button"
                disabled={page <= 1 || busy}
                onClick={() => setPage(page - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#d6e2dc] bg-white font-semibold hover:bg-[#f5f8f6] disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="font-medium">
                Page {query.data.current_page} of {query.data.last_page}
              </span>

              <button
                type="button"
                disabled={page >= query.data.last_page || busy}
                onClick={() => setPage(page + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#d6e2dc] bg-white font-semibold hover:bg-[#f5f8f6] disabled:opacity-50 transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Lecturer Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-lecturer-title"
        >
          <div
            className="fixed inset-0 bg-[#0c241e]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowModal(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-xl border border-[#e2ece7] animate-fade-in z-10">
            <div className="flex items-center justify-between pb-4 border-b border-[#edf3f0]">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#164e43] uppercase">
                  Faculty Account Provisioning
                </span>
                <h2
                  id="new-lecturer-title"
                  className="text-lg font-bold font-heading text-[#13221e]"
                >
                  Create Lecturer Account
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-[#556c64] hover:bg-[#eff8f4] hover:text-[#164e43] transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-xs text-[#556c64]">
              Provision a verified faculty account. Distribute the temporary initial password through a secure institutional channel.
            </p>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="lecturer-name"
                  className="block text-xs font-bold text-[#3b5049] mb-1.5"
                >
                  Full Name <span className="text-[#b03838]">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon className="h-4 w-4 text-[#718780]" aria-hidden="true" />
                  </div>
                  <input
                    id="lecturer-name"
                    name="name"
                    required
                    maxLength={255}
                    placeholder="Prof. Aiman Danial"
                    className="block w-full rounded-lg border border-[#d6e2dc] bg-white py-2 pl-9 pr-3 text-sm text-[#13221e] focus:border-[#164e43] focus:ring-1 focus:ring-[#164e43]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="lecturer-email"
                  className="block text-xs font-bold text-[#3b5049] mb-1.5"
                >
                  Institutional Email Address <span className="text-[#b03838]">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4 w-4 text-[#718780]" aria-hidden="true" />
                  </div>
                  <input
                    id="lecturer-email"
                    name="email"
                    type="email"
                    required
                    maxLength={255}
                    placeholder="lecturer@university.edu.my"
                    className="block w-full rounded-lg border border-[#d6e2dc] bg-white py-2 pl-9 pr-3 text-sm text-[#13221e] focus:border-[#164e43] focus:ring-1 focus:ring-[#164e43]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="lecturer-department"
                  className="block text-xs font-bold text-[#3b5049] mb-1.5"
                >
                  Academic Department / Faculty
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Building className="h-4 w-4 text-[#718780]" aria-hidden="true" />
                  </div>
                  <input
                    id="lecturer-department"
                    name="department"
                    maxLength={255}
                    placeholder="e.g. Faculty of Computer Science & IT"
                    className="block w-full rounded-lg border border-[#d6e2dc] bg-white py-2 pl-9 pr-3 text-sm text-[#13221e] focus:border-[#164e43] focus:ring-1 focus:ring-[#164e43]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="lecturer-password"
                  className="block text-xs font-bold text-[#3b5049] mb-1.5"
                >
                  Temporary Password <span className="text-[#b03838]">* (Min. 12 characters)</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-[#718780]" aria-hidden="true" />
                  </div>
                  <input
                    id="lecturer-password"
                    name="password"
                    type="password"
                    minLength={12}
                    required
                    placeholder="••••••••••••••••"
                    className="block w-full rounded-lg border border-[#d6e2dc] bg-white py-2 pl-9 pr-3 text-sm text-[#13221e] focus:border-[#164e43] focus:ring-1 focus:ring-[#164e43]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={busy}
                  className="rounded-lg border border-[#d6e2dc] bg-white px-4 py-2 text-xs font-semibold text-[#486057] hover:bg-[#f3f8f5] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#164e43] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1b5f52] transition-colors disabled:opacity-60"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Toggle Status */}
      {statusConfirmUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-[#0c241e]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setStatusConfirmUser(null)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-[#e2ece7] animate-fade-in z-10">
            <h3 className="font-heading font-bold text-base text-[#13221e]">
              {statusConfirmUser.is_active ? 'Deactivate Account?' : 'Activate Account?'}
            </h3>
            <p className="mt-2 text-xs text-[#556c64] leading-relaxed">
              Are you sure you want to {statusConfirmUser.is_active ? 'disable' : 'enable'} access for <strong>{statusConfirmUser.name}</strong> ({statusConfirmUser.email})?
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setStatusConfirmUser(null)}
                disabled={busy}
                className="rounded-lg border border-[#d6e2dc] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#486057] hover:bg-[#f3f8f5]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleToggleStatus(statusConfirmUser)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold text-white transition-colors ${
                  statusConfirmUser.is_active
                    ? 'bg-[#b03838] hover:bg-[#942d2d]'
                    : 'bg-[#164e43] hover:bg-[#1b5f52]'
                }`}
              >
                {busy ? 'Updating...' : statusConfirmUser.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
