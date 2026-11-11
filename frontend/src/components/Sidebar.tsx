import {
  CalendarDays,
  Building2,
  LayoutDashboard,
  LogOut,
  LogIn,
  ShieldCheck,
  Clock3,
  Users,
  X,
} from 'lucide-react'
import type { User } from '../types'

interface SidebarProps {
  currentPage: string
  onSelectPage: (page: string) => void
  currentUser: User | null | undefined
  approvalsCount: number
  onOpenLogin: () => void
  onSignOut: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({
  currentPage,
  onSelectPage,
  currentUser,
  approvalsCount,
  onOpenLogin,
  onSignOut,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const isAdmin = currentUser?.role === 'admin'
  const isAuthenticated = !!currentUser

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, show: true },
    { id: 'labs', label: 'Laboratories', icon: Building2, show: true },
    { id: 'availability', label: 'Availability', icon: CalendarDays, show: true },
    { id: 'manage-labs', label: 'Manage Labs', icon: Building2, show: isAdmin },
    {
      id: 'bookings',
      label: isAdmin ? 'All Bookings' : 'My Bookings',
      icon: CalendarDays,
      show: isAuthenticated,
    },
    {
      id: 'lecturers',
      label: 'Lecturers',
      icon: Users,
      show: isAdmin,
    },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: ShieldCheck,
      show: isAdmin,
      badge: approvalsCount > 0 ? approvalsCount : undefined,
    },
  ]

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white text-[#13221e] border-r border-[#e2ece7] p-5 w-64">
      {/* Brand & Identity */}
      <div>
        <div className="flex items-center justify-between pb-6 mb-4 border-b border-[#edf3f0]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#164e43] text-white shadow-sm">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="block font-heading text-lg font-bold tracking-tight text-[#13221e]">
                LabReserve
              </span>
              <span className="block text-[10px] font-semibold tracking-wider text-[#556c64] uppercase">
                Academic Spaces
              </span>
            </div>
          </div>
          {mobileOpen && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#556c64] hover:bg-[#eff8f4] hover:text-[#164e43] transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Section Label */}
        <div className="px-3 mb-2">
          <p className="text-[11px] font-bold tracking-wider text-[#6c827b] uppercase">
            Workspace
          </p>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1" aria-label="Main Navigation">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectPage(item.id)
                    onCloseMobile()
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#eaf4f0] text-[#164e43] shadow-xs'
                      : 'text-[#486057] hover:bg-[#f3f8f5] hover:text-[#13221e]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4.5 w-4.5 ${
                        isActive ? 'text-[#164e43]' : 'text-[#6c827b]'
                      }`}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-[#164e43] text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
        </nav>
      </div>

      {/* Footer Info & Auth */}
      <div className="pt-4 border-t border-[#edf3f0] space-y-3">
        {/* Timezone Indicator */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#f5f9f7] text-[#4d635b] text-xs">
          <Clock3 className="h-4 w-4 text-[#164e43] shrink-0" aria-hidden="true" />
          <div className="leading-tight">
            <span className="block font-medium">Malaysia Time (MYT)</span>
            <span className="text-[10px] text-[#718780]">UTC+08:00 Standard</span>
          </div>
        </div>

        {/* User Card / Login CTA */}
        {isAuthenticated ? (
          <div className="p-3 rounded-xl bg-[#f8faf9] border border-[#e5ede9]">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#164e43] text-white font-bold text-xs uppercase">
                {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#13221e] truncate">
                  {currentUser?.name}
                </p>
                <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded bg-[#e8f3ee] text-[#164e43] capitalize">
                  {currentUser?.role}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#486057] hover:bg-[#eff4f1] hover:text-[#b03838] transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Sign Out
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenLogin}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold bg-[#164e43] text-white hover:bg-[#1b5f52] shadow-xs transition-colors"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Sign In to Account
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-[#0f241e]/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 max-w-full flex animate-fade-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
