<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameSession extends Model
{
    protected $fillable = [
        'user_id',
        'game_id',
        'started_at',
        'ended_at',
        'duration_seconds',
        'score',
        'result_data',
        'status',
    ];

    protected $casts = [
        'started_at'  => 'datetime',
        'ended_at'    => 'datetime',
        'result_data' => 'array',
    ];

    const STATUS_ACTIVE    = 'active';
    const STATUS_COMPLETED = 'completed';
    const STATUS_ABANDONED = 'abandoned';

    // ─── Relaciones ───────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function emotionEvents(): HasMany
    {
        return $this->hasMany(EmotionEvent::class);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function end(int $score, array $resultData = []): void
    {
        $endTime = now();
        $this->update([
            'ended_at'         => $endTime,
            'duration_seconds' => $endTime->diffInSeconds($this->started_at),
            'score'            => $score,
            'result_data'      => $resultData,
            'status'           => self::STATUS_COMPLETED,
        ]);
    }
}
