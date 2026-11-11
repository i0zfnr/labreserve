import { useState, type FormEvent } from 'react'
import type { Booking } from '../types'

function localInput(value: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Kuala_Lumpur', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23'}).formatToParts(new Date(value))
  const get = (type: string) => parts.find(part => part.type === type)?.value || ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

export function RescheduleModal({booking, onClose, onSubmit}: {booking: Booking; onClose:()=>void; onSubmit:(booking:Booking,start:string,end:string)=>Promise<void>}) {
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); const values=new FormData(event.currentTarget); setBusy(true);setError('')
    try { await onSubmit(booking,String(values.get('start')),String(values.get('end'))) }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to reschedule this booking.') }
    finally { setBusy(false) }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c241e]/60 p-4" role="dialog" aria-modal="true" aria-labelledby="reschedule-title">
    <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl border border-[#e2ece7] bg-white p-6 shadow-xl">
      <div><h2 id="reschedule-title" className="font-heading text-lg font-bold">Reschedule reservation</h2><p className="mt-1 text-sm text-[#556c64]">{booking.booking_reference} · {booking.lab?.name}. Times are Malaysia time.</p></div>
      <p className="text-xs text-[#556c64]">The lab stays the same. A request requiring approval will be reviewed again. The existing reservation stays in place if the new time is unavailable.</p>
      <label className="block text-sm font-semibold">Start<input name="start" type="datetime-local" required defaultValue={localInput(booking.start_at)} className="mt-1 w-full rounded-lg border border-[#d6e2dc] px-3 py-2"/></label>
      <label className="block text-sm font-semibold">End<input name="end" type="datetime-local" required defaultValue={localInput(booking.end_at)} className="mt-1 w-full rounded-lg border border-[#d6e2dc] px-3 py-2"/></label>
      {error && <p role="alert" className="rounded-lg bg-[#fdeeed] p-3 text-sm text-[#b03838]">{error}</p>}
      <div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className="rounded-lg border border-[#d6e2dc] px-4 py-2 text-sm font-semibold">Close</button><button disabled={busy} className="rounded-lg bg-[#164e43] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy?'Saving…':'Save changes'}</button></div>
    </form>
  </div>
}
