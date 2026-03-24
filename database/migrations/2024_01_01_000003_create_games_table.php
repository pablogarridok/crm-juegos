<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            // 'draft' | 'published' | 'archived'
            $table->string('status')->default('draft');
            // URL externa o ruta interna del juego (ej: /games/threejs/mygame o https://...)
            $table->string('game_url');
            $table->string('thumbnail_url')->nullable();
            $table->json('config')->nullable(); // Configuración extra del juego
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
