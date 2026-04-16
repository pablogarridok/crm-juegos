<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmotionEvent extends Model
{
    protected $fillable = [
        'game_session_id',
        'emotion',
        'confidence',
        'session_second',
    ];

    protected $casts = [
        'confidence' => 'float',
    ];

    // Emociones válidas que acepta face-api.js
    const EMOTIONS = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted'];

    public function session(): BelongsTo
    {
        return $this->belongsTo(GameSession::class, 'game_session_id');
    }
}
