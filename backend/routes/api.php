<?php
use App\Http\Controllers\ApiController;
use App\Http\Controllers\LecturerController;
use App\Http\Controllers\LabManagementController;
use App\Http\Controllers\AvailabilityController;
use Illuminate\Support\Facades\Route;
Route::prefix('v1')->group(function () {
 Route::post('/auth/login',[ApiController::class,'login'])->middleware('throttle:6,1');
 Route::get('/public/labs',[ApiController::class,'publicLabs']);
 Route::get('/public/availability',[AvailabilityController::class,'search'])->middleware('throttle:60,1'); Route::get('/public/calendar',[AvailabilityController::class,'calendar'])->middleware('throttle:60,1');
 Route::get('/public/labs/{code}/status',[ApiController::class,'publicStatus']);
 Route::middleware('auth:sanctum')->group(function () {
  Route::get('/auth/me',[ApiController::class,'me']); Route::post('/auth/logout',[ApiController::class,'logout']);
  Route::get('/labs',[ApiController::class,'labs']); Route::get('/bookings',[ApiController::class,'bookings']); Route::post('/bookings',[ApiController::class,'createBooking']);
  Route::patch('/bookings/{booking}',[ApiController::class,'reschedule']);
  Route::post('/bookings/{booking}/cancel',[ApiController::class,'cancel']);
  Route::get('/admin/approvals',[ApiController::class,'approvals']); Route::post('/admin/approvals/{booking}/approve',[ApiController::class,'approve']); Route::post('/admin/approvals/{booking}/reject',[ApiController::class,'reject']);
  Route::get('/admin/lecturers',[LecturerController::class,'index']); Route::post('/admin/lecturers',[LecturerController::class,'store']); Route::patch('/admin/lecturers/{user}',[LecturerController::class,'update']);
  Route::get('/admin/labs',[LabManagementController::class,'index']); Route::post('/admin/labs',[LabManagementController::class,'store']); Route::patch('/admin/labs/{lab}',[LabManagementController::class,'update']);
  Route::get('/admin/labs/{lab}/hours',[LabManagementController::class,'hours']); Route::put('/admin/labs/{lab}/hours',[LabManagementController::class,'saveHours']);
  Route::get('/admin/labs/{lab}/closures',[LabManagementController::class,'closures']); Route::post('/admin/labs/{lab}/closures',[LabManagementController::class,'addClosure']); Route::delete('/admin/labs/{lab}/closures/{closure}',[LabManagementController::class,'deleteClosure']);
 });
});
