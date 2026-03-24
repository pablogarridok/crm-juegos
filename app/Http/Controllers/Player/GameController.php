<?php

namespace App\Http\Controllers\Player;

use App\Http\Controllers\Controller;
use App\Models\Game;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class GameController extends Controller
{
    /**
     * Dashboard del jugador: lista de juegos publicados.
     */
    public function index(): Response
    {
        $games = Game::published()->latest()->get();

        return Inertia::render('Player/Dashboard', [
            'games' => $games,
        ]);
    }

    /**
     * Vista que integra el juego dentro del contexto de la plataforma.
     * El juego carga en un iframe o div controlado por Laravel.
     * El usuario sigue dentro de la sesión de Laravel.
     */
    public function play(Game $game): Response
    {
        // Solo juegos publicados son accesibles para jugadores
        if (! $game->isPublished()) {
            abort(404);
        }

        return Inertia::render('Player/Play', [
            'game' => $game->only('id', 'title', 'description', 'game_url', 'thumbnail_url'),
            // Pasamos el token Sanctum al frontend para que el juego pueda autenticarse en la API
            'apiToken' => Auth::user()->createToken('game-session')->plainTextToken,
        ]);
    }

    /**
     * Historial de partidas del jugador.
     */
    public function history(): Response
    {
        $sessions = Auth::user()
            ->gameSessions()
            ->with('game')
            ->latest()
            ->paginate(20);

        return Inertia::render('Player/History', [
            'sessions' => $sessions,
        ]);
    }
}
