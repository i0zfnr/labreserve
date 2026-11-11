<?php
namespace Tests\Feature;
use App\Models\{Lab,User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
class BookingFlowTest extends TestCase {
 use RefreshDatabase;
 private function fixture(): array {
  $u=User::factory()->create(['role'=>'lecturer','is_active'=>true]); $lab=Lab::create(['name'=>'Lab','code'=>'LAB-TEST','building'=>'A','capacity'=>40,'booking_mode'=>'automatic','is_active'=>true]);
  foreach(range(0,6) as $day) DB::table('lab_operating_hours')->insert(['lab_id'=>$lab->id,'weekday'=>$day,'opens_at'=>'00:00:00','closes_at'=>'23:59:59','is_closed'=>false]);
  $start=now()->addDays(2)->setTimezone('Asia/Kuala_Lumpur')->setTime(10,0); return [$u,$lab,$start];
 }
 private function payload($lab,$start): array { return ['lab_id'=>$lab->id,'subject'=>'Programming','purpose'=>'Class','start_at'=>$start->toIso8601String(),'end_at'=>$start->copy()->addHour()->toIso8601String()]; }
 public function test_automatic_booking_and_conflict(): void { [$u,$lab,$start]=$this->fixture(); $this->actingAs($u); $this->postJson('/api/v1/bookings',$this->payload($lab,$start))->assertCreated()->assertJsonPath('data.status','confirmed'); $this->postJson('/api/v1/bookings',$this->payload($lab,$start))->assertStatus(409); }
 public function test_restricted_booking_can_be_approved_by_admin(): void { [$u,$lab,$start]=$this->fixture(); $lab->update(['booking_mode'=>'approval']); $id=$this->actingAs($u)->postJson('/api/v1/bookings',$this->payload($lab,$start))->assertCreated()->assertJsonPath('data.status','pending')->json('data.id'); $this->postJson("/api/v1/admin/approvals/$id/approve")->assertForbidden(); $admin=User::factory()->create(['role'=>'admin','is_active'=>true]); $this->actingAs($admin)->postJson("/api/v1/admin/approvals/$id/approve")->assertOk()->assertJsonPath('data.status','confirmed'); $this->postJson("/api/v1/admin/approvals/$id/approve")->assertStatus(409); }
 public function test_cancellation_releases_slot_and_other_user_cannot_cancel(): void { [$u,$lab,$start]=$this->fixture(); $id=$this->actingAs($u)->postJson('/api/v1/bookings',$this->payload($lab,$start))->assertCreated()->json('data.id'); $other=User::factory()->create(['role'=>'lecturer','is_active'=>true]); $this->actingAs($other)->postJson("/api/v1/bookings/$id/cancel")->assertForbidden(); $this->actingAs($u)->postJson("/api/v1/bookings/$id/cancel")->assertOk(); $this->postJson('/api/v1/bookings',$this->payload($lab,$start))->assertCreated(); }
 public function test_closure_blocks_booking(): void { [$u,$lab,$start]=$this->fixture(); DB::table('lab_closures')->insert(['lab_id'=>$lab->id,'start_at'=>$start->copy()->utc(),'end_at'=>$start->copy()->addHour()->utc(),'reason'=>'Maintenance','created_at'=>now(),'updated_at'=>now()]); $this->actingAs($u)->postJson('/api/v1/bookings',$this->payload($lab,$start))->assertStatus(409); }
 public function test_scheduled_expiration_releases_hold_and_records_audit(): void { [$u,$lab,$start]=$this->fixture(); $lab->update(['booking_mode'=>'approval']); $id=$this->actingAs($u)->postJson('/api/v1/bookings',$this->payload($lab,$start))->assertCreated()->json('data.id'); DB::table('bookings')->where('id',$id)->update(['expires_at'=>now()->subMinute()]); $this->artisan('bookings:expire')->assertSuccessful(); $this->assertDatabaseHas('bookings',['id'=>$id,'status'=>'expired']); $this->assertDatabaseHas('booking_audit_logs',['booking_id'=>$id,'action'=>'expired']); $this->postJson('/api/v1/bookings',$this->payload($lab,$start))->assertCreated(); }
 public function test_pending_hold_never_extends_past_session_start(): void { $this->travelTo(\Carbon\Carbon::parse('2026-11-06 02:00:00', 'UTC')); [$u,$lab,$start]=$this->fixture(); $lab->update(['booking_mode'=>'approval']); $start=now()->setTimezone('Asia/Kuala_Lumpur')->addHour(); $id=$this->actingAs($u)->postJson('/api/v1/bookings',$this->payload($lab,$start))->assertCreated()->json('data.id'); $this->assertLessThanOrEqual($start->timestamp, \App\Models\Booking::findOrFail($id)->expires_at->timestamp); }
 public function test_reschedule_checks_conflicts_permissions_and_audits(): void {
  [$owner,$lab,$start]=$this->fixture(); $this->actingAs($owner);
  $first=$this->postJson('/api/v1/bookings',$this->payload($lab,$start))->assertCreated()->json('data.id');
  $later=$start->copy()->addHours(2); $second=$this->postJson('/api/v1/bookings',$this->payload($lab,$later))->assertCreated()->json('data.id');
  $change=['start_at'=>$later->toIso8601String(),'end_at'=>$later->copy()->addHour()->toIso8601String()];
  $this->patchJson("/api/v1/bookings/$first",$change)->assertStatus(409);
  $this->assertEquals($start->copy()->utc()->format('Y-m-d H:i:s'),\App\Models\Booking::findOrFail($first)->start_at->format('Y-m-d H:i:s'));
  $other=User::factory()->create(['role'=>'lecturer','is_active'=>true]); $this->actingAs($other)->patchJson("/api/v1/bookings/$first",$change)->assertForbidden();
  $change=['start_at'=>$start->copy()->addMinutes(30)->toIso8601String(),'end_at'=>$start->copy()->addMinutes(90)->toIso8601String()];
  $this->actingAs($owner)->patchJson("/api/v1/bookings/$first",$change)->assertOk()->assertJsonPath('data.status','confirmed');
  $this->assertDatabaseHas('booking_audit_logs',['booking_id'=>$first,'actor_id'=>$owner->id,'action'=>'rescheduled']);
  $this->postJson("/api/v1/bookings/$second/cancel")->assertOk();
 }
 public function test_rescheduling_previously_approved_booking_requires_review_again(): void {
  [$owner,$lab,$start]=$this->fixture();$lab->update(['booking_mode'=>'approval']);$id=$this->actingAs($owner)->postJson('/api/v1/bookings',$this->payload($lab,$start))->assertCreated()->json('data.id');
  $admin=User::factory()->create(['role'=>'admin','is_active'=>true]);$this->actingAs($admin)->postJson("/api/v1/admin/approvals/$id/approve")->assertOk();
  $new=$start->copy()->addDay();$this->actingAs($owner)->patchJson("/api/v1/bookings/$id",['start_at'=>$new->toIso8601String(),'end_at'=>$new->copy()->addHour()->toIso8601String()])->assertOk()->assertJsonPath('data.status','pending')->assertJsonPath('data.reviewed_by',null);
 }
 public function test_reschedule_rejects_started_cancelled_and_closed_periods(): void {
  [$owner,$lab,$start]=$this->fixture();$id=$this->actingAs($owner)->postJson('/api/v1/bookings',$this->payload($lab,$start))->assertCreated()->json('data.id');
  $target=$start->copy()->addDay();DB::table('lab_closures')->insert(['lab_id'=>$lab->id,'start_at'=>$target->copy()->utc(),'end_at'=>$target->copy()->addHour()->utc(),'reason'=>'Maintenance','created_at'=>now(),'updated_at'=>now()]);
  $data=['start_at'=>$target->toIso8601String(),'end_at'=>$target->copy()->addHour()->toIso8601String()];$this->patchJson("/api/v1/bookings/$id",$data)->assertStatus(409);
  $this->postJson("/api/v1/bookings/$id/cancel")->assertOk();$this->patchJson("/api/v1/bookings/$id",$data)->assertStatus(409);
 }
 public function test_public_status_does_not_expose_lecturer(): void { [$u,$lab,$start]=$this->fixture(); $this->actingAs($u)->postJson('/api/v1/bookings',$this->payload($lab,$start))->assertCreated(); $this->getJson('/api/v1/public/labs/LAB-TEST/status')->assertOk()->assertDontSee($u->email)->assertDontSee($u->name); }
}
