<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/auth/token
     * Genera un token Sanctum para que el juego pueda autenticarse en la API.
     * Usado por clientes externos (Three.js standalone, apps móviles, etc.).
     */
    public function token(Request $request): JsonResponse
    {
        $request->validate([
            'email'       => 'required|email',
            'password'    => 'required|string',
            'device_name' => 'nullable|string|max:255',
        ]);

        if (! Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales no son correctas.'],
            ]);
        }

        $user  = Auth::user();
        $token = $user->createToken($request->device_name ?? 'api-client');

        return response()->json([
            'token' => $token->plainTextToken,
            'user'  => [
                'id'   => $user->id,
                'name' => $user->name,
                'role' => $user->role->name,
            ],
        ]);
    }


    public function revokeToken(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Token revocado correctamente.']);
    }
}
