<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login and get API token
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
            'password' => 'required',
            'remember' => 'boolean',
        ]);

        // Try to find user by email or name
        $user = User::where('email', $request->email)
            ->orWhere('name', $request->email)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Неверные учетные данные'],
            ]);
        }

        // Delete old tokens
        $user->tokens()->delete();

        // Determine token expiration based on remember me option
        $remember = $request->boolean('remember', false);
        $expirationMinutes = $remember 
            ? (int) config('sanctum.remember_expiration', 43200) // 30 days
            : (int) config('sanctum.expiration', 480); // 8 hours

        // Calculate expiration timestamp
        $expiresAt = now()->addMinutes($expirationMinutes);

        // Create new token with expiration
        $tokenResult = $user->createToken('admin-token', ['*'], $expiresAt);
        $token = $tokenResult->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'expires_at' => $expiresAt->toIso8601String(),
        ]);
    }

    /**
     * Logout and revoke token
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Вы успешно вышли из системы'
        ]);
    }

    /**
     * Get current user
     */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'user' => $request->user()
        ]);
    }

    /**
     * Change user password
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:12|confirmed',
            'new_password_confirmation' => 'required|string',
        ], [
            'current_password.required' => 'Текущий пароль обязателен',
            'new_password.required' => 'Новый пароль обязателен',
            'new_password.min' => 'Пароль должен содержать минимум 12 символов',
            'new_password.confirmed' => 'Пароли не совпадают',
            'new_password_confirmation.required' => 'Подтверждение пароля обязательно',
        ]);

        $user = $request->user();

        // Check if current password is correct
        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Текущий пароль неверен'],
            ]);
        }

        // Update password with hashing
        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Пароль успешно изменён',
        ]);
    }
}
