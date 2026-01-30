<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class LoginWithRememberMeTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test login without remember me creates standard token
     */
    public function test_login_without_remember_me_creates_standard_token(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
            'remember' => false,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'token',
                'user' => ['id', 'name', 'email'],
                'expires_at',
            ]);

        // Verify token expiration is around 8 hours (480 minutes)
        $expiresAt = Carbon::parse($response->json('expires_at'));
        $expectedExpiration = now()->addMinutes(480);
        
        // Allow 1 minute tolerance
        $this->assertTrue(
            $expiresAt->between(
                $expectedExpiration->copy()->subMinute(),
                $expectedExpiration->copy()->addMinute()
            )
        );
    }

    /**
     * Test login with remember me creates long-term token
     */
    public function test_login_with_remember_me_creates_long_term_token(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
            'remember' => true,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'token',
                'user' => ['id', 'name', 'email'],
                'expires_at',
            ]);

        // Verify token expiration is around 30 days (43200 minutes)
        $expiresAt = Carbon::parse($response->json('expires_at'));
        $expectedExpiration = now()->addMinutes(43200);
        
        // Allow 1 minute tolerance
        $this->assertTrue(
            $expiresAt->between(
                $expectedExpiration->copy()->subMinute(),
                $expectedExpiration->copy()->addMinute()
            )
        );
    }

    /**
     * Test login with username instead of email
     */
    public function test_login_with_username_works(): void
    {
        $user = User::factory()->create([
            'name' => 'testuser',
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'testuser', // Using username in email field
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    /**
     * Test login fails with incorrect credentials
     */
    public function test_login_fails_with_incorrect_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test login deletes old tokens
     */
    public function test_login_deletes_old_tokens(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        // Create an old token
        $oldToken = $user->createToken('old-token');
        
        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'old-token',
        ]);

        // Login again
        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);

        // Verify old token was deleted
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'old-token',
        ]);

        // Verify new token exists
        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'admin-token',
        ]);
    }

    /**
     * Test login validates required fields
     */
    public function test_login_validates_required_fields(): void
    {
        $response = $this->postJson('/api/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    /**
     * Test login returns user data
     */
    public function test_login_returns_user_data(): void
    {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'name' => 'Test User',
                    'email' => 'test@example.com',
                ],
            ]);
    }
}
