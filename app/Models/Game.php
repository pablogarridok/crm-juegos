<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Game extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by',
        'title',
        'description',
        'status',
        'game_url',
        'thumbnail_url',
        'config',
    ];

    protected $casts = [
        'config' => 'array',
    ];

    // Estados posibles
    const STATUS_DRAFT     = 'draft';
    const STATUS_PUBLISHED = 'published';
    const STATUS_ARCHIVED  = 'archived';

    // ─── Relaciones ───────────────────────────────────────────────────────────

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(GameSession::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }

    public function publish(): void
    {
        $this->update(['status' => self::STATUS_PUBLISHED]);
    }

    public function unpublish(): void
    {
        $this->update(['status' => self::STATUS_DRAFT]);
    }
}
