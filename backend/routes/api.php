<?php
use App\Http\Controllers\ApiController;
use Illuminate\Support\Facades\Route;
Route::prefix('v1')->group(function () {
 Route::post('/auth/login',[ApiController::class,'login'])->middleware('throttle:6,1');
 Route::get('/public/labs',[ApiController::class,'publicLabs']);
 Route::get('/public/labs/{code}/status',[ApiController::class,'publicStatus']);
 Route::middleware('auth:sanctum')->group(function () {
  Route::get('/auth/me',[ApiController::class,'me']); Route::post('/auth/logout',[ApiController::class,'logout']);
  Route::get('/labs',[ApiController::class,'labs']); Route::get('/bookings',[ApiController::class,'bookings']); Route::post('/bookings',[ApiController::class,'createBooking']);
  Route::post('/bookings/{booking}/cancel',[ApiController::class,'cancel']);
  Route::get('/admin/approvals',[ApiController::class,'approvals']); Route::post('/admin/approvals/{booking}/approve',[ApiController::class,'approve']); Route::post('/admin/approvals/{booking}/reject',[ApiController::class,'reject']);
  Route::post('/admin/labs',[ApiController::class,'saveLab']); Route::patch('/admin/labs/{lab}',[ApiController::class,'saveLab']);
 });
});
