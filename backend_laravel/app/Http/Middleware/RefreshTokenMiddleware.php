<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Laravel\Sanctum\PersonalAccessToken;

class RefreshTokenMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get the current token from the request
        $token = $request->bearerToken();
        
        if (!$token) {
            return $next($request);
        }

        // Find the token in the database
        $accessToken = PersonalAccessToken::findToken($token);
        
        if (!$accessToken || !$accessToken->expires_at) {
            return $next($request);
        }

        // Check if token expires within 30 minutes
        $expiresAt = $accessToken->expires_at;
        $now = now();
        $minutesUntilExpiration = $now->diffInMinutes($expiresAt, false);

        // If token expires in less than 30 minutes, create a new one
        if ($minutesUntilExpiration <= 30 && $minutesUntilExpiration > 0) {
            $user = $accessToken->tokenable;
            
            // Calculate new expiration based on original token lifetime
            $originalLifetime = (int) $accessToken->created_at->diffInMinutes($accessToken->expires_at);
            $newExpiresAt = now()->addMinutes($originalLifetime);
            
            // Create new token with the same lifetime
            $newTokenResult = $user->createToken('admin-token', ['*'], $newExpiresAt);
            $newToken = $newTokenResult->plainTextToken;
            
            // Delete the old token
            $accessToken->delete();
            
            // Process the request
            $response = $next($request);
            
            // Add new token to response header
            $response->headers->set('X-New-Token', $newToken);
            $response->headers->set('X-Token-Expires-At', $newExpiresAt->toIso8601String());
            
            return $response;
        }

        return $next($request);
    }
}
