<?php
namespace Tests\Feature;

use App\Models\Lab;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class BookingConcurrencyTest extends TestCase
{
    public function test_two_overlapping_requests_cannot_both_create_a_booking(): void
    {
        if (DB::getDriverName() !== 'mysql') $this->markTestSkipped('Requires MySQL row locking.');
        $this->assertSame('labreserve_test', DB::connection()->getDatabaseName(), 'Concurrency fixtures must use the isolated test database.');
        Artisan::call('migrate', ['--force' => true]);
        $tag = Str::random(12);
        $user = User::factory()->create(['email' => "$tag@example.test", 'role' => 'lecturer', 'is_active' => true]);
        $lab = Lab::create(['name'=>'Concurrency test', 'code'=>$tag, 'building'=>'Test', 'capacity'=>30, 'booking_mode'=>'automatic', 'is_active'=>true]);
        foreach (range(0, 6) as $day) DB::table('lab_operating_hours')->insert(['lab_id'=>$lab->id, 'weekday'=>$day, 'opens_at'=>'00:00:00', 'closes_at'=>'23:59:59', 'is_closed'=>false]);
        $start = now()->addDays(2)->setTimezone('Asia/Kuala_Lumpur')->setTime(10, 0)->toIso8601String();
        $end = now()->addDays(2)->setTimezone('Asia/Kuala_Lumpur')->setTime(11, 0)->toIso8601String();
        $gate = sys_get_temp_dir().DIRECTORY_SEPARATOR.'labreserve-'.Str::random(24);
        $worker = base_path('tests/Support/booking_worker.php');
        $args = [(string) $user->id, (string) $lab->id, $start, $end];
        $readyA = $gate.'-a'; $readyB = $gate.'-b';
        $a = new Process([PHP_BINARY, $worker, $gate, $readyA, ...$args], base_path());
        $b = new Process([PHP_BINARY, $worker, $gate, $readyB, ...$args], base_path());
        try {
            $a->start(); $b->start();
            $deadline = microtime(true) + 15;
            while ((!file_exists($readyA) || !file_exists($readyB)) && microtime(true) < $deadline) usleep(10000);
            $this->assertFileExists($readyA, 'First worker did not reach the barrier.');
            $this->assertFileExists($readyB, 'Second worker did not reach the barrier.');
            touch($gate);
            $a->wait(); $b->wait();
            $this->assertTrue($a->isSuccessful(), $a->getErrorOutput());
            $this->assertTrue($b->isSuccessful(), $b->getErrorOutput());
            $results = [trim($a->getOutput()), trim($b->getOutput())]; sort($results);
            $this->assertSame(['created', 'http:409'], $results);
            $this->assertSame(1, DB::table('bookings')->where('lab_id', $lab->id)->whereIn('status',['pending','confirmed'])->count());
        } finally {
            foreach ([$gate, $readyA, $readyB] as $path) if (file_exists($path)) unlink($path);
            if ($a->isRunning()) $a->stop(); if ($b->isRunning()) $b->stop();
            $ids = DB::table('bookings')->where('lab_id', $lab->id)->pluck('id');
            DB::table('booking_audit_logs')->whereIn('booking_id', $ids)->delete();
            DB::table('bookings')->where('lab_id', $lab->id)->delete();
            DB::table('lab_operating_hours')->where('lab_id', $lab->id)->delete();
            $lab->delete(); $user->delete();
        }
    }
    public function test_reschedule_and_new_booking_cannot_claim_the_same_slot(): void
    {
        if (DB::getDriverName() !== 'mysql') $this->markTestSkipped('Requires MySQL row locking.');
        $this->assertSame('labreserve_test', DB::connection()->getDatabaseName());
        Artisan::call('migrate', ['--force' => true]);
        $tag=Str::random(12);
        $user=User::factory()->create(['email'=>"$tag@example.test",'role'=>'lecturer','is_active'=>true]);
        $lab=Lab::create(['name'=>'Concurrency test','code'=>$tag,'building'=>'Test','capacity'=>30,'booking_mode'=>'automatic','is_active'=>true]);
        foreach (range(0,6) as $day) DB::table('lab_operating_hours')->insert(['lab_id'=>$lab->id,'weekday'=>$day,'opens_at'=>'00:00:00','closes_at'=>'23:59:59','is_closed'=>false]);
        $date=now()->addDays(2)->setTimezone('Asia/Kuala_Lumpur');
        $target=$date->copy()->setTime(10,0);$end=$date->copy()->setTime(11,0);
        $existing=app(\App\Services\BookingService::class)->create($user,['lab_id'=>$lab->id,'subject'=>'Existing','purpose'=>'Test','start_at'=>$date->copy()->setTime(8,0)->toIso8601String(),'end_at'=>$date->copy()->setTime(9,0)->toIso8601String()]);
        $gate=sys_get_temp_dir().DIRECTORY_SEPARATOR.'labreserve-'.Str::random(24);$readyA=$gate.'-a';$readyB=$gate.'-b';
        $args=[(string)$user->id,(string)$lab->id,$target->toIso8601String(),$end->toIso8601String()];$worker=base_path('tests/Support/booking_worker.php');
        $a=new Process([PHP_BINARY,$worker,$gate,$readyA,...$args,(string)$existing->id],base_path());$b=new Process([PHP_BINARY,$worker,$gate,$readyB,...$args],base_path());
        try {
            $a->start();$b->start();$deadline=microtime(true)+15;
            while ((!file_exists($readyA) || !file_exists($readyB)) && microtime(true)<$deadline) usleep(10000);
            $this->assertFileExists($readyA);$this->assertFileExists($readyB);touch($gate);$a->wait();$b->wait();
            $this->assertTrue($a->isSuccessful(),$a->getErrorOutput());$this->assertTrue($b->isSuccessful(),$b->getErrorOutput());
            $results=[trim($a->getOutput()),trim($b->getOutput())];sort($results);$this->assertSame(['created','http:409'],$results);
            $this->assertSame(1,DB::table('bookings')->where('lab_id',$lab->id)->whereIn('status',['pending','confirmed'])->where('start_at','<',$end->copy()->utc())->where('end_at','>',$target->copy()->utc())->count());
        } finally {
            foreach ([$gate,$readyA,$readyB] as $path) if(file_exists($path)) unlink($path);
            if($a->isRunning()) $a->stop();if($b->isRunning()) $b->stop();
            $ids=DB::table('bookings')->where('lab_id',$lab->id)->pluck('id');DB::table('booking_audit_logs')->whereIn('booking_id',$ids)->delete();DB::table('bookings')->where('lab_id',$lab->id)->delete();DB::table('lab_operating_hours')->where('lab_id',$lab->id)->delete();$lab->delete();$user->delete();
        }
    }
}
