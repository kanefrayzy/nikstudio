<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

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

        // Сайт работает за nginx на том же хосте: без этого request->ip()
        // возвращает 127.0.0.1, и throttle считает лимит общим для всех посетителей
        $middleware->trustProxies(
            at: ['127.0.0.1', '::1'],
            headers: Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO
        );
        
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
