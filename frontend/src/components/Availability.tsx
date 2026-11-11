import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import luxonPlugin from '@fullcalendar/luxon3'
import type { DateSelectArg, DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core'
import type { Lab } from '../types'
import { parseApiError } from '../utils/format'

type Period = { start: string; end: string }
type SearchResult = { lab: Lab; available: boolean; reason: string | null }
type CalendarRow = { id:string; lab_id:number; title:string; status:string; start:string; end:string }
const field = 'rounded-lg border border-[#d6e2dc] bg-white px-3 py-2 text-sm text-[#13221e]'
const primary = 'rounded-lg bg-[#164e43] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'
const labels: Record<string,string> = { outside_hours:'Outside operating hours', maintenance:'Maintenance', reserved:'Already reserved' }

export function Availability({labs, authenticated, onBook}: {labs: Lab[]; authenticated:boolean; onBook:(lab:Lab,period:Period)=>void}) {
 const [period,setPeriod]=useState<Period|null>(null)
 const [capacity,setCapacity]=useState('')
 const [searching,setSearching]=useState(false)
 const [results,setResults]=useState<SearchResult[]|null>(null)
 const [searchError,setSearchError]=useState('')
 const [labId,setLabId]=useState('')
 const [range,setRange]=useState<Period|null>(null)
 const [selectedEvent,setSelectedEvent]=useState<{title:string;start:string;end:string}|null>(null)
 const events=useQuery<CalendarRow[]>({queryKey:['calendar',range,labId],enabled:!!range,queryFn:async()=>{const r=await axios.get('/api/v1/public/calendar',{params:{start_at:range!.start,end_at:range!.end,lab_id:labId||undefined}});return r.data.data}})
 async function search(e:FormEvent<HTMLFormElement>) {
  e.preventDefault(); const f=new FormData(e.currentTarget); const p={start:String(f.get('start')),end:String(f.get('end'))};setSearching(true);setSearchError('');setResults(null)
  try {const r=await axios.get('/api/v1/public/availability',{params:{start_at:`${p.start}:00+08:00`,end_at:`${p.end}:00+08:00`,capacity:capacity||undefined}});setPeriod(p);setResults(r.data.data)}catch(err){setSearchError(parseApiError(err))}finally{setSearching(false)}
 }
 const calendarEvents:EventInput[]=(events.data||[]).map(e=>({id:e.id,title:`${labs.find(l=>l.id===e.lab_id)?.code || 'Lab'} · ${e.title}`,start:e.start,end:e.end,backgroundColor:e.status==='pending'?'#b77919':e.status==='maintenance'?'#66726e':'#ad4545',borderColor:'transparent'}))
 function onDates(info:DatesSetArg) {setRange({start:info.startStr,end:info.endStr})}
 function select(info:DateSelectArg) {if(info.allDay || !labId || !authenticated)return;const lab=labs.find(l=>l.id===Number(labId));if(lab)onBook(lab,{start:info.startStr.slice(0,16),end:info.endStr.slice(0,16)})}
 function eventClick(info:EventClickArg) {setSelectedEvent({title:info.event.title,start:info.event.start?.toLocaleString('en-MY',{timeZone:'Asia/Kuala_Lumpur'}) || '',end:info.event.end?.toLocaleString('en-MY',{timeZone:'Asia/Kuala_Lumpur'}) || ''})}
 return <section className="space-y-6"><div><h1 className="font-heading text-2xl font-bold">Availability & calendar</h1><p className="mt-1 text-sm text-[#60776e]">Search by time and view scheduled sessions. All times are Malaysia time.</p></div>
 <form onSubmit={search} className="grid gap-3 rounded-xl border border-[#e2ece7] bg-white p-5 sm:grid-cols-2 lg:grid-cols-4"><label className="grid gap-1 text-sm font-semibold">Start (MYT)<input className={field} name="start" type="datetime-local" required/></label><label className="grid gap-1 text-sm font-semibold">End (MYT)<input className={field} name="end" type="datetime-local" required/></label><label className="grid gap-1 text-sm font-semibold">Minimum seats<input className={field} type="number" min="1" value={capacity} onChange={e=>setCapacity(e.target.value)} placeholder="Any"/></label><button className={`${primary} self-end`} disabled={searching}>{searching?'Checking…':'Check availability'}</button></form>
 {searchError&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{searchError}</p>}
 {results&&<div className="space-y-3 rounded-xl border border-[#e2ece7] bg-white p-5"><h2 className="font-bold">Search results</h2><p className="text-xs text-[#60776e]">Availability can change. The server checks again when you submit a booking.</p>{results.length===0&&<p className="text-sm">No labs match the capacity requirement.</p>}{results.map(r=><div key={r.lab.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf3f0] pt-3"><div><strong className="text-sm">{r.lab.name}</strong><p className="text-xs text-[#60776e]">{r.lab.code} · {r.lab.capacity} seats · {r.available?'Available':labels[r.reason||'']||'Unavailable'}</p></div>{r.available&&authenticated&&period&&<button className={primary} onClick={()=>onBook(r.lab,period)}>Book this time</button>}</div>)}</div>}
 <div className="space-y-4 rounded-xl border border-[#e2ece7] bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Laboratory calendar</h2><p className="mt-1 text-xs text-[#60776e]">Select one lab, then drag a time in day or week view to book. Times are Malaysia time.</p></div><label className="text-sm font-semibold">Laboratory <select className={field} value={labId} onChange={e=>setLabId(e.target.value)}><option value="">All laboratories</option>{labs.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label></div><p className="text-xs text-[#60776e]">Red: reserved or scheduled · Amber: pending · Gray: maintenance. Select an event for details.</p>{events.isError&&<p role="alert" className="text-sm text-red-700">Could not load calendar. Try changing the date or lab.</p>}{events.isLoading&&<p className="text-sm">Loading calendar…</p>}
 <div className="overflow-x-auto"><div className="min-w-[600px]"><FullCalendar plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin,luxonPlugin]} timeZone="Asia/Kuala_Lumpur" initialView="timeGridWeek" headerToolbar={{left:'prev,next today',center:'title',right:'dayGridMonth,timeGridWeek,timeGridDay'}} height="auto" selectable={!!labId&&authenticated} select={select} datesSet={onDates} events={calendarEvents} eventClick={eventClick} nowIndicator allDaySlot={false} /></div></div></div>
 {selectedEvent&&<div role="dialog" aria-modal="true" aria-labelledby="calendar-event-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-sm rounded-xl bg-white p-6"><h2 id="calendar-event-title" className="font-bold">{selectedEvent.title}</h2><p className="mt-3 text-sm">{selectedEvent.start} – {selectedEvent.end} MYT</p><button className={`${primary} mt-5`} onClick={()=>setSelectedEvent(null)}>Close</button></div></div>}
 </section>
}
