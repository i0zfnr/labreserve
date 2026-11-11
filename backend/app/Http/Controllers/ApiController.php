<?php
namespace App\Http\Controllers;
use App\Models\{Booking,Lab};
use App\Services\BookingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth,DB};
use Illuminate\Validation\ValidationException;

class ApiController extends Controller {
 private function admin(Request $r): void { abort_unless($r->user()->role==='admin' && $r->user()->is_active,403); }
 public function login(Request $r) { $credentials=$r->validate(['email'=>'required|email','password'=>'required|string']); if (!Auth::attempt($credentials + ['is_active'=>true])) throw ValidationException::withMessages(['email'=>'Invalid credentials or inactive account.']); $r->session()->regenerate(); return response()->json(['data'=>$r->user()]); }
 public function me(Request $r) { abort_unless($r->user()->is_active,403); return ['data'=>$r->user()]; }
 public function logout(Request $r) { Auth::guard('web')->logout(); $r->session()->invalidate(); $r->session()->regenerateToken(); return response()->noContent(); }
 public function labs(Request $r) { abort_unless($r->user()->is_active,403); return ['data'=>Lab::where('is_active',true)->orderBy('name')->get()]; }
 public function publicLabs() { return ['data'=>Lab::where('is_active',true)->orderBy('name')->get(['id','name','code','building','floor','capacity','description','booking_mode'])]; }
 public function publicStatus(string $code) {
  $lab=Lab::where('code',$code)->where('is_active',true)->firstOrFail(['id','name','code','building','floor','capacity','description']);
  $now=now(); $local=$now->copy()->setTimezone('Asia/Kuala_Lumpur');
  $current=Booking::where('lab_id',$lab->id)->where('status','confirmed')->where('start_at','<=',$now)->where('end_at','>',$now)->orderBy('start_at')->first(['start_at','end_at']);
  $next=Booking::where('lab_id',$lab->id)->where('status','confirmed')->where('start_at','>',$now)->orderBy('start_at')->first(['start_at','end_at']);
  $maintenance=DB::table('lab_closures')->where('lab_id',$lab->id)->where('start_at','<=',$now)->where('end_at','>',$now)->exists();
  $pending=Booking::where('lab_id',$lab->id)->where('status','pending')->where('start_at','<=',$now)->where('end_at','>',$now)->where(function($q) use ($now) { $q->whereNull('expires_at')->orWhere('expires_at','>',$now); })->exists();
  $recurring=DB::table('recurring_schedules')->where('lab_id',$lab->id)->where('weekday',$local->dayOfWeek)->where('effective_from','<=',$local->toDateString())->where('effective_until','>=',$local->toDateString())->where('start_time','<=',$local->format('H:i:s'))->where('end_time','>',$local->format('H:i:s'))->exists();
  $hours=DB::table('lab_operating_hours')->where('lab_id',$lab->id)->where('weekday',$local->dayOfWeek)->first();
  $closed=!$hours || $hours->is_closed || !$hours->opens_at || !$hours->closes_at || $local->format('H:i:s')<$hours->opens_at || $local->format('H:i:s')>=$hours->closes_at;
  $status=$maintenance?'maintenance':(($current || $recurring)?'in_session':($pending?'pending':($closed?'closed':'available')));
  return ['data'=>['lab'=>$lab,'status'=>$status,'current'=>$current,'next'=>$next]];
 }
 public function bookings(Request $r) { abort_unless($r->user()->is_active,403); $q=Booking::with('lab','user')->orderByDesc('start_at'); if ($r->user()->role!=='admin') $q->where('user_id',$r->user()->id); return $q->paginate(50); }
 public function createBooking(Request $r,BookingService $service) {
  $d=$r->validate(['lab_id'=>'required|integer|exists:labs,id','subject'=>'required|string|max:255','purpose'=>'required|string|max:3000','start_at'=>['required','date','regex:/\\d{4}-\\d{2}-\\d{2}T.*(Z|[+-]\\d{2}:\\d{2})$/'],'end_at'=>['required','date','regex:/\\d{4}-\\d{2}-\\d{2}T.*(Z|[+-]\\d{2}:\\d{2})$/'],'expected_students'=>'nullable|integer|min:1','notes'=>'nullable|string|max:3000','special_event'=>'sometimes|boolean']);
  return response()->json(['data'=>$service->create($r->user(),$d)],201);
 }
 public function cancel(Request $r,Booking $booking,BookingService $service) { abort_unless($r->user()->is_active,403); return ['data'=>$service->transition($booking,$r->user(),'cancel')]; }
 public function approvals(Request $r) { $this->admin($r); return Booking::with('lab','user')->where('status','pending')->orderBy('created_at')->paginate(50); }
 public function approve(Request $r,Booking $booking,BookingService $service) { $this->admin($r); return ['data'=>$service->transition($booking,$r->user(),'approve')]; }
 public function reject(Request $r,Booking $booking,BookingService $service) { $this->admin($r); $d=$r->validate(['reason'=>'required|string|max:3000']); return ['data'=>$service->transition($booking,$r->user(),'reject',$d['reason'])]; }
}
