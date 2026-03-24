<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\GameSessionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — api.php
|--------------------------------------------------------------------------
| Todas estas rutas devuelven JSON estructurado, nunca vistas.
| Los juegos Three.js y otros clientes consumen esta API.
| Autenticación via Laravel Sanctum (tokens Bearer).
|--------------------------------------------------------------------------
*/

// ─── Autenticación API ────────────────────────────────────────────────────────
// Pública: para que los clientes obtengan su token.

Route::post('/auth/token',  [AuthController::class, 'token'])->name('api.auth.token');

// ─── Rutas protegidas con Sanctum ─────────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    // Revocar token (logout de la API)
    Route::delete('/auth/token', [AuthController::class, 'revokeToken'])
        ->name('api.auth.revoke');

    // Juegos disponibles (solo publicados)
    Route::get('/games',      [GameController::class, 'index'])->name('api.games.index');
    Route::get('/games/{game}', [GameController::class, 'show'])->name('api.games.show');

    // Sesiones de juego
    Route::post('/sessions',              [GameSessionController::class, 'start']) ->name('api.sessions.start');
    Route::post('/sessions/{session}/end',[GameSessionController::class, 'end'])   ->name('api.sessions.end');
    Route::get('/sessions',               [GameSessionController::class, 'index']) ->name('api.sessions.index');
    Route::get('/sessions/{session}',     [GameSessionController::class, 'show'])  ->name('api.sessions.show');
});
