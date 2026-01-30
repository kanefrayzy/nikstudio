<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Carbon\Carbon;

class TokenRefreshMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test middleware refreshes token when it expires within 30 minutes
     */
    public function test_middleware_refreshes_token_expiring_within_30_minutes(): void
    {
        $user = User::factory()->create();

        // Create a token that expires in 25 minutes
        $expiresAt = now()->addMinutes(25);
        $tokenResult = $user->createToken('admin-token', ['*'], $expiresAt);
        $token = $tokenResult->plainTextToken;

        // Make authenticated request
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/me');

        $response->assertStatus(200);

        // Verify new token was returned in header
        $this->assertTrue($response->headers->has('X-New-Token'));
        $this->assertTrue($response->headers->has('X-Token-Expires-At'));

        $newToken = $response->headers->get('X-New-Token');
        $this->assertNotEmpty($newToken);
        $this->assertNotEquals($token, $newToken);

        // Verify old token was deleted
        $this->assertDatabaseMissing('personal_access_tokens', [
            'token' => hash('sha256', explode('|', $token)[1]),
        ]);
    }

    /**
     * Test middleware does not refresh token when it has more than 30 minutes
     */
    public function test_middleware_does_not_refresh_token_with_more_than_30_minutes(): void
    {
        $user = User::factory()->create();

        // Create a token that expires in 60 minutes
        $expiresAt = now()->addMinutes(60);
        $tokenResult = $user->createToken('admin-token', ['*'], $expiresAt);
        $token = $tokenResult->plainTextToken;

        // Make authenticated request
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/me');

        $response->assertStatus(200);

        // Verify no new token was returned
        $this->assertFalse($response->headers->has('X-New-Token'));
        $this->assertFalse($response->headers->has('X-Token-Expires-At'));
    }

    /**
     * Test middleware does not refresh expired token
     */
    public function test_middleware_does_not_refresh_expired_token(): void
    {
        $user = User::factory()->create();

        // Create an expired token
        $expiresAt = now()->subMinutes(5);
        $tokenResult = $user->createToken('admin-token', ['*'], $expiresAt);
        $token = $tokenResult->plainTextToken;

        // Make authenticated request
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/me');

        // Should be unauthorized
        $response->assertStatus(401);
    }

    /**
     * Test middleware handles request without token
     */
    public function test_middleware_handles_request_without_token(): void
    {
        $response = $this->getJson('/api/me');

        $response->assertStatus(401);
        $this->assertFalse($response->headers->has('X-New-Token'));
    }

    /**
     * Test middleware preserves original token lifetime when refreshing
     */
    public function test_middleware_preserves_original_token_lifetime(): void
    {
        $user = User::factory()->create();

        // Create a token with 8 hours lifetime that expires in 20 minutes
        $originalLifetime = 480; // 8 hours in minutes
        $createdAt = now()->subMinutes($originalLifetime - 20);
        $expiresAt = now()->addMinutes(20);
        
        $tokenResult = $user->createToken('admin-token', ['*'], $expiresAt);
        $token = $tokenResult->plainTextToken;

        // Update the created_at to simulate an older token
        $accessToken = PersonalAccessToken::findToken(explode('|', $token)[1]);
        $accessToken->created_at = $createdAt;
        $accessToken->save();

        // Make authenticated request
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/me');

        $response->assertStatus(200);
        $this->assertTrue($response->headers->has('X-New-Token'));

        // Verify new token has similar lifetime (around 8 hours from now)
        $newExpiresAt = Carbon::parse($response->headers->get('X-Token-Expires-At'));
        $expectedExpiration = now()->addMinutes($originalLifetime);
        
        // Allow 2 minutes tolerance
        $this->assertTrue(
            $newExpiresAt->between(
                $expectedExpiration->copy()->subMinutes(2),
                $expectedExpiration->copy()->addMinutes(2)
            )
        );
    }

    /**
     * Test middleware works with remember me tokens (30 days)
     */
    public function test_middleware_works_with_remember_me_tokens(): void
    {
        $user = User::factory()->create();

        // Create a long-term token (30 days) that expires in 25 minutes
        $originalLifetime = 43200; // 30 days in minutes
        $createdAt = now()->subMinutes($originalLifetime - 25);
        $expiresAt = now()->addMinutes(25);
        
        $tokenResult = $user->createToken('admin-token', ['*'], $expiresAt);
        $token = $tokenResult->plainTextToken;

        // Update the created_at to simulate an older token
        $accessToken = PersonalAccessToken::findToken(explode('|', $token)[1]);
        $accessToken->created_at = $createdAt;
        $accessToken->save();

        // Make authenticated request
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/me');

        $response->assertStatus(200);
        $this->assertTrue($response->headers->has('X-New-Token'));

        // Verify new token has similar lifetime (around 30 days from now)
        $newExpiresAt = Carbon::parse($response->headers->get('X-Token-Expires-At'));
        $expectedExpiration = now()->addMinutes($originalLifetime);
        
        // Allow 2 minutes tolerance
        $this->assertTrue(
            $newExpiresAt->between(
                $expectedExpiration->copy()->subMinutes(2),
                $expectedExpiration->copy()->addMinutes(2)
            )
        );
    }

    /**
     * Test middleware handles token without expiration
     */
    public function test_middleware_handles_token_without_expiration(): void
    {
        $user = User::factory()->create();

        // Create a token without expiration
        $tokenResult = $user->createToken('admin-token');
        $token = $tokenResult->plainTextToken;

        // Make authenticated request
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/me');

        $response->assertStatus(200);

        // Verify no new token was returned (no expiration to check)
        $this->assertFalse($response->headers->has('X-New-Token'));
    }
}
