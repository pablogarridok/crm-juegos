<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Player\FaceController;
use App\Http\Controllers\Player\ChatController;
use App\Http\Controllers\Manager\GameController as ManagerGameController;
use App\Http\Controllers\Player\GameController as PlayerGameController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ─── Públicas ─────────────────────────────────────────────────────────────────

Route::get('/', function () {
    return redirect()->route('login');
});

// ─── Autenticación ────────────────────────────────────────────────────────────

Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');
    Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});

// ─── Jugador ──────────────────────────────────────────────────────────────────
// Solo usuarios con rol 'player' acceden a estas rutas.

// ─── Jugador ──────────────────────────────────────────────────────────────────
Route::middleware(['auth', 'role:player,manager,admin'])
    ->prefix('play')
    ->name('player.')
    ->group(function () {
        Route::get('/',        [PlayerGameController::class, 'index'])  ->name('dashboard');
        Route::get('/history', [PlayerGameController::class, 'history'])->name('history');
        Route::get('/{game}',  [PlayerGameController::class, 'play'])   ->name('play');
    });

// ─── Reconocimiento facial ────────────────────────────────────────────────────
Route::middleware(['auth', 'role:player,manager,admin'])->group(function () {
    Route::get('/face',          [FaceController::class, 'index'])      ->name('face.index');
    Route::post('/face/enroll',  [FaceController::class, 'enroll'])     ->name('face.enroll');
    Route::post('/face/verify',  [FaceController::class, 'verify'])     ->name('face.verify');
    Route::delete('/face/photo', [FaceController::class, 'deletePhoto'])->name('face.delete');
    Route::get('/chat/{game}/messages',  [ChatController::class, 'index']);
    Route::post('/chat/{game}/messages', [ChatController::class, 'store']);
});

// ─── Manager (gestión de juegos) ──────────────────────────────────────────────
// Solo admin y manager.

Route::middleware(['auth', 'role:admin,manager'])
    ->prefix('manage')
    ->name('manager.')
    ->group(function () {
        // CRUD de juegos
        Route::resource('games', ManagerGameController::class);

        // Acciones extra sobre juegos
        Route::post('games/{game}/toggle-status', [ManagerGameController::class, 'toggleStatus'])
            ->name('games.toggleStatus');
        Route::get('games/{game}/preview', [ManagerGameController::class, 'preview'])
            ->name('games.preview');
    });

// ─── Admin (gestión de usuarios) ──────────────────────────────────────────────
// Solo admin.

Route::middleware(['auth', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('users', [UserController::class, 'index'])
            ->name('users.index');
        Route::post('users', [UserController::class, 'store'])
            ->name('users.store');
        Route::patch('users/{user}/role', [UserController::class, 'updateRole'])
            ->name('users.updateRole');
        Route::patch('users/{user}/toggle-active', [UserController::class, 'toggleActive'])
            ->name('users.toggleActive');
        Route::delete('users/{user}', [UserController::class, 'destroy'])
            ->name('users.destroy');
    });
