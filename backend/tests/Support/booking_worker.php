<?php
// Invoked by BookingConcurrencyTest as an independent PHP process.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
config(['database.default' => 'mysql', 'database.connections.mysql.database' => 'labreserve_test']);
[$script, $gate, $ready, $userId, $labId, $start, $end] = $argv;
touch($ready);
$deadline = microtime(true) + 15;
while (!file_exists($gate) && microtime(true) < $deadline) usleep(10000);
if (!file_exists($gate)) { fwrite(STDERR, 'Timed out waiting for test barrier'); exit(2); }
try {
    $user = App\Models\User::findOrFail($userId);
    $service = app(App\Services\BookingService::class);
    if (isset($argv[8])) {
        $service->reschedule(App\Models\Booking::findOrFail($argv[8]), $user, ['start_at'=>$start, 'end_at'=>$end]);
    } else {
        $service->create($user, ['lab_id' => $labId, 'subject' => 'Concurrency test', 'purpose' => 'Test', 'start_at' => $start, 'end_at' => $end]);
    }
    echo 'created';
} catch (Symfony\Component\HttpKernel\Exception\HttpException $e) {
    echo 'http:'.$e->getStatusCode();
} catch (Throwable $e) {
    fwrite(STDERR, get_class($e).': '.$e->getMessage());
    exit(1);
}
