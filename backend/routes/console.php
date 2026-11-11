<?php
use App\Models\Booking;
use App\Services\BookingService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('bookings:expire', function (BookingService $service) {
    Booking::where('status', 'pending')->whereNotNull('expires_at')->where('expires_at', '<=', now())
        ->select('lab_id')->distinct()->orderBy('lab_id')->pluck('lab_id')
        ->each(fn ($labId) => $service->expireDueForLab($labId));
    $this->info('Expired pending booking holds processed.');
})->purpose('Expire pending booking holds under their laboratory locks');

Schedule::command('bookings:expire')->everyMinute()->withoutOverlapping();
