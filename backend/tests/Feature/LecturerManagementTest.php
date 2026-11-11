<?php
namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LecturerManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_and_disable_a_lecturer(): void
    {
        $admin = User::factory()->create(['role'=>'admin', 'is_active'=>true]);
        $response = $this->actingAs($admin)->postJson('/api/v1/admin/lecturers', [
            'name'=>'Alex Teacher', 'email'=>'alex@example.test', 'department'=>'Computing', 'password'=>'long-secret-password',
        ])->assertCreated()->assertJsonMissingPath('data.password')->assertJsonPath('data.role', 'lecturer');
        $user = User::findOrFail($response->json('data.id'));
        $this->assertTrue(Hash::check('long-secret-password', $user->password));
        $this->patchJson('/api/v1/admin/lecturers/'.$user->id, ['is_active'=>false])->assertOk()->assertJsonPath('data.is_active', false);
        $this->actingAs($user->fresh())->getJson('/api/v1/labs')->assertForbidden();
    }

    public function test_lecturers_cannot_manage_users_or_change_admin_accounts(): void
    {
        $lecturer = User::factory()->create(['role'=>'lecturer', 'is_active'=>true]);
        $admin = User::factory()->create(['role'=>'admin', 'is_active'=>true]);
        $this->actingAs($lecturer)->getJson('/api/v1/admin/lecturers')->assertForbidden();
        $this->postJson('/api/v1/admin/lecturers', [])->assertForbidden();
        $this->actingAs($admin)->patchJson('/api/v1/admin/lecturers/'.$admin->id, ['is_active'=>false])->assertNotFound();
        $this->assertTrue($admin->fresh()->is_active);
    }

    public function test_user_creation_validates_password_and_unique_email(): void
    {
        $admin = User::factory()->create(['role'=>'admin', 'is_active'=>true]);
        $this->actingAs($admin)->postJson('/api/v1/admin/lecturers', ['name'=>'Test','email'=>$admin->email,'password'=>'short'])->assertUnprocessable()->assertJsonValidationErrors(['email','password']);
    }
}
