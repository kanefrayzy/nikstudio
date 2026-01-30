<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\VideoStreamController;

// Video streaming with Range support - ДОЛЖЕН БЫТЬ ПЕРВЫМ
Route::get('/storage/{path}', [VideoStreamController::class, 'stream'])
    ->where('path', '.*')
    ->name('video.stream');

Route::get('/', function () {
    return view('welcome');
});

// Dummy login route for API authentication redirects
Route::match(['get', 'options'], '/login', function (Illuminate\Http\Request $request) {
    // For OPTIONS preflight, return 200
    if ($request->isMethod('options')) {
        return response('', 200)
            ->header('Access-Control-Allow-Origin', 'http://localhost:3000')
            ->header('Access-Control-Allow-Credentials', 'true')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }
    
    return response()->json([
        'message' => 'Unauthenticated. Please login via the frontend application.'
    ], 401)
    ->header('Access-Control-Allow-Origin', 'http://localhost:3000')
    ->header('Access-Control-Allow-Credentials', 'true');
})->name('login');
