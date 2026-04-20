<?php

namespace App\Http\Controllers\Player;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\Game;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Gestiona los mensajes de chat por juego.
 *
 * El chat está contextualizado: cada canal pertenece a un juego concreto.
 * Solo usuarios autenticados con acceso al juego pueden participar.
 */
class ChatController extends Controller
{
    /**
     * GET /chat/{game}/messages
     * Devuelve los últimos 50 mensajes del canal de ese juego.
     * Se cargan al conectarse para ver el historial reciente.
     */
    public function index(Game $game): JsonResponse
    {
        $messages = ChatMessage::where('game_id', $game->id)
            ->with('user:id,name')
            ->latest()
            ->limit(50)
            ->get()
            ->reverse()
            ->values();

        return response()->json($messages);
    }

    /**
     * POST /chat/{game}/messages
     * Guarda el mensaje y lo emite por WebSocket a todos los conectados.
     */
    public function store(Request $request, Game $game): JsonResponse
    {
        $request->validate([
            'body' => 'required|string|max:500',
        ]);

        // Solo juegos publicados tienen chat activo
        if (! $game->isPublished()) {
            return response()->json(['message' => 'Juego no disponible.'], 403);
        }

        $message = ChatMessage::create([
            'game_id' => $game->id,
            'user_id' => Auth::id(),
            'body'    => $request->input('body'),
        ]);

        // Laravel dispara el evento → Reverb lo emite a los clientes WebSocket
        broadcast(new MessageSent($message))->toOthers();

        return response()->json([
            'id'         => $message->id,
            'body'       => $message->body,
            'user_name'  => Auth::user()->name,
            'user_id'    => Auth::id(),
            'created_at' => $message->created_at->toISOString(),
        ], 201);
    }
}
