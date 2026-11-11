<?php
namespace App\Http\Controllers;

use App\Models\{Booking, Lab};
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class LabManagementController extends Controller
{
    private function admin(Request $request): void
    {
        abort_unless($request->user()->is_active && $request->user()->role === 'admin', 403);
    }

    public function index(Request $request)
    {
        $this->admin($request);
        return ['data' => Lab::orderBy('name')->get()];
    }

    public function store(Request $request)
    {
        $this->admin($request);
        $data = $this->validateLab($request);
        $lab = DB::transaction(function () use ($data) {
            $lab = Lab::create($data);
            foreach (range(0, 6) as $day) {
                DB::table('lab_operating_hours')->insert(['lab_id' => $lab->id, 'weekday' => $day, 'is_closed' => true]);
            }
            return $lab;
        });
        return response()->json(['data' => $lab], 201);
    }

    public function update(Request $request, Lab $lab)
    {
        $this->admin($request);
        $data = $this->validateLab($request, $lab);
        return DB::transaction(function () use ($lab, $data) {
            $lab = Lab::whereKey($lab->id)->lockForUpdate()->firstOrFail();
            $active = Booking::where('lab_id', $lab->id)->whereIn('status', ['pending', 'confirmed'])->where('end_at', '>', now());
            if (!$data['is_active'] && ((clone $active)->exists() || DB::table('recurring_schedules')->where('lab_id', $lab->id)->where('effective_until', '>=', now('Asia/Kuala_Lumpur')->toDateString())->exists())) {
                abort(409, 'This lab has active or future sessions. Resolve them before disabling it.');
            }
            if ((clone $active)->where('expected_students', '>', $data['capacity'])->exists()) {
                abort(409, 'The capacity is smaller than an existing reservation.');
            }
            $lab->update($data);
            return ['data' => $lab];
        }, 3);
    }

    private function validateLab(Request $request, ?Lab $lab = null): array
    {
        return $request->validate([
            'name' => ['required','string','max:255'], 'code' => ['required','string','max:50', Rule::unique('labs','code')->ignore($lab?->id)],
            'building' => ['required','string','max:255'], 'floor' => ['nullable','string','max:30'],
            'capacity' => ['required','integer','min:1'], 'description' => ['nullable','string','max:3000'],
            'booking_mode' => ['required', Rule::in(['automatic','approval'])], 'is_active' => ['required','boolean'],
        ]);
    }

    public function hours(Request $request, Lab $lab)
    {
        $this->admin($request);
        return ['data' => DB::table('lab_operating_hours')->where('lab_id', $lab->id)->orderBy('weekday')->get()];
    }

    public function saveHours(Request $request, Lab $lab)
    {
        $this->admin($request);
        $data = $request->validate([
            'hours' => ['required','array','size:7'], 'hours.*.weekday' => ['required','integer','between:0,6','distinct'],
            'hours.*.is_closed' => ['required','boolean'], 'hours.*.opens_at' => ['nullable','date_format:H:i'],
            'hours.*.closes_at' => ['nullable','date_format:H:i'],
        ]);
        foreach ($data['hours'] as $hour) {
            if (!$hour['is_closed'] && (empty($hour['opens_at']) || empty($hour['closes_at']) || $hour['opens_at'] >= $hour['closes_at'])) {
                throw ValidationException::withMessages(['hours' => 'Open days require an opening time before the closing time.']);
            }
        }
        return DB::transaction(function () use ($lab, $data) {
            Lab::whereKey($lab->id)->lockForUpdate()->firstOrFail();
            if (Booking::where('lab_id', $lab->id)->whereIn('status', ['pending','confirmed'])->where('end_at','>',now())->exists() ||
                DB::table('recurring_schedules')->where('lab_id',$lab->id)->where('effective_until','>=',now('Asia/Kuala_Lumpur')->toDateString())->exists()) {
                abort(409, 'Operating hours cannot change while active or future sessions exist.');
            }
            foreach ($data['hours'] as $hour) DB::table('lab_operating_hours')->updateOrInsert(['lab_id'=>$lab->id,'weekday'=>$hour['weekday']], ['is_closed'=>$hour['is_closed'], 'opens_at'=>$hour['is_closed'] ? null : $hour['opens_at'], 'closes_at'=>$hour['is_closed'] ? null : $hour['closes_at']]);
            return ['data' => DB::table('lab_operating_hours')->where('lab_id', $lab->id)->orderBy('weekday')->get()];
        }, 3);
    }

    public function closures(Request $request, Lab $lab)
    {
        $this->admin($request);
        return ['data' => DB::table('lab_closures')->where('lab_id', $lab->id)->orderByDesc('start_at')->get()];
    }

    public function addClosure(Request $request, Lab $lab)
    {
        $this->admin($request);
        $dateRule = ['required','date','regex:/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/'];
        $data = $request->validate(['start_at'=>$dateRule, 'end_at'=>$dateRule, 'reason'=>['required','string','max:3000']]);
        $start = CarbonImmutable::parse($data['start_at'])->utc(); $end = CarbonImmutable::parse($data['end_at'])->utc();
        if ($start->isPast() || $end->lessThanOrEqualTo($start)) throw ValidationException::withMessages(['start_at'=>'Choose a future start and a later end.']);
        if ($end->greaterThan($start->addYear())) throw ValidationException::withMessages(['end_at'=>'A closure cannot exceed one year.']);
        return DB::transaction(function () use ($lab, $start, $end, $data) {
            Lab::whereKey($lab->id)->lockForUpdate()->firstOrFail();
            $overlap = Booking::where('lab_id',$lab->id)->whereIn('status',['pending','confirmed'])->where('start_at','<',$end)->where('end_at','>',$start)->exists();
            $closure = DB::table('lab_closures')->where('lab_id',$lab->id)->where('start_at','<',$end)->where('end_at','>',$start)->exists();
            $from = $start->setTimezone('Asia/Kuala_Lumpur')->startOfDay(); $until = $end->setTimezone('Asia/Kuala_Lumpur')->startOfDay();
            $schedules = DB::table('recurring_schedules')->where('lab_id',$lab->id)->where('effective_from','<=',$until->toDateString())->where('effective_until','>=',$from->toDateString())->get();
            foreach ($schedules as $schedule) {
                for ($day = $from; $day->lessThanOrEqualTo($until); $day = $day->addDay()) {
                    if ($day->dayOfWeek !== (int) $schedule->weekday || $day->toDateString() < $schedule->effective_from || $day->toDateString() > $schedule->effective_until) continue;
                    $sessionStart = CarbonImmutable::parse($day->toDateString().' '.$schedule->start_time, 'Asia/Kuala_Lumpur')->utc();
                    $sessionEnd = CarbonImmutable::parse($day->toDateString().' '.$schedule->end_time, 'Asia/Kuala_Lumpur')->utc();
                    if ($sessionStart->lessThan($end) && $sessionEnd->greaterThan($start)) $overlap = true;
                }
            }
            if ($overlap || $closure) abort(409, 'The closure overlaps an existing session or closure.');
            $id = DB::table('lab_closures')->insertGetId(['lab_id'=>$lab->id,'start_at'=>$start,'end_at'=>$end,'reason'=>$data['reason'],'created_at'=>now(),'updated_at'=>now()]);
            return response()->json(['data'=>DB::table('lab_closures')->find($id)], 201);
        }, 3);
    }

    public function deleteClosure(Request $request, Lab $lab, int $closure)
    {
        $this->admin($request);
        DB::transaction(function () use ($lab, $closure) {
            Lab::whereKey($lab->id)->lockForUpdate()->firstOrFail();
            $row = DB::table('lab_closures')->where('lab_id',$lab->id)->where('id',$closure)->first();
            abort_unless($row, 404);
            if (CarbonImmutable::parse($row->start_at, 'UTC')->isPast()) abort(409, 'Only future closures can be removed.');
            DB::table('lab_closures')->where('id',$closure)->delete();
        }, 3);
        return response()->noContent();
    }
}
