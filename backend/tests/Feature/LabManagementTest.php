<?php
namespace Tests\Feature;
use App\Models\{Lab,User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
class LabManagementTest extends TestCase {
 use RefreshDatabase;
 private function labData(): array { return ['name'=>'Computer Lab','code'=>'LAB-A','building'=>'Main','floor'=>'1','capacity'=>30,'booking_mode'=>'automatic','is_active'=>true]; }
 private function hours(): array { return array_map(fn($day)=>['weekday'=>$day,'is_closed'=>false,'opens_at'=>'08:00','closes_at'=>'18:00'],range(0,6)); }
 public function test_only_admin_can_manage_labs_and_new_labs_start_closed(): void {
  $lecturer=User::factory()->create(['role'=>'lecturer','is_active'=>true]); $this->actingAs($lecturer)->postJson('/api/v1/admin/labs',$this->labData())->assertForbidden();
  $admin=User::factory()->create(['role'=>'admin','is_active'=>true]); $id=$this->actingAs($admin)->postJson('/api/v1/admin/labs',$this->labData())->assertCreated()->json('data.id');
  $this->assertSame(7,DB::table('lab_operating_hours')->where('lab_id',$id)->where('is_closed',true)->count());
  $this->putJson("/api/v1/admin/labs/$id/hours",['hours'=>$this->hours()])->assertOk();
  $this->getJson('/api/v1/admin/labs')->assertOk()->assertJsonPath('data.0.name','Computer Lab');
 }
 public function test_maintenance_and_hours_do_not_disrupt_existing_bookings(): void {
  $admin=User::factory()->create(['role'=>'admin','is_active'=>true]); $lecturer=User::factory()->create(['role'=>'lecturer','is_active'=>true]); $lab=Lab::create($this->labData());
  $start=now()->addDays(3)->setTimezone('Asia/Kuala_Lumpur')->setTime(10,0); $end=$start->copy()->addHour();
  DB::table('bookings')->insert(['booking_reference'=>'TEST-1','user_id'=>$lecturer->id,'lab_id'=>$lab->id,'subject'=>'Class','purpose'=>'Teaching','start_at'=>$start->copy()->utc(),'end_at'=>$end->copy()->utc(),'status'=>'confirmed','approval_required'=>false,'created_at'=>now(),'updated_at'=>now()]);
  $this->actingAs($admin)->postJson("/api/v1/admin/labs/$lab->id/closures",['start_at'=>$start->toIso8601String(),'end_at'=>$end->toIso8601String(),'reason'=>'Maintenance'])->assertStatus(409);
  $this->putJson("/api/v1/admin/labs/$lab->id/hours",['hours'=>$this->hours()])->assertStatus(409);
  $this->patchJson("/api/v1/admin/labs/$lab->id",array_replace($this->labData(),['is_active'=>false]))->assertStatus(409);
  $start->addDays(1); $end->addDays(1);
  $closure=$this->postJson("/api/v1/admin/labs/$lab->id/closures",['start_at'=>$start->toIso8601String(),'end_at'=>$end->toIso8601String(),'reason'=>'Maintenance'])->assertCreated()->json('data.id');
  $this->deleteJson("/api/v1/admin/labs/$lab->id/closures/$closure")->assertNoContent();
 }
 public function test_recurring_sessions_prevent_overlapping_closures(): void {
  $admin=User::factory()->create(['role'=>'admin','is_active'=>true]); $lecturer=User::factory()->create(['role'=>'lecturer','is_active'=>true]); $lab=Lab::create($this->labData());
  $start=now()->addDays(3)->setTimezone('Asia/Kuala_Lumpur')->setTime(10,0); $end=$start->copy()->addHour();
  DB::table('recurring_schedules')->insert(['lab_id'=>$lab->id,'lecturer_id'=>$lecturer->id,'subject'=>'Weekly class','weekday'=>$start->dayOfWeek,'start_time'=>'10:00','end_time'=>'11:00','effective_from'=>$start->toDateString(),'effective_until'=>$start->copy()->addMonth()->toDateString(),'created_at'=>now(),'updated_at'=>now()]);
  $this->actingAs($admin)->postJson("/api/v1/admin/labs/$lab->id/closures",['start_at'=>$start->toIso8601String(),'end_at'=>$end->toIso8601String(),'reason'=>'Maintenance'])->assertStatus(409);
 }
}
