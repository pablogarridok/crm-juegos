<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emotion_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_session_id')
                  ->constrained('game_sessions')
                  ->onDelete('cascade');
            // Emociones posibles: neutral, happy, sad, angry, surprised, fearful, disgusted
            $table->string('emotion');
            // Valor de confianza del modelo (0.0 - 1.0)
            $table->float('confidence');
            // Segundos transcurridos desde el inicio de la sesión
            $table->unsignedInteger('session_second');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emotion_events');
    }
};
