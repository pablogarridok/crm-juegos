<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\GameSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GameSessionController extends Controller
{
    /**
     * POST /api/sessions
     * El juego llama a este endpoint al iniciar una partida.
     */
    public function start(Request $request): JsonResponse
    {
        $request->validate([
            'game_id' => 'required|exists:games,id',
        ]);

        $game = Game::findOrFail($request->game_id);

        // Verificar que el juego está publicado
        if (! $game->isPublished()) {
            return response()->json([
                'message' => 'Este juego no está disponible.',
            ], 403);
        }

        $session = GameSession::create([
            'user_id'    => Auth::id(),
            'game_id'    => $game->id,
            'started_at' => now(),
            'status'     => GameSession::STATUS_ACTIVE,
        ]);

        return response()->json([
            'session_id' => $session->id,
            'started_at' => $session->started_at,
            'message'    => 'Sesión iniciada correctamente.',
        ], 201);
    }

    /**
     * POST /api/sessions/{session}/end
     * El juego llama a este endpoint al terminar la partida.
     */
    public function end(Request $request, GameSession $session): JsonResponse
    {
        // Solo el dueño de la sesión puede cerrarla
        if ($session->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if ($session->status !== GameSession::STATUS_ACTIVE) {
            return response()->json(['message' => 'Esta sesión ya ha terminado.'], 422);
        }

        $request->validate([
            'score'       => 'required|integer|min:0',
            'result_data' => 'nullable|array',
        ]);

        $session->end($request->score, $request->result_data ?? []);

        return response()->json([
            'message'          => 'Sesión finalizada.',
            'duration_seconds' => $session->duration_seconds,
            'score'            => $session->score,
        ]);
    }

    /**
     * GET /api/sessions
     * Historial de sesiones del usuario autenticado.
     */
    public function index(): JsonResponse
    {
        $sessions = Auth::user()
            ->gameSessions()
            ->with('game:id,title,thumbnail_url')
            ->latest()
            ->paginate(20);

        return response()->json($sessions);
    }

    /**
     * GET /api/sessions/{session}
     * Detalle de una sesión concreta.
     */
    public function show(GameSession $session): JsonResponse
    {
        if ($session->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        return response()->json($session->load('game'));
    }
}
