<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\GameSessionController;
use App\Http\Controllers\Api\EmotionController;
use Illuminate\Support\Facades\Route;

// ─── Autenticación API ────────────────────────────────────────────────────────

Route::post('/auth/token',  [AuthController::class, 'token'])->name('api.auth.token');

// ─── Rutas protegidas con Sanctum ─────────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    Route::delete('/auth/token', [AuthController::class, 'revokeToken'])
        ->name('api.auth.revoke');

    // Juegos disponibles
    Route::get('/games',        [GameController::class, 'index'])->name('api.games.index');
    Route::get('/games/{game}', [GameController::class, 'show'])->name('api.games.show');

    // Sesiones de juego
    Route::post('/sessions',               [GameSessionController::class, 'start'])->name('api.sessions.start');
    Route::post('/sessions/{session}/end', [GameSessionController::class, 'end'])  ->name('api.sessions.end');
    Route::get('/sessions',                [GameSessionController::class, 'index'])->name('api.sessions.index');
    Route::get('/sessions/{session}',      [GameSessionController::class, 'show']) ->name('api.sessions.show');

    // ─── Emociones ────────────────────────────────────────────────────────────
    // El cliente envía datos ya interpretados por face-api.js, nunca imágenes.

    Route::post('/sessions/{session}/emotions', [EmotionController::class, 'store'])
        ->name('api.emotions.store');

    Route::get('/sessions/{session}/emotions',  [EmotionController::class, 'index'])
        ->name('api.emotions.index');
});
