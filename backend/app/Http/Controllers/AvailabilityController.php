<?php
namespace App\Http\Controllers;

use App\Models\{Booking, Lab};
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AvailabilityController extends Controller
{
    private function range(Request $request, int $maximumHours): array
    {
        $rule = ['required','date','regex:/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/'];
        $data = $request->validate(['start_at'=>$rule, 'end_at'=>$rule]);
        $start = CarbonImmutable::parse($data['start_at'])->utc();
        $end = CarbonImmutable::parse($data['end_at'])->utc();
        if ($end->lessThanOrEqualTo($start) || $end->greaterThan($start->addHours($maximumHours))) {
            throw ValidationException::withMessages(['end_at'=>'Choose an end after the start within the allowed range.']);
        }
        return [$start, $end];
    }

    public function search(Request $request)
    {
        [$start,$end] = $this->range($request, 8);
        $data = $request->validate(['capacity'=>['nullable','integer','min:1']]);
        if ($start->isPast()) throw ValidationException::withMessages(['start_at'=>'Choose a future start time.']);
        $localStart = $start->setTimezone('Asia/Kuala_Lumpur'); $localEnd = $end->setTimezone('Asia/Kuala_Lumpur');
        if ($localStart->toDateString() !== $localEnd->toDateString()) throw ValidationException::withMessages(['end_at'=>'The period must be on one Malaysia calendar day.']);
        $labs=Lab::where('is_active',true)->when(!empty($data['capacity']),fn($q)=>$q->where('capacity','>=',$data['capacity']))->orderBy('name')->get();
        $results=$labs->map(function (Lab $lab) use ($start,$end,$localStart,$localEnd) {
            $hours=DB::table('lab_operating_hours')->where('lab_id',$lab->id)->where('weekday',$localStart->dayOfWeek)->first();
            $closed=!$hours || $hours->is_closed || !$hours->opens_at || !$hours->closes_at || $localStart->format('H:i:s')<$hours->opens_at || $localEnd->format('H:i:s')>$hours->closes_at;
            $closure=DB::table('lab_closures')->where('lab_id',$lab->id)->where('start_at','<',$end)->where('end_at','>',$start)->exists();
            $recurring=DB::table('recurring_schedules')->where('lab_id',$lab->id)->where('weekday',$localStart->dayOfWeek)->where('effective_from','<=',$localStart->toDateString())->where('effective_until','>=',$localStart->toDateString())->where('start_time','<',$localEnd->format('H:i:s'))->where('end_time','>',$localStart->format('H:i:s'))->exists();
            $booking=Booking::where('lab_id',$lab->id)->where('start_at','<',$end)->where('end_at','>',$start)->where(function($q){$q->where('status','confirmed')->orWhere(function($q){$q->where('status','pending')->where(function($q){$q->whereNull('expires_at')->orWhere('expires_at','>',now());});});})->exists();
            $reason=$closed?'outside_hours':($closure?'maintenance':(($recurring || $booking)?'reserved':null));
            return ['lab'=>$lab->only(['id','name','code','building','floor','capacity','description','booking_mode']), 'available'=>$reason===null, 'reason'=>$reason];
        });
        return ['data'=>$results, 'checked_at'=>now()->toIso8601String()];
    }

    public function calendar(Request $request)
    {
        [$start,$end]=$this->range($request, 24*93);
        $data=$request->validate(['lab_id'=>['nullable','integer','exists:labs,id']]);
        $ids=Lab::where('is_active',true)->when(!empty($data['lab_id']),fn($q)=>$q->whereKey($data['lab_id']))->pluck('id');
        $events=[];
        $bookings=Booking::whereIn('lab_id',$ids)->where('start_at','<',$end)->where('end_at','>',$start)->where(function($q){$q->where('status','confirmed')->orWhere(function($q){$q->where('status','pending')->where(function($q){$q->whereNull('expires_at')->orWhere('expires_at','>',now());});});})->get(['id','lab_id','start_at','end_at','status']);
        foreach($bookings as $b) $events[]=['id'=>'booking-'.$b->id,'lab_id'=>$b->lab_id,'title'=>$b->status==='pending'?'Pending approval':'Reserved','status'=>$b->status,'start'=>$b->start_at->toIso8601String(),'end'=>$b->end_at->toIso8601String()];
        foreach(DB::table('lab_closures')->whereIn('lab_id',$ids)->where('start_at','<',$end)->where('end_at','>',$start)->get() as $c) $events[]=['id'=>'closure-'.$c->id,'lab_id'=>$c->lab_id,'title'=>'Maintenance','status'=>'maintenance','start'=>CarbonImmutable::parse($c->start_at,'UTC')->toIso8601String(),'end'=>CarbonImmutable::parse($c->end_at,'UTC')->toIso8601String()];
        $from=$start->setTimezone('Asia/Kuala_Lumpur')->startOfDay(); $to=$end->setTimezone('Asia/Kuala_Lumpur')->startOfDay();
        $schedules=DB::table('recurring_schedules')->whereIn('lab_id',$ids)->where('effective_from','<=',$to->toDateString())->where('effective_until','>=',$from->toDateString())->get();
        foreach($schedules as $schedule) for($day=$from;$day->lessThanOrEqualTo($to);$day=$day->addDay()) {
            if ($day->dayOfWeek!==(int)$schedule->weekday || $day->toDateString()<$schedule->effective_from || $day->toDateString()>$schedule->effective_until) continue;
            $s=CarbonImmutable::parse($day->toDateString().' '.$schedule->start_time,'Asia/Kuala_Lumpur')->utc(); $e=CarbonImmutable::parse($day->toDateString().' '.$schedule->end_time,'Asia/Kuala_Lumpur')->utc();
            if($s->lessThan($end) && $e->greaterThan($start)) $events[]=['id'=>'recurring-'.$schedule->id.'-'.$day->toDateString(),'lab_id'=>$schedule->lab_id,'title'=>'Scheduled session','status'=>'confirmed','start'=>$s->toIso8601String(),'end'=>$e->toIso8601String()];
        }
        return ['data'=>$events];
    }
}
