<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    // ─── Relaciones ───────────────────────────────────────────────────────────

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function games(): HasMany
    {
        return $this->hasMany(Game::class, 'created_by');
    }

    public function gameSessions(): HasMany
    {
        return $this->hasMany(GameSession::class);
    }

    // ─── Helpers de rol ───────────────────────────────────────────────────────

    public function hasRole(string $role): bool
    {
        return $this->role->name === $role;
    }

    public function isAdmin(): bool
    {
        return $this->hasRole(Role::ADMIN);
    }

    public function isManager(): bool
    {
        return $this->hasRole(Role::MANAGER);
    }

    public function isPlayer(): bool
    {
        return $this->hasRole(Role::PLAYER);
    }

    public function isAdminOrManager(): bool
    {
        return $this->isAdmin() || $this->isManager();
    }
}
