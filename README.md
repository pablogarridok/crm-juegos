# 🎮 GameCRM — Plataforma de Juegos con Laravel + Inertia + React

## Descripción general

GameCRM es una plataforma de juegos construida con Laravel como núcleo del sistema. Funciona como un CRM que gestiona usuarios, roles, juegos y sesiones de partida, mientras expone una API reutilizable para que los juegos desarrollados en Three.js puedan comunicarse con el servidor.

El proyecto incorpora tres módulos avanzados: **reconocimiento facial** mediante un microservicio Python en Docker, **detección de emociones en tiempo real** en el navegador, y **chat en tiempo real** con WebSockets a través de Laravel Reverb.

---

## Tecnologías utilizadas

| Tecnología | Función en el sistema |
|---|---|
| **Laravel 11** | Backend principal. Gestiona rutas, autenticación, autorización, modelos Eloquent, migraciones y la lógica del CRM. |
| **PostgreSQL** | Base de datos relacional. Almacena usuarios, roles, juegos, sesiones, eventos emocionales y mensajes de chat. |
| **Eloquent ORM** | Abstrae las consultas a la base de datos. Define las relaciones entre modelos. |
| **Inertia.js** | Puente entre Laravel y React. Permite usar React como capa de vistas sin convertir el proyecto en una SPA independiente. |
| **React** | Librería para la interfaz del CRM. Gestiona el panel de admin/gestor y las vistas del jugador. |
| **Tailwind CSS** | Framework de utilidades CSS para estilar el frontend. |
| **Laravel Sanctum** | Gestión de tokens para la autenticación de la API. |
| **Laravel Reverb** | Servidor WebSocket oficial de Laravel. Gestiona el chat en tiempo real. |
| **Laravel Echo + Pusher.js** | Cliente JavaScript que escucha eventos de Reverb en el navegador. |
| **Python + FastAPI** | Microservicio de reconocimiento facial que corre en Docker. |
| **DeepFace** | Librería Python para comparación de rostros. |
| **face-api.js** | Librería JavaScript para detección de emociones directamente en el navegador. |
| **Docker** | Contenerización del microservicio de reconocimiento facial. |
| **Three.js** | Motor de juegos en el cliente (proyecto externo). Se comunica con Laravel exclusivamente a través de la API. |

---

## Arquitectura del proyecto

```
gamecrm/
├── app/
│   ├── Events/
│   │   └── MessageSent.php         # Evento broadcast del chat
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/               # Registro, login, logout
│   │   │   ├── Admin/              # Gestión de usuarios y roles
│   │   │   ├── Manager/            # CRUD de juegos
│   │   │   ├── Player/
│   │   │   │   ├── FaceController.php   # Reconocimiento facial
│   │   │   │   └── ChatController.php   # Chat en tiempo real
│   │   │   └── Api/                # Endpoints de la API para los juegos
│   │   └── Middleware/
│   │       └── RoleMiddleware       # Protege rutas según rol
│   └── Models/
│       ├── User.php
│       ├── Role.php
│       ├── Game.php
│       ├── GameSession.php
│       └── ChatMessage.php         # Modelo de mensajes de chat
├── database/migrations/
│   ├── ..._add_face_photo_to_users_table.php
│   ├── ..._create_chat_messages_table.php
│   └── ...                         # Migraciones base
├── face-recognition/               # Microservicio Python
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── main.py                     # FastAPI + DeepFace
│   └── requirements.txt
├── routes/
│   ├── web.php                     # Rutas del CRM (vistas Inertia)
│   └── api.php                     # Rutas de la API REST
└── resources/js/
    ├── Pages/
    │   └── Player/
    │       ├── Play.jsx            # Juego + detección emocional + chat
    │       └── Face.jsx            # Enrolamiento y verificación facial
    └── Components/
        └── Layout/
            └── AppLayout.jsx
```

---

## Base de datos

### Entidades principales

- **roles** — Define los tipos de usuario: `admin`, `manager`, `player`
- **users** — Usuarios del sistema. Incluye `face_photo_path` (nullable) para el reconocimiento facial
- **games** — Juegos gestionados por el CRM
- **game_sessions** — Registra cada partida
- **chat_messages** — Mensajes del chat asociados a un juego

### Relaciones Eloquent

```
Role        1──N  User
User        1──N  Game (creador)
User        1──N  GameSession
User        1──N  ChatMessage
Game        1──N  GameSession
Game        1──N  ChatMessage
```

---

## Autenticación y roles

Se implementa con el sistema nativo de Laravel (`Auth`) y **Laravel Sanctum** para la API.

| Rol | Capacidades |
|---|---|
| `admin` | Gestionar usuarios, asignar roles, configuración global |
| `manager` | Crear/editar/publicar juegos, ver estadísticas |
| `player` | Ver juegos publicados, jugar, usar el chat, gestionar seguridad facial |

---

## Módulo 1 — Reconocimiento facial (Python + Docker)

### Concepto

Laravel no hace reconocimiento facial. Laravel coordina, valida y decide. El reconocimiento lo hace un microservicio independiente en Python.

El reconocimiento facial se usa como **verificación adicional de identidad**, no como sustituto del login. El usuario sigue autenticándose con su cuenta y contraseña habituales.

### Flujo

```
Usuario logueado → /face → "Registrar cara"
    → cámara activa → captura foto → POST /face/enroll
    → Laravel guarda imagen en storage/app/face-photos/
    → [Laravel NO analiza la imagen]

Usuario → "Verificar identidad"
    → cámara → captura imagen actual → POST /face/verify
    → Laravel recupera la foto registrada del usuario
    → Laravel envía AMBAS fotos al microservicio Python
    → Python/DeepFace compara → devuelve { match, distance }
    → Laravel interpreta el resultado y responde al navegador
```

El navegador **nunca** se comunica directamente con el microservicio Python. El control de seguridad siempre pasa por Laravel.

### Instalación del microservicio

**1. Crear la carpeta en la raíz del proyecto:**
```bash
mkdir face-recognition
```

Copia dentro: `Dockerfile`, `main.py`, `requirements.txt`, `docker-compose.yml`

**2. Construir y arrancar el contenedor:**
```bash
cd face-recognition
docker-compose up -d --build
```

La primera vez tarda varios minutos porque descarga los modelos de DeepFace. Verifica que funciona:
```bash
curl http://localhost:8001/health
# → {"status":"ok","service":"face-recognition"}
```

**3. Añadir la variable de entorno en `.env`:**
```env
FACE_SERVICE_URL=http://localhost:8001
```

**4. Migrar la base de datos:**
```bash
php artisan migrate
```

**5. Añadir `face_photo_path` al modelo `User`:**

En `app/Models/User.php`:
```php
protected $fillable = [
    'name', 'email', 'password', 'role_id', 'is_active',
    'face_photo_path',   // ← añadir
];
```

**6. Añadir rutas en `routes/web.php`:**
```php
use App\Http\Controllers\Player\FaceController;

Route::middleware(['auth', 'role:player,manager,admin'])->group(function () {
    Route::get('/face',          [FaceController::class, 'index']);
    Route::post('/face/enroll',  [FaceController::class, 'enroll']);
    Route::post('/face/verify',  [FaceController::class, 'verify']);
    Route::delete('/face/photo', [FaceController::class, 'deletePhoto']);
});
```

**7. Añadir enlace en el menú (`AppLayout.jsx`):**
```js
player: [
    { href: '/play',         label: 'Juegos',          icon: '🎮' },
    { href: '/play/history', label: 'Mi historial',     icon: '📊' },
    { href: '/face',         label: 'Seguridad facial', icon: '🔐' },
],
```

**8. Compilar el frontend:**
```bash
npm run build
```

---

## Módulo 2 — Detección de emociones (face-api.js en el navegador)

### Concepto

La detección de emociones ocurre **completamente en el navegador**, sin enviar imágenes ni vídeo al servidor. Se usa face-api.js para analizar expresiones faciales mientras el usuario juega.

Laravel solo recibe datos ya interpretados: la emoción dominante, el nivel de confianza y el instante de la sesión. No recibe datos biométricos en bruto.

### Flujo

```
Usuario entra en /play/{game}
    → face-api.js carga modelos desde CDN
    → el juego (iframe) inicia una sesión → GAMECRM_SESSION_STARTED
    → se solicita permiso de webcam
    → cada 3 segundos: captura frame → detecta expresión
    → POST /api/sessions/{id}/emotions con { emotion, confidence, session_second }
    → Laravel guarda el evento en PostgreSQL
```

Las emociones se guardan asociadas a la sesión de juego, no al usuario de forma permanente.

### Datos que se registran

| Campo | Descripción |
|---|---|
| `emotion` | Emoción dominante: `happy`, `sad`, `angry`, `neutral`, etc. |
| `confidence` | Confianza del modelo (0.0 – 1.0) |
| `session_second` | Segundo dentro de la sesión en que se detectó |

### Integración en el frontend

La detección se inicia automáticamente cuando el juego emite el mensaje `GAMECRM_SESSION_STARTED` a través de `postMessage`. La webcam aparece como una pequeña ventana en la esquina inferior derecha del juego, y el estado de detección se muestra en la barra superior.

No se requiere instalación adicional. La librería se carga desde CDN en tiempo de ejecución.

---

## Módulo 3 — Chat en tiempo real (Laravel Reverb + WebSockets)

### Concepto

El chat está contextualizado por juego: solo participan usuarios que están viendo ese juego. Los mensajes se persisten en base de datos y se emiten en tiempo real mediante WebSockets.

Laravel controla quién puede conectarse a cada canal y quién puede enviar mensajes. La seguridad no se elimina por usar tiempo real.

### Flujo

```
Usuario entra en /play/{game}
    → Play.jsx abre el panel de chat (botón 💬)
    → Laravel Echo se conecta al canal "game.{game_id}"
    → Se cargan los últimos mensajes del historial

Usuario escribe un mensaje → Enter o botón ➤
    → POST /chat/{game}/messages
    → Laravel guarda en chat_messages
    → Laravel dispara evento MessageSent → Reverb lo emite por WebSocket
    → Todos los usuarios conectados al canal reciben el mensaje
    → El propio usuario lo ve por optimistic update (sin esperar al WS)
```

### Instalación

**1. Instalar Laravel Reverb:**
```bash
php artisan install:broadcasting
```
Cuando pregunte el driver, elige **reverb**.

**2. Instalar dependencias JS:**
```bash
npm install --save-dev laravel-echo pusher-js
```

**3. Migrar la base de datos:**
```bash
php artisan migrate
```

**4. Añadir rutas en `routes/web.php`:**
```php
use App\Http\Controllers\Player\ChatController;

Route::middleware(['auth', 'role:player,manager,admin'])->group(function () {
    Route::get('/chat/{game}/messages',  [ChatController::class, 'index']);
    Route::post('/chat/{game}/messages', [ChatController::class, 'store']);
});
```

**5. Configurar Echo en `resources/js/app.jsx`** (al inicio del archivo, antes de `createInertiaApp`):
```js
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;
window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: parseInt(import.meta.env.VITE_REVERB_PORT) || 80,
    wssPort: parseInt(import.meta.env.VITE_REVERB_PORT) || 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
});
```

**6. Compilar el frontend:**
```bash
npm run build
```

### Variables de entorno para Reverb

```env
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=tu-app-id
REVERB_APP_KEY=tu-app-key
REVERB_APP_SECRET=tu-app-secret
REVERB_HOST=localhost
REVERB_PORT=8081
REVERB_SERVER_PORT=8081
REVERB_SCHEME=http

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

> **Nota sobre el puerto:** El puerto 8080 puede estar ocupado en Windows. Si `php artisan reverb:start` falla con un error de permisos de socket, establece `REVERB_PORT=8081` y `REVERB_SERVER_PORT=8081` en el `.env` y vuelve a intentarlo.

---

## Instalación completa del proyecto

### Requisitos previos

- PHP 8.2+
- Composer 2.x
- Node.js 20+
- PostgreSQL 15+
- Docker Desktop (para el módulo de reconocimiento facial)

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url> && cd gamecrm

# 2. Instalar dependencias PHP y JS
composer install
npm install

# 3. Configurar entorno
cp .env.example .env
php artisan key:generate

# 4. Editar .env con tus credenciales de PostgreSQL y Reverb

# 5. Ejecutar migraciones y seeders
php artisan migrate --seed

# 6. Compilar frontend
npm run build

# 7. Arrancar el microservicio de reconocimiento facial
cd face-recognition && docker-compose up -d --build && cd ..
```

### Arrancar el entorno de desarrollo

Necesitas **cuatro terminales**:

```bash
# Terminal 1 — Servidor Laravel
php artisan serve

# Terminal 2 — WebSocket Reverb
php artisan reverb:start

# Terminal 3 — Queue worker (para eventos broadcast)
php artisan queue:work

# Terminal 4 — Vite (solo en desarrollo)
npm run dev
```

> En producción, usa `ShouldBroadcastNow` en el evento `MessageSent` para evitar depender de la cola, o mantén el queue worker corriendo como servicio.

### Si migrate --seed falla con "tabla ya existe"

```bash
php artisan tinker
DB::statement('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
exit
php artisan migrate --seed
```

---

## Usuarios de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@gamecrm.com | password |
| Manager | manager@gamecrm.com | password |
| Player | player@gamecrm.com | password |

---

## Endpoints de la API

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/games` | Sanctum | Lista juegos publicados |
| `GET` | `/api/games/{id}` | Sanctum | Detalle de un juego |
| `POST` | `/api/sessions` | Sanctum | Iniciar sesión de juego |
| `POST` | `/api/sessions/{id}/end` | Sanctum | Finalizar sesión con resultado |
| `GET` | `/api/sessions` | Sanctum | Historial de sesiones del usuario |
| `POST` | `/api/sessions/{id}/emotions` | Sanctum | Registrar emoción detectada |
| `POST` | `/api/auth/token` | — | Obtener token Sanctum |

---

## Decisiones de diseño

**¿Por qué el reconocimiento facial en un microservicio Python y no en Laravel?**
Las librerías de visión artificial tienen dependencias nativas pesadas que no encajan en el ciclo de petición web de Laravel. Docker permite aislarlas en un contenedor que se ejecuta igual en desarrollo y producción sin contaminar el entorno PHP.

**¿Por qué la detección de emociones en el navegador y no en el servidor?**
El navegador ya tiene acceso a la webcam y puede procesar imágenes localmente. Enviar vídeo al servidor generaría una carga innecesaria y comprometería la privacidad. Laravel solo recibe datos ya interpretados.

**¿Por qué Inertia en lugar de Blade puro?**
Inertia permite crear interfaces dinámicas sin sacrificar el control de Laravel sobre rutas y autenticación. Es más mantenible que una SPA separada para este caso de uso.

**¿Por qué PostgreSQL?**
El sistema gestiona relaciones entre múltiples entidades con datos temporales. PostgreSQL ofrece mejor soporte para este tipo de consultas y mayor integridad referencial que SQLite.

**¿Por qué Sanctum y no Passport?**
Sanctum es suficiente para tokens simples por usuario para clientes SPA y aplicaciones cliente como Three.js. Passport añade complejidad innecesaria (OAuth2) para este proyecto.

**¿Por qué Laravel Reverb y no Pusher externo?**
Reverb es la solución oficial de Laravel para WebSockets. Se integra con el sistema de eventos del framework, respeta la autenticación existente y evita dependencias externas de pago.
