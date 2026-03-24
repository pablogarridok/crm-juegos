<?php

namespace App\Http\Requests\Game;

use App\Models\Game;
use Illuminate\Foundation\Http\FormRequest;

class UpdateGameRequest extends FormRequest
{
    public function authorize(): bool
    {
        $game = $this->route('game');
        return $this->user()->can('update', $game);
    }

    public function rules(): array
    {
        return [
            'title'         => 'sometimes|required|string|max:255',
            'description'   => 'nullable|string|max:2000',
            'game_url'      => 'sometimes|required|string|max:500',
            'thumbnail_url' => 'nullable|url|max:500',
            'status'        => 'nullable|in:'.implode(',', [
                Game::STATUS_DRAFT,
                Game::STATUS_PUBLISHED,
                Game::STATUS_ARCHIVED,
            ]),
            'config'        => 'nullable|array',
        ];
    }
}
