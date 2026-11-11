import { useState, type FormEvent } from 'react'
import {
  Building2,
  ArrowRight,
  Info,
  Loader2,
} from 'lucide-react'
import type { Lab } from '../types'

interface NewBookingViewProps {
  labs: Lab[] | undefined
  selectedLabId?: number | null
  initialStart?: string
  initialEnd?: string
  onSubmitBooking: (e: FormEvent<HTMLFormElement>) => Promise<void>
  onCancel: () => void
}

export function NewBookingView({
  labs = [],
  selectedLabId,
  initialStart,
  initialEnd,
  onSubmitBooking,
  onCancel,
}: NewBookingViewProps) {
  const [submitting, setSubmitting] = useState(false)
  const [labId, setLabId] = useState<number | string>(selectedLabId || '')

  const currentSelectedLab = labs.find((l) => l.id === Number(labId))

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmitBooking(e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold tracking-wider text-[#164e43] uppercase">
          New Reservation
        </span>
        <h1 className="font-heading text-2xl font-extrabold text-[#13221e]">
          Schedule Laboratory Session
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#556c64]">
          Submit a reservation request for your class or research group. Availability is verified immediately.
        </p>
      </div>

      {/* Info Notice */}
      <div className="flex items-start gap-3 rounded-xl bg-[#eef7f2] p-4 text-xs text-[#164e43] border border-[#d2e8dd]">
        <Info className="h-4.5 w-4.5 shrink-0 mt-0.5 text-[#164e43]" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-bold">System Operating Policy (MYT Standard)</p>
          <p className="text-[#3b5d52] leading-relaxed">
            All schedules are interpreted in Malaysia Time (UTC+08:00). Reservations have a standard 2-hour threshold, an 8-hour maximum duration, and a 24-hour review hold for approval-mode facilities.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[#e2ece7] bg-white p-6 sm:p-8 shadow-xs space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Lab Select */}
          <div className="sm:col-span-2">
            <label
              htmlFor="booking-lab-id"
              className="block text-xs font-bold text-[#3b5049] mb-1.5"
            >
              Laboratory Facility <span className="text-[#b03838]">*</span>
            </label>
            <div className="relative">
              <select
                id="booking-lab-id"
                name="lab_id"
                required
                value={labId}
                onChange={(e) => setLabId(e.target.value)}
                className="block w-full rounded-lg border border-[#d6e2dc] bg-white py-2.5 px-3 text-sm text-[#13221e] focus:border-[#164e43] focus:ring-1 focus:ring-[#164e43]"
              >
                <option value="" disabled>
                  Select an available laboratory
                </option>
                {labs.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.code}) · {l.capacity} Seats · {l.building}
                  </option>
                ))}
              </select>
            </div>
            {currentSelectedLab && (
              <div className="mt-2 flex items-center gap-2 text-xs text-[#556c64]">
                <Building2 className="h-3.5 w-3.5 text-[#164e43]" />
                <span>
                  {currentSelectedLab.capacity} student capacity · Mode:{' '}
                  <strong>{currentSelectedLab.booking_mode === 'automatic' ? 'Automatic Confirmation' : 'Requires Faculty Approval'}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Subject / Class */}
          <div className="sm:col-span-2">
            <label
              htmlFor="booking-subject"
              className="block text-xs font-bold text-[#3b5049] mb-1.5"
            >
              Course Code or Subject Title <span className="text-[#b03838]">*</span>
            </label>
            <input
              id="booking-subject"
              name="subject"
              required
              maxLength={255}
              placeholder="e.g. CS204 Advanced Operating Systems Lab"
              className="block w-full rounded-lg border border-[#d6e2dc] bg-white py-2.5 px-3 text-sm text-[#13221e] placeholder:text-[#91a69f] focus:border-[#164e43] focus:ring-1 focus:ring-[#164e43]"
            />
          </div>

          {/* Start Time */}
          <div>
            <label
              htmlFor="booking-start-at"
              className="block text-xs font-bold text-[#3b5049] mb-1.5"
            >
              Start Date & Time (MYT) <span className="text-[#b03838]">*</span>
            </label>
            <input
              id="booking-start-at"
              name="start_at"
              defaultValue={initialStart}
              type="datetime-local"
              required
              className="block w-full rounded-lg border border-[#d6e2dc] bg-white py-2.5 px-3 text-sm text-[#13221e] focus:border-[#164e43] focus:ring-1 focus:ring-[#164e43]"
            />
          </div>

          {/* End Time */}
          <div>
            <label
              htmlFor="booking-end-at"
              className="block text-xs font-bold text-[#3b5049] mb-1.5"
            >
              End Date & Time (MYT) <span className="text-[#b03838]">*</span>
            </label>
            <input
              id="booking-end-at"
              name="end_at"
              defaultValue={initialEnd}
              type="datetime-local"
              required
              className="block w-full rounded-lg border border-[#d6e2dc] bg-white py-2.5 px-3 text-sm text-[#13221e] focus:border-[#164e43] focus:ring-1 focus:ring-[#164e43]"
            />
          </div>

          {/* Expected Students */}
          <div>
            <label
              htmlFor="booking-expected-students"
              className="block text-xs font-bold text-[#3b5049] mb-1.5"
            >
              Expected Student Count
            </label>
            <input
              id="booking-expected-students"
              name="expected_students"
              type="number"
              min="1"
              max={currentSelectedLab ? currentSelectedLab.capacity : 500}
              placeholder={currentSelectedLab ? `Up to ${currentSelectedLab.capacity}` : 'e.g. 35'}
              className="block w-full rounded-lg border border-[#d6e2dc] bg-white py-2.5 px-3 text-sm text-[#13221e] placeholder:text-[#91a69f] focus:border-[#164e43] focus:ring-1 focus:ring-[#164e43]"
            />
          </div>

          {/* Special Event Checkbox */}
          <div className="flex items-center sm:pt-6">
            <label
              htmlFor="booking-special-event"
              className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-[#3b5049]"
            >
              <input
                id="booking-special-event"
                name="special_event"
                type="checkbox"
                className="h-4 w-4 rounded border-[#d6e2dc] text-[#164e43] focus:ring-[#164e43]"
              />
              <span>This reservation is for a special institutional event</span>
            </label>
          </div>

          {/* Purpose */}
          <div className="sm:col-span-2">
            <label
              htmlFor="booking-purpose"
              className="block text-xs font-bold text-[#3b5049] mb-1.5"
            >
              Session Purpose & Curriculum Requirements <span className="text-[#b03838]">*</span>
            </label>
            <textarea
              id="booking-purpose"
              name="purpose"
              required
              rows={4}
              maxLength={3000}
              placeholder="Describe the software tools, hardware equipment, and session activities required for this class session..."
              className="block w-full rounded-lg border border-[#d6e2dc] bg-white p-3 text-sm text-[#13221e] placeholder:text-[#91a69f] focus:border-[#164e43] focus:ring-1 focus:ring-[#164e43]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#edf3f0] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-[#d6e2dc] bg-white px-4 py-2.5 text-xs font-semibold text-[#486057] hover:bg-[#f3f8f5] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#164e43] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#1b5f52] transition-colors disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Verifying Availability...</span>
              </>
            ) : (
              <>
                <span>Submit Reservation Request</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
