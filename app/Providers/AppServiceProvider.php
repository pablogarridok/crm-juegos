<?php

namespace App\Providers;

use App\Models\Game;
use App\Policies\GamePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Registrar la policy de juegos
        Gate::policy(Game::class, GamePolicy::class);
    }
}
