<?php
namespace Database\Seeders;
use App\Models\{Lab,User};
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
class DatabaseSeeder extends Seeder {
 public function run(): void {
  foreach ([['Computing Lab A','LAB-01','Engineering',40,'automatic'],['Digital Media Lab','LAB-02','Library',30,'approval']] as [$name,$code,$building,$capacity,$mode]) {
   $lab=Lab::firstOrCreate(['code'=>$code],['name'=>$name,'building'=>$building,'capacity'=>$capacity,'booking_mode'=>$mode,'is_active'=>true]);
   for ($day=0;$day<7;$day++) DB::table('lab_operating_hours')->updateOrInsert(['lab_id'=>$lab->id,'weekday'=>$day],['opens_at'=>'08:00:00','closes_at'=>'18:00:00','is_closed'=>$day===0 || $day===6]);
  }
  if (app()->environment('local') && env('SEED_ADMIN_EMAIL') && env('SEED_ADMIN_PASSWORD')) User::firstOrCreate(['email'=>env('SEED_ADMIN_EMAIL')],['name'=>'Local Administrator','password'=>env('SEED_ADMIN_PASSWORD'),'role'=>'admin','is_active'=>true]);
 }
}
