<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    protected $fillable = ['name', 'display_name', 'description'];

    // Constantes para evitar strings mágicos en el código
    const ADMIN   = 'admin';
    const MANAGER = 'manager';
    const PLAYER  = 'player';

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
