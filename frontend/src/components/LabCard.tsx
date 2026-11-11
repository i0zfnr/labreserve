import { Building2, Users2, Activity, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react'
import type { Lab } from '../types'

interface LabCardProps {
  lab: Lab
  onSelectLabForBooking: (lab: Lab) => void
  onCheckStatus: (lab: Lab) => void
}

export function LabCard({
  lab,
  onSelectLabForBooking,
  onCheckStatus,
}: LabCardProps) {
  const isAutomatic = lab.booking_mode === 'automatic'

  return (
    <article className="group flex flex-col justify-between rounded-xl bg-white border border-[#e2ece7] p-5 shadow-xs transition-all duration-150 hover:border-[#b8d4c9] hover:shadow-sm">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef7f2] text-[#164e43] group-hover:bg-[#164e43] group-hover:text-white transition-colors duration-150">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="font-mono text-[11px] font-bold tracking-wider px-2 py-1 rounded bg-[#f1f5f3] text-[#4d635b] border border-[#e2ebe6]">
            {lab.code}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="font-heading text-base font-bold text-[#13221e] group-hover:text-[#164e43] transition-colors">
          {lab.name}
        </h3>
        <p className="mt-1 text-xs text-[#556c64]">
          {lab.building} {lab.floor ? `· Floor ${lab.floor}` : ''}
        </p>

        {lab.description && (
          <p className="mt-2 text-xs text-[#6e857e] line-clamp-2">
            {lab.description}
          </p>
        )}

        {/* Meta badges */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f5f8f6] text-[11px] font-semibold text-[#3b5049] border border-[#e2ece7]">
            <Users2 className="h-3.5 w-3.5 text-[#556c64]" aria-hidden="true" />
            {lab.capacity} Seats
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
              isAutomatic
                ? 'bg-[#eaf4f0] text-[#164e43] border-[#cce6dc]'
                : 'bg-[#fef7ee] text-[#915d0d] border-[#f4dfbe]'
            }`}
          >
            {isAutomatic ? (
              <>
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                Automatic Mode
              </>
            ) : (
              <>
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                Approval Required
              </>
            )}
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-3.5 border-t border-[#edf3f0] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onCheckStatus(lab)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#556c64] hover:text-[#164e43] px-2 py-1.5 rounded-md hover:bg-[#eff7f3] transition-colors"
        >
          <Activity className="h-3.5 w-3.5" aria-hidden="true" />
          Live Status
        </button>

        <button
          type="button"
          onClick={() => onSelectLabForBooking(lab)}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#164e43] hover:text-[#0f342d] px-2.5 py-1.5 rounded-md hover:bg-[#eaf4f0] transition-colors"
        >
          <span>Reserve</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}
