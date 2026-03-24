<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Http\Requests\Game\StoreGameRequest;
use App\Http\Requests\Game\UpdateGameRequest;
use App\Models\Game;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class GameController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Game::class, 'game');
    }

    /**
     * Lista todos los juegos (admin ve todos, manager solo los suyos).
     */
    public function index(): Response
    {
        $user  = Auth::user();
        $games = $user->isAdmin()
            ? Game::with('creator')->latest()->paginate(15)
            : Game::with('creator')->where('created_by', $user->id)->latest()->paginate(15);

        return Inertia::render('Manager/Games/Index', [
            'games' => $games,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Manager/Games/Create');
    }

    public function store(StoreGameRequest $request): RedirectResponse
    {
        Game::create([
            ...$request->validated(),
            'created_by' => Auth::id(),
        ]);

        return redirect()->route('manager.games.index')
            ->with('success', 'Juego creado correctamente.');
    }

    public function show(Game $game): Response
    {
        return Inertia::render('Manager/Games/Show', [
            'game'     => $game->load('creator', 'sessions'),
            'stats'    => [
                'total_sessions'  => $game->sessions()->count(),
                'avg_score'       => $game->sessions()->avg('score'),
                'total_players'   => $game->sessions()->distinct('user_id')->count(),
            ],
        ]);
    }

    public function edit(Game $game): Response
    {
        return Inertia::render('Manager/Games/Edit', [
            'game' => $game,
        ]);
    }

    public function update(UpdateGameRequest $request, Game $game): RedirectResponse
    {
        $game->update($request->validated());

        return redirect()->route('manager.games.index')
            ->with('success', 'Juego actualizado correctamente.');
    }

    public function destroy(Game $game): RedirectResponse
    {
        $game->delete();

        return redirect()->route('manager.games.index')
            ->with('success', 'Juego eliminado.');
    }

    /**
     * Cambia el estado publicado/borrador del juego.
     */
    public function toggleStatus(Game $game): RedirectResponse
    {
        $this->authorize('toggleStatus', $game);

        $game->isPublished() ? $game->unpublish() : $game->publish();

        $msg = $game->isPublished() ? 'Juego publicado.' : 'Juego despublicado.';

        return back()->with('success', $msg);
    }

    /**
     * Vista de previsualización del juego dentro del contexto de la plataforma.
     */
    public function preview(Game $game): Response
    {
        $this->authorize('update', $game);

        return Inertia::render('Manager/Games/Preview', [
            'game' => $game,
        ]);
    }
}
