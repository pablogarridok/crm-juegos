<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Models\Game;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Crear roles ────────────────────────────────────────────────────
        $admin = Role::create([
            'name'         => Role::ADMIN,
            'display_name' => 'Administrador',
            'description'  => 'Control total del sistema: usuarios, roles y configuración.',
        ]);

        $manager = Role::create([
            'name'         => Role::MANAGER,
            'display_name' => 'Gestor',
            'description'  => 'Gestiona juegos: crear, editar y publicar.',
        ]);

        $player = Role::create([
            'name'         => Role::PLAYER,
            'display_name' => 'Jugador',
            'description'  => 'Accede a juegos publicados y consulta sus resultados.',
        ]);

        // ── 2. Crear usuarios de prueba ───────────────────────────────────────
        $adminUser = User::create([
            'name'     => 'Admin Principal',
            'email'    => 'admin@gmail.com',
            'password' => Hash::make('password'),
            'role_id'  => $admin->id,
        ]);

        $managerUser = User::create([
            'name'     => 'Gestor ',
            'email'    => 'manager@gmail.com',
            'password' => Hash::make('password'),
            'role_id'  => $manager->id,
        ]);

        $playerUser = User::create([
            'name'     => 'Jugador',
            'email'    => 'player@gmail.com',
            'password' => Hash::make('password'),
            'role_id'  => $player->id,
        ]);

        Game::create([
            'created_by'    => $managerUser->id,
            'title'         => 'Runner3D',
            'description'   => 'Explora el espacio en este juego 3D desarrollado con Three.js.',
            'status'        => Game::STATUS_PUBLISHED,
            'game_url'      => '/games/runner3d/index.html',
            'thumbnail_url' => null,
        ]);

        Game::create([
            'created_by'    => $managerUser->id,
            'title'         => 'Puzzle Cubes',
            'description'   => 'Resuelve puzzles en 3D contra el reloj.',
            'status'        => Game::STATUS_DRAFT,
            'game_url'      => '/games/puzzle-cubes/index.html',
            'thumbnail_url' => null,
        ]);
    }
}
