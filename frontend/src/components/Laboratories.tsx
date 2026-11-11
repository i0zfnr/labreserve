import { useState, useMemo } from 'react'
import { Search, Building2, SlidersHorizontal, AlertCircle } from 'lucide-react'
import type { Lab } from '../types'
import { LabCard } from './LabCard'

interface LaboratoriesProps {
  labs: Lab[] | undefined
  isLoading: boolean
  isError: boolean
  onSelectLabForBooking: (lab: Lab) => void
  onCheckStatus: (lab: Lab) => void
}

export function Laboratories({
  labs = [],
  isLoading,
  isError,
  onSelectLabForBooking,
  onCheckStatus,
}: LaboratoriesProps) {
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'automatic' | 'approval'>('all')

  const filteredLabs = useMemo(() => {
    return labs.filter((lab) => {
      const matchSearch =
        lab.name.toLowerCase().includes(search.toLowerCase()) ||
        lab.code.toLowerCase().includes(search.toLowerCase()) ||
        lab.building.toLowerCase().includes(search.toLowerCase())

      const matchMode =
        filterMode === 'all' ? true : lab.booking_mode === filterMode

      return matchSearch && matchMode
    })
  }, [labs, search, filterMode])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <span className="text-[11px] font-bold tracking-wider text-[#164e43] uppercase">
          Directory & Facilities
        </span>
        <h1 className="font-heading text-2xl font-extrabold text-[#13221e]">
          Laboratories Directory
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#556c64]">
          Explore specialized facilities, computer workstations, and collaborative spaces across campus.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#e2ece7] shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-[#718780]" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by laboratory name, code, or building..."
            className="w-full rounded-lg border border-[#d6e2dc] bg-[#fafcfb] py-2 pl-9 pr-3 text-xs sm:text-sm text-[#13221e] placeholder:text-[#91a69f] focus:border-[#164e43] focus:bg-white focus:ring-1 focus:ring-[#164e43]"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <SlidersHorizontal className="h-3.5 w-3.5 text-[#718780] mr-1 hidden sm:block" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-[#164e43] text-white'
                : 'bg-[#f5f8f6] text-[#486057] hover:bg-[#eef4f1]'
            }`}
          >
            All Spaces ({labs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('automatic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              filterMode === 'automatic'
                ? 'bg-[#164e43] text-white'
                : 'bg-[#f5f8f6] text-[#486057] hover:bg-[#eef4f1]'
            }`}
          >
            Automatic
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('approval')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              filterMode === 'approval'
                ? 'bg-[#164e43] text-white'
                : 'bg-[#f5f8f6] text-[#486057] hover:bg-[#eef4f1]'
            }`}
          >
            Approval Required
          </button>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="flex items-center gap-3 rounded-xl bg-[#fdeeed] p-4 text-xs text-[#b03838] border border-[#f8c9c7]">
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold">Unable to load laboratory directory.</p>
            <p className="mt-0.5 text-[#912d2d]">
              Please check your connection or contact the campus administrator.
            </p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-56 rounded-xl border border-[#e2ece7] bg-white p-5 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Labs Grid */}
      {!isLoading && !isError && filteredLabs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLabs.map((lab) => (
            <LabCard
              key={lab.id}
              lab={lab}
              onSelectLabForBooking={onSelectLabForBooking}
              onCheckStatus={onCheckStatus}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredLabs.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d2e2da] bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f9f7] text-[#718780] mb-3">
            <Building2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="font-heading font-bold text-base text-[#13221e]">
            No laboratories match your search
          </h3>
          <p className="mt-1 text-xs text-[#556c64] max-w-sm">
            Try adjusting your search criteria or clear the filters to view all available university laboratory rooms.
          </p>
          {(search || filterMode !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setFilterMode('all')
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-[#f0f6f3] text-xs font-bold text-[#164e43] hover:bg-[#e2ece7] transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
