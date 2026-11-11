<?php
namespace App\Services;
use App\Models\{Booking, Lab, User};
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BookingService {
 private function audit(Booking $booking, ?User $actor, string $action, array $old = []): void {
  DB::table('booking_audit_logs')->insert(['booking_id'=>$booking->id,'actor_id'=>$actor?->id,'action'=>$action,'old_values'=>json_encode($old),'new_values'=>json_encode($booking->getAttributes()),'created_at'=>now()]);
 }
 private function expire(int $labId): void {
  $expired = Booking::where('lab_id',$labId)->where('status','pending')->whereNotNull('expires_at')->where('expires_at','<=',now())->get();
  foreach ($expired as $booking) { $old=$booking->getAttributes(); $booking->update(['status'=>'expired']); $this->audit($booking,null,'expired',$old); }
 }
 public function expireDueForLab(int $labId): void {
  DB::transaction(function () use ($labId) {
   if (Lab::whereKey($labId)->lockForUpdate()->first()) $this->expire($labId);
  }, 3);
 }
 private function conflict(int $labId, CarbonImmutable $start, CarbonImmutable $end, ?int $exclude = null): void {
  $overlap = Booking::where('lab_id',$labId)->whereIn('status',['pending','confirmed'])->where('start_at','<',$end)->where('end_at','>',$start)->when($exclude,fn($q)=>$q->where('id','!=',$exclude))->exists();
  $closure = DB::table('lab_closures')->where('lab_id',$labId)->where('start_at','<',$end)->where('end_at','>',$start)->exists();
  if ($overlap || $closure) abort(409,'The laboratory is unavailable for this period.');
  $localStart=$start->setTimezone('Asia/Kuala_Lumpur'); $localEnd=$end->setTimezone('Asia/Kuala_Lumpur');
  if ($localStart->toDateString() !== $localEnd->toDateString()) throw ValidationException::withMessages(['end_at'=>'Bookings must start and end on the same local day.']);
  $recurring=DB::table('recurring_schedules')->where('lab_id',$labId)->where('weekday',$localStart->dayOfWeek)->where('effective_from','<=',$localStart->toDateString())->where('effective_until','>=',$localStart->toDateString())->where('start_time','<',$localEnd->format('H:i:s'))->where('end_time','>',$localStart->format('H:i:s'))->exists();
  if ($recurring) abort(409,'The laboratory has a recurring session during this period.');
 }
 public function create(User $user,array $data): Booking {
  return DB::transaction(function () use ($user,$data) {
   $lab=Lab::whereKey($data['lab_id'])->lockForUpdate()->firstOrFail(); $this->expire($lab->id);
   if (!$lab->is_active || !$user->is_active) abort(403,'Account or laboratory is inactive.');
   $start=CarbonImmutable::parse($data['start_at'])->utc(); $end=CarbonImmutable::parse($data['end_at'])->utc();
   if ($start->isPast() || $end->lessThanOrEqualTo($start)) throw ValidationException::withMessages(['start_at'=>'Choose a future start and a later end.']);
   if (($data['expected_students'] ?? 0)>$lab->capacity) throw ValidationException::withMessages(['expected_students'=>'The class exceeds laboratory capacity.']);
   $this->conflict($lab->id,$start,$end);
   $localStart=$start->setTimezone('Asia/Kuala_Lumpur'); $localEnd=$end->setTimezone('Asia/Kuala_Lumpur');
   $hours=DB::table('lab_operating_hours')->where('lab_id',$lab->id)->where('weekday',$localStart->dayOfWeek)->first();
   if (!$hours || $hours->is_closed || $localStart->format('H:i:s')<$hours->opens_at || $localEnd->format('H:i:s')>$hours->closes_at) throw ValidationException::withMessages(['start_at'=>'The laboratory is outside its configured operating hours.']);
   $minutes=$start->diffInMinutes($end); if ($minutes>480) throw ValidationException::withMessages(['end_at'=>'Bookings may not exceed eight hours.']);
   $reasons=[]; if ($lab->booking_mode !== 'automatic') $reasons[]='Restricted laboratory'; if ($minutes>120) $reasons[]='Longer than the automatic approval threshold'; if (!empty($data['special_event'])) $reasons[]='Special event';
   $booking=Booking::create(['booking_reference'=>'LR-'.strtoupper(Str::random(10)),'user_id'=>$user->id,'lab_id'=>$lab->id,'subject'=>$data['subject'],'purpose'=>$data['purpose'],'expected_students'=>$data['expected_students'] ?? null,'notes'=>$data['notes'] ?? null,'start_at'=>$start,'end_at'=>$end,'status'=>$reasons?'pending':'confirmed','approval_required'=>(bool)$reasons,'approval_reason'=>$reasons?implode('; ',$reasons):null,'expires_at'=>$reasons?min(now()->addHours(24),$start):null]);
   $this->audit($booking,$user,'created'); return $booking->load('lab');
  },3);
 }
 public function transition(Booking $booking,User $actor,string $action,?string $reason=null): Booking {
  return DB::transaction(function () use ($booking,$actor,$action,$reason) {
   Lab::whereKey($booking->lab_id)->lockForUpdate()->firstOrFail(); $this->expire($booking->lab_id);
   $booking=Booking::whereKey($booking->id)->lockForUpdate()->firstOrFail(); $old=$booking->getAttributes();
   if ($action==='cancel') { if ($actor->role!=='admin' && $booking->user_id!==$actor->id) abort(403); if (!in_array($booking->status,['pending','confirmed'],true)) abort(409,'Booking cannot be cancelled.'); $booking->update(['status'=>'cancelled','cancelled_at'=>now()]); }
   else { if ($actor->role!=='admin' || $actor->id===$booking->user_id) abort(403); if ($booking->status!=='pending' || $booking->start_at->isPast()) abort(409,'Request is no longer pending or has already started.'); $booking->update(['status'=>$action==='approve'?'confirmed':'rejected','reviewed_by'=>$actor->id,'reviewed_at'=>now(),'rejection_reason'=>$action==='reject'?$reason:null,'expires_at'=>null]); }
   $this->audit($booking,$actor,$action,$old); return $booking->load('lab','user');
  },3);
 }
}
