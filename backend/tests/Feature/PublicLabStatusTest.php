<?php
namespace Tests\Feature;
use App\Models\{Lab,User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
class PublicLabStatusTest extends TestCase {
 use RefreshDatabase;
 public function test_status_accounts_for_hours_recurring_sessions_and_maintenance(): void {
  $this->travelTo(\Carbon\Carbon::parse('2026-11-12 02:00:00','UTC'));
  $lab=Lab::create(['name'=>'Lab','code'=>'PUBLIC','building'=>'Main','capacity'=>20,'booking_mode'=>'automatic','is_active'=>true]);
  $this->getJson('/api/v1/public/labs/PUBLIC/status')->assertJsonPath('data.status','closed');
  DB::table('lab_operating_hours')->insert(['lab_id'=>$lab->id,'weekday'=>now('Asia/Kuala_Lumpur')->dayOfWeek,'opens_at'=>'08:00','closes_at'=>'18:00','is_closed'=>false]);
  $this->getJson('/api/v1/public/labs/PUBLIC/status')->assertJsonPath('data.status','available');
  $this->getJson('/api/v1/public/labs')->assertJsonPath('data.0.booking_mode','automatic');
  $lecturer=User::factory()->create(['role'=>'lecturer','is_active'=>true]);
  DB::table('recurring_schedules')->insert(['lab_id'=>$lab->id,'lecturer_id'=>$lecturer->id,'subject'=>'Private subject','weekday'=>now('Asia/Kuala_Lumpur')->dayOfWeek,'start_time'=>'09:00','end_time'=>'11:00','effective_from'=>'2026-11-01','effective_until'=>'2026-11-30','created_at'=>now(),'updated_at'=>now()]);
  $this->getJson('/api/v1/public/labs/PUBLIC/status')->assertJsonPath('data.status','in_session')->assertDontSee('Private subject')->assertDontSee($lecturer->email);
  DB::table('lab_closures')->insert(['lab_id'=>$lab->id,'start_at'=>now()->subMinute(),'end_at'=>now()->addHour(),'reason'=>'Private reason','created_at'=>now(),'updated_at'=>now()]);
  $this->getJson('/api/v1/public/labs/PUBLIC/status')->assertJsonPath('data.status','maintenance')->assertDontSee('Private reason');
 }
}
