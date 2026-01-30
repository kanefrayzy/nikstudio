<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Add CORS middleware to API routes
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
        
        // Register custom middleware aliases
        $middleware->alias([
            'refresh.token' => \App\Http\Middleware\RefreshTokenMiddleware::class,
        ]);
        
        // Exclude API endpoints from CSRF verification (using Bearer token auth)
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
        
        // Configure authentication redirects for API
        $middleware->redirectGuestsTo(function ($request) {
            // For API requests, return 401 instead of redirecting
            if ($request->expectsJson() || $request->is('api/*')) {
                return null;
            }
            return route('login');
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
