<?php
namespace Tests\Feature;
use App\Models\{Lab,User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
class AvailabilityTest extends TestCase {
 use RefreshDatabase;
 public function test_search_and_calendar_cover_conflicts_without_exposing_details(): void {
  $this->travelTo(\Carbon\Carbon::parse('2026-11-12 00:00:00','UTC'));
  $user=User::factory()->create(['role'=>'lecturer','is_active'=>true]);
  $lab=Lab::create(['name'=>'Lab A','code'=>'LAB-A','building'=>'Main','capacity'=>30,'booking_mode'=>'automatic','is_active'=>true]);
  DB::table('lab_operating_hours')->insert(['lab_id'=>$lab->id,'weekday'=>4,'opens_at'=>'08:00','closes_at'=>'18:00','is_closed'=>false]);
  $query=['start_at'=>'2026-11-12T10:00:00+08:00','end_at'=>'2026-11-12T11:00:00+08:00'];
  $this->getJson('/api/v1/public/availability?'.http_build_query($query))->assertOk()->assertJsonPath('data.0.available',true);
  DB::table('bookings')->insert(['booking_reference'=>'PRIVATE-1','user_id'=>$user->id,'lab_id'=>$lab->id,'subject'=>'Private subject','purpose'=>'Private purpose','start_at'=>'2026-11-12 02:00:00','end_at'=>'2026-11-12 03:00:00','status'=>'confirmed','approval_required'=>false,'created_at'=>now(),'updated_at'=>now()]);
  $this->getJson('/api/v1/public/availability?'.http_build_query($query))->assertOk()->assertJsonPath('data.0.reason','reserved');
  $this->getJson('/api/v1/public/calendar?'.http_build_query($query))->assertOk()->assertJsonPath('data.0.title','Reserved')->assertDontSee($user->email)->assertDontSee('Private subject')->assertDontSee('PRIVATE-1');
  $adjacent=['start_at'=>'2026-11-12T11:00:00+08:00','end_at'=>'2026-11-12T12:00:00+08:00'];
  $this->getJson('/api/v1/public/availability?'.http_build_query($adjacent))->assertJsonPath('data.0.available',true);
  DB::table('lab_closures')->insert(['lab_id'=>$lab->id,'start_at'=>'2026-11-12 03:00:00','end_at'=>'2026-11-12 04:00:00','reason'=>'Private maintenance','created_at'=>now(),'updated_at'=>now()]);
  $this->getJson('/api/v1/public/availability?'.http_build_query($adjacent))->assertJsonPath('data.0.reason','maintenance');
  $this->getJson('/api/v1/public/calendar?'.http_build_query($adjacent))->assertDontSee('Private maintenance');
 }
 public function test_recurring_sessions_and_validation(): void {
  $this->travelTo(\Carbon\Carbon::parse('2026-11-12 00:00:00','UTC')); $u=User::factory()->create(['is_active'=>true]);
  $lab=Lab::create(['name'=>'Lab A','code'=>'LAB-A','building'=>'Main','capacity'=>30,'booking_mode'=>'automatic','is_active'=>true]);
  DB::table('lab_operating_hours')->insert(['lab_id'=>$lab->id,'weekday'=>4,'opens_at'=>'08:00','closes_at'=>'18:00','is_closed'=>false]);
  DB::table('recurring_schedules')->insert(['lab_id'=>$lab->id,'lecturer_id'=>$u->id,'subject'=>'Private','weekday'=>4,'start_time'=>'10:00','end_time'=>'11:00','effective_from'=>'2026-11-01','effective_until'=>'2026-12-01','created_at'=>now(),'updated_at'=>now()]);
  $query=['start_at'=>'2026-11-12T10:00:00+08:00','end_at'=>'2026-11-12T11:00:00+08:00'];
  $this->getJson('/api/v1/public/availability?'.http_build_query($query))->assertJsonPath('data.0.reason','reserved');
  $this->getJson('/api/v1/public/calendar?'.http_build_query($query))->assertJsonPath('data.0.title','Scheduled session')->assertDontSee('Private');
  $query['end_at']='2026-11-13T10:00:00+08:00'; $this->getJson('/api/v1/public/availability?'.http_build_query($query))->assertUnprocessable();
 }
}
