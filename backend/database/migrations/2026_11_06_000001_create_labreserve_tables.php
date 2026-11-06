<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $t) {
            $t->string('role')->default('lecturer');
            $t->string('department')->nullable();
            $t->boolean('is_active')->default(true);
        });
        Schema::create('labs', function (Blueprint $t) {
            $t->id(); $t->string('name'); $t->string('code')->unique(); $t->string('building');
            $t->string('floor')->nullable(); $t->unsignedInteger('capacity'); $t->text('description')->nullable();
            $t->string('booking_mode')->default('automatic'); $t->boolean('is_active')->default(true); $t->timestamps();
        });
        Schema::create('lab_facilities', function (Blueprint $t) { $t->id(); $t->string('name')->unique(); $t->text('description')->nullable(); });
        Schema::create('lab_facility', function (Blueprint $t) { $t->foreignId('lab_id')->constrained()->cascadeOnDelete(); $t->foreignId('facility_id')->constrained('lab_facilities')->cascadeOnDelete(); $t->primary(['lab_id','facility_id']); });
        Schema::create('lab_operating_hours', function (Blueprint $t) { $t->id(); $t->foreignId('lab_id')->constrained()->cascadeOnDelete(); $t->unsignedTinyInteger('weekday'); $t->time('opens_at')->nullable(); $t->time('closes_at')->nullable(); $t->boolean('is_closed')->default(false); $t->unique(['lab_id','weekday']); });
        Schema::create('bookings', function (Blueprint $t) {
            $t->id(); $t->string('booking_reference')->unique(); $t->foreignId('user_id')->constrained(); $t->foreignId('lab_id')->constrained();
            $t->string('subject'); $t->text('purpose'); $t->unsignedInteger('expected_students')->nullable(); $t->text('notes')->nullable();
            $t->dateTime('start_at'); $t->dateTime('end_at'); $t->string('status'); $t->boolean('approval_required');
            $t->text('approval_reason')->nullable(); $t->foreignId('reviewed_by')->nullable()->constrained('users'); $t->dateTime('reviewed_at')->nullable();
            $t->text('rejection_reason')->nullable(); $t->dateTime('cancelled_at')->nullable(); $t->dateTime('expires_at')->nullable(); $t->timestamps();
            $t->index(['lab_id','status','start_at','end_at']);
        });
        Schema::create('booking_rules', function (Blueprint $t) { $t->id(); $t->string('name'); $t->foreignId('lab_id')->nullable()->constrained(); $t->string('rule_type'); $t->json('configuration'); $t->integer('priority')->default(0); $t->boolean('is_active')->default(true); $t->timestamps(); });
        Schema::create('lab_closures', function (Blueprint $t) { $t->id(); $t->foreignId('lab_id')->constrained(); $t->dateTime('start_at'); $t->dateTime('end_at'); $t->text('reason'); $t->timestamps(); $t->index(['lab_id','start_at','end_at']); });
        Schema::create('recurring_schedules', function (Blueprint $t) { $t->id(); $t->foreignId('lab_id')->constrained(); $t->foreignId('lecturer_id')->constrained('users'); $t->string('subject'); $t->unsignedTinyInteger('weekday'); $t->time('start_time'); $t->time('end_time'); $t->date('effective_from'); $t->date('effective_until'); $t->timestamps(); });
        Schema::create('booking_audit_logs', function (Blueprint $t) { $t->id(); $t->foreignId('booking_id')->constrained(); $t->foreignId('actor_id')->nullable()->constrained('users'); $t->string('action'); $t->json('old_values')->nullable(); $t->json('new_values')->nullable(); $t->timestamp('created_at')->useCurrent(); });
        Schema::create('notifications', function (Blueprint $t) { $t->uuid('id')->primary(); $t->string('type'); $t->morphs('notifiable'); $t->text('data'); $t->timestamp('read_at')->nullable(); $t->timestamps(); });
        Schema::create('system_settings', function (Blueprint $t) { $t->id(); $t->string('key')->unique(); $t->text('value')->nullable(); $t->timestamps(); });
    }
    public function down(): void {
        foreach (['system_settings','notifications','booking_audit_logs','recurring_schedules','lab_closures','booking_rules','bookings','lab_operating_hours','lab_facility','lab_facilities','labs'] as $table) Schema::dropIfExists($table);
        Schema::table('users', function (Blueprint $t) { $t->dropColumn(['role','department','is_active']); });
    }
};
