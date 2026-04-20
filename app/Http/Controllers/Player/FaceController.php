<?php

namespace App\Http\Controllers\Player;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Gestiona el reconocimiento facial del usuario.
 *
 * RESPONSABILIDADES DE LARAVEL:
 * - Guardar la foto de referencia (enrolamiento)
 * - Recibir la foto actual (verificación)
 * - Enviar ambas fotos al microservicio Python
 * - Interpretar el resultado y tomar la decisión
 *
 * RESPONSABILIDADES DEL MICROSERVICIO PYTHON:
 * - Comparar las dos imágenes
 * - Devolver si coinciden (match: true/false) y la distancia
 *
 * Laravel nunca analiza imágenes directamente.
 */
class FaceController extends Controller
{
    /** URL del microservicio Python. Configurable en .env */
    private string $pythonServiceUrl;

    public function __construct()
    {
        $this->pythonServiceUrl = env('FACE_SERVICE_URL', 'http://localhost:8001');
    }

    // ─── Vista principal ──────────────────────────────────────────────────────

    /**
     * Página de configuración de seguridad facial.
     * Muestra si el usuario ya tiene foto registrada.
     */
    public function index(): Response
    {
        $user = Auth::user();

        return Inertia::render('Player/Face', [
            'hasPhoto'    => ! is_null($user->face_photo_path),
            'serviceUrl'  => $this->pythonServiceUrl, // solo para mostrar en UI de debug
        ]);
    }

    // ─── Enrolamiento ─────────────────────────────────────────────────────────

    /**
     * POST /face/enroll
     * Recibe una imagen del usuario y la guarda como referencia facial.
     *
     * Laravel no analiza la imagen. Solo la guarda de forma controlada.
     */
    public function enroll(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|string', // base64 de la imagen
        ]);

        $user = Auth::user();

        // Eliminar foto anterior si existe
        if ($user->face_photo_path) {
            Storage::disk('local')->delete($user->face_photo_path);
        }

        // Decodificar base64 y guardar
        $imageData = $request->input('image');
        if (str_contains($imageData, ',')) {
            $imageData = explode(',', $imageData, 2)[1];
        }

        $decoded = base64_decode($imageData);
        if ($decoded === false) {
            return response()->json(['message' => 'Imagen inválida.'], 422);
        }

        $path = 'face-photos/' . $user->id . '_' . time() . '.jpg';
        Storage::disk('local')->put($path, $decoded);

        $user->update(['face_photo_path' => $path]);

        return response()->json([
            'ok'      => true,
            'message' => 'Foto registrada correctamente.',
        ]);
    }

    // ─── Verificación ─────────────────────────────────────────────────────────

    /**
     * POST /face/verify
     * Recibe la imagen actual de la webcam, la compara con la registrada
     * enviando ambas al microservicio Python.
     *
     * Laravel recibe el resultado técnico y toma la decisión final.
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|string', // base64 de la imagen actual
        ]);

        $user = Auth::user();

        // El usuario debe tener foto registrada
        if (! $user->face_photo_path) {
            return response()->json([
                'match'   => false,
                'message' => 'No tienes foto registrada. Ve a Seguridad facial para registrarla.',
            ], 422);
        }

        // Recuperar la imagen de referencia y convertirla a base64
        $referenceBytes = Storage::disk('local')->get($user->face_photo_path);
        if (! $referenceBytes) {
            return response()->json(['message' => 'No se encontró la foto de referencia.'], 500);
        }
        $referenceBase64 = base64_encode($referenceBytes);

        // Imagen actual que acaba de enviar el navegador
        $currentImage = $request->input('image');

        // ── Llamada al microservicio Python ───────────────────────────────────
        // Laravel envía ambas imágenes. El microservicio solo compara y responde.
        try {
            $response = Http::timeout(15)->post("{$this->pythonServiceUrl}/compare", [
                'image_reference' => $referenceBase64,
                'image_current'   => $currentImage,
            ]);

            if (! $response->successful()) {
                return response()->json([
                    'match'   => false,
                    'message' => 'El servicio de reconocimiento no está disponible.',
                ], 503);
            }

            $result = $response->json();

        } catch (\Exception $e) {
            return response()->json([
                'match'   => false,
                'message' => 'No se pudo conectar con el servicio de reconocimiento facial.',
            ], 503);
        }

        // ── Laravel toma la decisión ──────────────────────────────────────────
        // El microservicio devuelve datos técnicos. Laravel decide qué hacer.
        $match    = $result['match']    ?? false;
        $distance = $result['distance'] ?? null;

        return response()->json([
            'match'    => $match,
            'distance' => $distance,
            'message'  => $match
                ? 'Identidad verificada correctamente.'
                : 'No se pudo verificar la identidad. Inténtalo de nuevo con mejor iluminación.',
        ]);
    }

    /**
     * DELETE /face/photo
     * Elimina la foto registrada del usuario.
     */
    public function deletePhoto(): JsonResponse
    {
        $user = Auth::user();

        if ($user->face_photo_path) {
            Storage::disk('local')->delete($user->face_photo_path);
            $user->update(['face_photo_path' => null]);
        }

        return response()->json(['ok' => true, 'message' => 'Foto eliminada.']);
    }
}
