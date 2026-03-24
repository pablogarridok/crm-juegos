<?php

namespace App\Http\Requests\Game;

use App\Models\Game;
use Illuminate\Foundation\Http\FormRequest;

class StoreGameRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdminOrManager();
    }

    public function rules(): array
    {
        return [
            'title'         => 'required|string|max:255',
            'description'   => 'nullable|string|max:2000',
            'game_url'      => 'required|string|max:500',
            'thumbnail_url' => 'nullable|url|max:500',
            'status'        => 'nullable|in:'.implode(',', [
                Game::STATUS_DRAFT,
                Game::STATUS_PUBLISHED,
                Game::STATUS_ARCHIVED,
            ]),
            'config'        => 'nullable|array',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'    => 'El título del juego es obligatorio.',
            'game_url.required' => 'La URL o ruta del juego es obligatoria.',
        ];
    }
}
