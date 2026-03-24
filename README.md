# 🎮 GameCRM — Plataforma de Juegos con Laravel + Inertia + React

## Descripción general

GameCRM es una plataforma de juegos construida con Laravel como núcleo del sistema. Funciona como un CRM que gestiona usuarios, roles, juegos y sesiones de partida, mientras expone una API reutilizable para que los juegos desarrollados en Three.js puedan comunicarse con el servidor.

---

## Tecnologías utilizadas

| Tecnología | Función en el sistema |
|---|---|
| **Laravel 11** | Backend principal. Gestiona rutas, autenticación, autorización, modelos Eloquent, migraciones y la lógica del CRM. |
| **PostgreSQL** | Base de datos relacional. Almacena usuarios, roles, juegos, sesiones y eventos de partida. |
| **Eloquent ORM** | Abstrae las consultas a la base de datos. Define las relaciones entre modelos (User, Role, Game, GameSession). |
| **Inertia.js** | Puente entre Laravel y React. Permite usar React como capa de vistas sin convertir el proyecto en una SPA independiente. Laravel sigue controlando rutas y autenticación. |
| **React** | Librería para la interfaz del CRM. Gestiona el panel de admin/gestor y las vistas del jugador. |
| **Tailwind CSS** | Framework de utilidades CSS para estilar el frontend. |
| **Laravel Sanctum** | Gestión de tokens para la autenticación de la API. Los juegos (clientes Three.js) se autentican con Sanctum. |
| **Three.js** | Motor de juegos en el cliente (proyecto externo). Se comunica con Laravel exclusivamente a través de la API. |

---

## Arquitectura del proyecto

```
gamecrm/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/           # Registro, login, logout
│   │   │   ├── Admin/          # Gestión de usuarios y roles
│   │   │   ├── Manager/        # CRUD de juegos
│   │   │   ├── Player/         # Lista y acceso a juegos publicados
│   │   │   └── Api/            # Endpoints de la API para los juegos
│   │   ├── Middleware/
│   │   │   └── RoleMiddleware   # Protege rutas según rol
│   │   └── Requests/           # Form Requests para validación
│   ├── Models/
│   │   ├── User.php
│   │   ├── Role.php
│   │   ├── Game.php
│   │   └── GameSession.php
│   └── Policies/
│       └── GamePolicy.php      # Autorización basada en roles
├── database/
│   ├── migrations/             # Estructura versionada de la BD
│   └── seeders/                # Datos iniciales (roles, admin)
├── routes/
│   ├── web.php                 # Rutas del CRM (vistas Inertia)
│   └── api.php                 # Rutas de la API REST
└── resources/js/
    ├── Pages/                  # Vistas React (Inertia)
    │   ├── Admin/
    │   ├── Manager/
    │   ├── Player/
    │   └── Auth/
    └── Components/             # Componentes reutilizables
```

---

## Base de datos

Se utiliza **PostgreSQL** por su robustez en sistemas que gestionan datos relacionales con múltiples entidades (usuarios, sesiones, eventos).

### Entidades principales

- **roles** — Define los tipos de usuario: `admin`, `manager`, `player`
- **users** — Usuarios del sistema. Cada usuario tiene un `role_id`
- **games** — Juegos gestionados por el CRM. Incluye título, descripción, estado de publicación, URL/ruta del juego y el usuario creador
- **game_sessions** — Registra cada partida: quién jugó, a qué juego, cuándo empezó/terminó, duración y resultado

### Relaciones Eloquent

```
Role 1──N User
User 1──N Game (creador)
User 1──N GameSession
Game 1──N GameSession
```

---

## Autenticación

Se implementa con el sistema nativo de Laravel (`Auth`) y **Laravel Sanctum** para la API.

- Las rutas del CRM (web.php) usan sesiones de Laravel con `auth` middleware
- Las rutas de la API (api.php) usan tokens Sanctum con `auth:sanctum` middleware
- El juego Three.js obtiene un token al iniciar sesión y lo incluye en cada llamada a la API

**No se permiten accesos directos ni simulaciones.** Todas las rutas protegidas verifican la identidad del usuario en el servidor.

---

## Roles y autorización

Tres roles con responsabilidades distintas:

| Rol | Capacidades |
|---|---|
| `admin` | Gestionar usuarios, asignar roles, configuración global |
| `manager` | Crear/editar/publicar juegos, ver estadísticas |
| `player` | Ver juegos publicados, jugar, consultar sus resultados |

El control de roles se implementa en dos niveles:
1. **Middleware `RoleMiddleware`** — Protege grupos de rutas completos
2. **Policies (`GamePolicy`)** — Controla acciones específicas sobre recursos

Un jugador que conozca la URL del panel de gestión recibirá un `403 Forbidden`.

---

## Separación Web / API

### web.php (CRM)
- Devuelve respuestas **Inertia** (componentes React)
- Gestiona sesiones, autenticación y navegación
- Rutas: `/dashboard`, `/games`, `/admin/users`, etc.

### api.php (API REST)
- Devuelve **JSON estructurado** únicamente
- Sin vistas, sin sesiones web
- Protegida con Sanctum tokens
- Rutas: `/api/games`, `/api/sessions`, `/api/sessions/{id}/end`

---

## Gestión de juegos (CRUD)

El panel de gestión está disponible para `admin` y `manager`. Permite:

- **Crear** un juego (título, descripción, URL del juego, estado)
- **Editar** los datos del juego
- **Publicar / Despublicar** con un toggle de estado
- **Previsualizar** el juego dentro del contexto de la plataforma
- **Eliminar** un juego (solo admin)

Todas las acciones validan los datos con **Form Requests** de Laravel y comprueban permisos antes de ejecutarse.

---

## Experiencia del jugador

1. El jugador inicia sesión y ve la lista de juegos **publicados** (filtrado en servidor)
2. Selecciona un juego → Laravel carga la vista con el juego integrado (no es una página aislada)
3. El juego (Three.js) se inicializa y llama a `POST /api/sessions` para registrar el inicio
4. Durante la partida puede enviar eventos a `POST /api/sessions/{id}/events`
5. Al terminar, llama a `POST /api/sessions/{id}/end` con el resultado final

---

## Integración con Three.js

El juego vive fuera de Laravel (puede ser una URL externa o un asset estático). Laravel solo guarda la URL de acceso. La comunicación es **exclusivamente mediante la API**:

```javascript
// Ejemplo en el juego Three.js
const token = localStorage.getItem('sanctum_token');

// Iniciar sesión de juego
const session = await fetch('/api/sessions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ game_id: gameId })
});

// Finalizar partida con resultado
await fetch(`/api/sessions/${sessionId}/end`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ score: 1500, duration_seconds: 180 })
});
```

---

## Instalación y puesta en marcha

```bash
# 1. Clonar el repositorio
git clone <repo-url> && cd gamecrm

# 2. Instalar dependencias PHP
composer install

# 3. Instalar dependencias JS
npm install

# 4. Configurar entorno
cp .env.example .env
php artisan key:generate

# 5. Configurar la base de datos en .env
# DB_CONNECTION=pgsql
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_DATABASE=gamecrm
# DB_USERNAME=postgres
# DB_PASSWORD=tu_password

# 6. Ejecutar migraciones y seeders
php artisan migrate --seed

# 7. Compilar frontend
npm run build   # producción
npm run dev     # desarrollo

# 8. Iniciar servidor
php artisan serve
```

### Credenciales iniciales (seeder)

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
| `POST` | `/api/auth/token` | — | Obtener token Sanctum |

---

## Decisiones de diseño

**¿Por qué Inertia en lugar de Blade puro?**
Inertia permite crear un CRM con interfaces dinámicas (tablas, modales, formularios reactivos) sin sacrificar el control de Laravel sobre rutas y autenticación. Es más mantenible que una SPA separada para este caso de uso.

**¿Por qué PostgreSQL?**
El sistema gestiona relaciones entre múltiples entidades con datos temporales (sesiones, eventos). PostgreSQL ofrece mejor soporte para este tipo de consultas y mayor integridad referencial que SQLite.

**¿Por qué Sanctum y no Passport?**
Sanctum es suficiente para este caso: tokens simples por usuario para clientes SPA y aplicaciones cliente como Three.js. Passport añade complejidad innecesaria (OAuth2) para este proyecto.
