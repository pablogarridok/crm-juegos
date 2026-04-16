<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmotionEvent;
use App\Models\GameSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EmotionController extends Controller
{
    /**
     * POST /api/sessions/{session}/emotions
     *
     * Recibe un evento emocional detectado por face-api.js en el cliente.
     * No recibe imágenes ni vídeo, solo datos ya interpretados.
     */
    public function store(Request $request, GameSession $session): JsonResponse
    {
        // Solo el dueño de la sesión puede registrar emociones
        if ($session->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if ($session->status !== GameSession::STATUS_ACTIVE) {
            return response()->json(['message' => 'La sesión no está activa.'], 422);
        }

        $data = $request->validate([
            'emotion'        => 'required|string|in:neutral,happy,sad,angry,surprised,fearful,disgusted',
            'confidence'     => 'required|numeric|min:0|max:1',
            'session_second' => 'required|integer|min:0',
        ]);

        $event = EmotionEvent::create([
            'game_session_id' => $session->id,
            'emotion'         => $data['emotion'],
            'confidence'      => $data['confidence'],
            'session_second'  => $data['session_second'],
        ]);

        return response()->json(['ok' => true, 'id' => $event->id], 201);
    }

    /**
     * GET /api/sessions/{session}/emotions
     *
     * Devuelve todos los eventos emocionales de una sesión.
     * Útil para mostrar el resumen en el historial.
     */
    public function index(GameSession $session): JsonResponse
    {
        if ($session->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $events = $session->emotionEvents()->orderBy('session_second')->get();

        // Resumen: emoción más frecuente
        $dominant = $events->groupBy('emotion')
            ->map->count()
            ->sortDesc()
            ->keys()
            ->first();

        return response()->json([
            'events'   => $events,
            'dominant' => $dominant,
            'total'    => $events->count(),
        ]);
    }
}
