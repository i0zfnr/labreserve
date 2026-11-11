import { Menu, Plus, Shield, User as UserIcon } from 'lucide-react'
import type { User } from '../types'

interface HeaderProps {
  currentPage: string
  currentUser: User | null | undefined
  onOpenMobileNav: () => void
  onNewBooking: () => void
}

export function Header({
  currentPage,
  currentUser,
  onOpenMobileNav,
  onNewBooking,
}: HeaderProps) {
  const getPageTitle = (page: string) => {
    switch (page) {
      case 'overview':
        return 'Overview'
      case 'labs':
        return 'Laboratories'
      case 'availability':
        return 'Availability & Calendar'
      case 'manage-labs':
        return 'Manage Labs'
      case 'bookings':
        return currentUser?.role === 'admin' ? 'All Bookings' : 'My Bookings'
      case 'lecturers':
        return 'Lecturer Directory'
      case 'approvals':
        return 'Approval Requests'
      case 'new':
        return 'Create Reservation'
      default:
        return 'Workspace'
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#e2ece7] bg-white/95 px-4 sm:px-8 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger (min 44px tap target) */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-[#3b5049] hover:bg-[#eff8f4] hover:text-[#164e43] lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="flex items-center text-xs sm:text-sm">
          <span className="font-semibold text-[#6c827b]">LabReserve</span>
          <span className="mx-2 text-[#b8ccc4]" aria-hidden="true">/</span>
          <span className="font-bold text-[#13221e]">{getPageTitle(currentPage)}</span>
        </nav>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Live Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#eef7f2] border border-[#d2e8dd] text-[#164e43] text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#258569] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1b6b54]"></span>
          </span>
          <span>MYT Active</span>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f4ef] text-[#164e43] text-xs font-bold ring-1 ring-[#d2e7de]">
            {currentUser ? (
              currentUser.name.charAt(0).toUpperCase()
            ) : (
              <UserIcon className="h-4 w-4 text-[#486057]" aria-hidden="true" />
            )}
          </div>
          <div className="hidden md:block text-left text-xs leading-tight">
            <p className="font-semibold text-[#13221e]">
              {currentUser ? currentUser.name : 'Guest Visitor'}
            </p>
            <p className="text-[11px] text-[#6c827b] capitalize">
              {currentUser?.role === 'admin' ? (
                <span className="inline-flex items-center gap-1 text-[#164e43] font-medium">
                  <Shield className="h-3 w-3" /> Administrator
                </span>
              ) : currentUser ? (
                currentUser.role
              ) : (
                'Public Access'
              )}
            </p>
          </div>
        </div>

        {/* New Booking CTA button */}
        {currentUser && currentPage !== 'new' && (
          <button
            type="button"
            onClick={onNewBooking}
            className="inline-flex items-center gap-2 rounded-lg bg-[#164e43] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1b5f52] transition-colors"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">New Booking</span>
          </button>
        )}
      </div>
    </header>
  )
}
