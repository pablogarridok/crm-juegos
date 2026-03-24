<?php

namespace App\Policies;

use App\Models\Game;
use App\Models\User;

class GamePolicy
{
    /**
     * Solo admin y manager pueden ver la lista de gestión de juegos.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdminOrManager();
    }

    /**
     * Cualquier usuario autenticado puede ver un juego publicado.
     * Admin/manager pueden ver todos.
     */
    public function view(User $user, Game $game): bool
    {
        if ($user->isAdminOrManager()) {
            return true;
        }
        return $game->isPublished();
    }

    /**
     * Admin y manager pueden crear juegos.
     */
    public function create(User $user): bool
    {
        return $user->isAdminOrManager();
    }

    /**
     * Admin puede editar cualquier juego.
     * Manager solo puede editar los suyos.
     */
    public function update(User $user, Game $game): bool
    {
        if ($user->isAdmin()) return true;
        if ($user->isManager()) return $game->created_by === $user->id;
        return false;
    }

    /**
     * Solo admin puede eliminar juegos.
     */
    public function delete(User $user, Game $game): bool
    {
        return $user->isAdmin();
    }

    /**
     * Admin y manager pueden publicar/despublicar.
     */
    public function toggleStatus(User $user, Game $game): bool
    {
        return $this->update($user, $game);
    }
}
