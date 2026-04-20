<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Añade face_photo_path a la tabla users.
 *
 * Laravel guarda la ruta de la foto registrada por el usuario.
 * No almacena biometría procesada, solo la imagen de referencia
 * que más adelante se enviará al microservicio Python para comparar.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('face_photo_path')->nullable()->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('face_photo_path');
        });
    }
};
