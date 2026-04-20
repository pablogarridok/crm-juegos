<?php

namespace App\Events;

use App\Models\ChatMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Evento que se emite cuando un usuario envía un mensaje de chat.
 *
 * Laravel Reverb (WebSockets) distribuye este evento a todos los clientes
 * conectados al canal del juego correspondiente.
 *
 * El canal es: game.{game_id}
 * Solo usuarios autenticados con acceso al juego pueden escucharlo.
 */
class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ChatMessage $message)
    {
    }

    /**
     * Canal por juego: game.{game_id}
     * Todos los jugadores viendo ese juego reciben el mensaje.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel("game.{$this->message->game_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    /**
     * Datos que reciben los clientes.
     * Solo lo necesario para renderizar el mensaje en el chat.
     */
    public function broadcastWith(): array
    {
        return [
            'id'         => $this->message->id,
            'body'       => $this->message->body,
            'user_name'  => $this->message->user->name,
            'user_id'    => $this->message->user_id,
            'created_at' => $this->message->created_at->toISOString(),
        ];
    }
}
