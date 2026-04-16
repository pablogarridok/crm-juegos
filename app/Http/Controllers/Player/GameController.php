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


    public function play(Game $game): Response
    {
        if (! $game->isPublished()) {
            abort(404);
        }

        return Inertia::render('Player/Play', [
            'game' => $game->only('id', 'title', 'description', 'game_url', 'thumbnail_url'),
            'apiToken' => Auth::user()->createToken('game-session')->plainTextToken,
        ]);
    }

    /**
     * Historial de partidas del jugador.
     */
    public function history(): Response
    {
        $user = Auth::user();

        $sessions = $user
            ->gameSessions()
            ->with('game')
            ->latest()
            ->paginate(20);

        $plainToken = $user->createToken('history-view')->plainTextToken;

        return Inertia::render('Player/History', [
            'sessions' => $sessions,
            'apiToken' => $plainToken,
        ]);
    }
}
