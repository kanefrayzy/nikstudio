<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test successful password change
     */
    public function test_user_can_change_password_with_valid_data(): void
    {
        // Create a user
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword123'),
        ]);

        // Authenticate the user
        $this->actingAs($user, 'sanctum');

        // Make request to change password
        $response = $this->postJson('/api/admin/change-password', [
            'current_password' => 'oldpassword123',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'newpassword123',
        ]);

        // Assert response
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Пароль успешно изменён',
            ]);

        // Verify password was actually changed
        $user->refresh();
        $this->assertTrue(Hash::check('newpassword123', $user->password));
        $this->assertFalse(Hash::check('oldpassword123', $user->password));
    }

    /**
     * Test password change fails with incorrect current password
     */
    public function test_password_change_fails_with_incorrect_current_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('correctpassword'),
        ]);

        $this->actingAs($user, 'sanctum');

        $response = $this->postJson('/api/admin/change-password', [
            'current_password' => 'wrongpassword',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }

    /**
     * Test password change fails when new password is too short
     */
    public function test_password_change_fails_with_short_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword123'),
        ]);

        $this->actingAs($user, 'sanctum');

        $response = $this->postJson('/api/admin/change-password', [
            'current_password' => 'oldpassword123',
            'new_password' => 'short',
            'new_password_confirmation' => 'short',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['new_password']);
    }

    /**
     * Test password change fails when passwords don't match
     */
    public function test_password_change_fails_when_passwords_dont_match(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword123'),
        ]);

        $this->actingAs($user, 'sanctum');

        $response = $this->postJson('/api/admin/change-password', [
            'current_password' => 'oldpassword123',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'differentpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['new_password']);
    }

    /**
     * Test password change requires authentication
     */
    public function test_password_change_requires_authentication(): void
    {
        $response = $this->postJson('/api/admin/change-password', [
            'current_password' => 'oldpassword123',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(401);
    }

    /**
     * Test password change validates required fields
     */
    public function test_password_change_validates_required_fields(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $response = $this->postJson('/api/admin/change-password', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'current_password',
                'new_password',
                'new_password_confirmation',
            ]);
    }
}
