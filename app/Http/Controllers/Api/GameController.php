<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use Illuminate\Http\JsonResponse;

class GameController extends Controller
{
    /**
     * GET /api/games
     * Lista pública de juegos publicados (para clientes Three.js u otros).
     */
    public function index(): JsonResponse
    {
        $games = Game::published()
            ->select('id', 'title', 'description', 'thumbnail_url', 'game_url')
            ->latest()
            ->get();

        return response()->json(['data' => $games]);
    }

    /**
     * GET /api/games/{game}
     * Detalle de un juego publicado.
     */
    public function show(Game $game): JsonResponse
    {
        if (! $game->isPublished()) {
            return response()->json(['message' => 'Juego no disponible.'], 404);
        }

        return response()->json(['data' => $game]);
    }
}
