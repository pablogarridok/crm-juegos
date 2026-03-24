/**
 * GameCRM API Client para Three.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Este archivo se incluye en tu juego Three.js para comunicarte con la API
 * de Laravel. No modifica la lógica del juego; solo gestiona la comunicación.
 *
 * Uso:
 *   import { GameCRMClient } from './gamecrm-client.js'
 *
 *   const client = new GameCRMClient()
 *   await client.init()                        // Espera el token de Laravel
 *   await client.startSession()               // Inicia partida
 *   await client.endSession(score, extraData) // Finaliza partida
 */

export class GameCRMClient {
    constructor() {
        this.token    = null
        this.gameId   = null
        this.apiBase  = null
        this.sessionId = null
        this._ready   = false
    }

    /**
     * Espera el mensaje postMessage de Laravel con el token Sanctum.
     * La vista Player/Play.jsx envía este mensaje cuando carga el iframe.
     *
     * Uso: await client.init()
     */
    init() {
        return new Promise((resolve) => {
            // Si el juego está en modo standalone (fuera de iframe), usa login manual
            if (window.self === window.top) {
                console.warn('[GameCRM] No estás dentro del iframe de GameCRM. Usa loginWithCredentials().')
                resolve(false)
                return
            }

            window.addEventListener('message', (event) => {
                if (event.data?.type === 'GAMECRM_INIT') {
                    this.token   = event.data.token
                    this.gameId  = event.data.gameId
                    this.apiBase = event.data.apiBase
                    this._ready  = true
                    console.log('[GameCRM] Inicializado. Game ID:', this.gameId)
                    resolve(true)
                }
            }, { once: true })
        })
    }

    /**
     * Login manual con email/password (para pruebas fuera del iframe).
     */
    async loginWithCredentials(email, password, apiBase = '/api') {
        this.apiBase = apiBase
        const res  = await fetch(`${this.apiBase}/auth/token`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body:    JSON.stringify({ email, password, device_name: 'threejs-game' }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message ?? 'Login fallido')
        this.token  = data.token
        this._ready = true
        return data.user
    }

    /**
     * Inicia una sesión de juego en la API de Laravel.
     * Llama a este método cuando el jugador empieza a jugar.
     */
    async startSession(gameId = null) {
        this._assertReady()
        const res = await this._post('/sessions', {
            game_id: gameId ?? this.gameId,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message ?? 'No se pudo iniciar la sesión')
        this.sessionId = data.session_id
        console.log('[GameCRM] Sesión iniciada:', this.sessionId)
        return this.sessionId
    }

    /**
     * Finaliza la sesión activa con la puntuación obtenida.
     * Llama a este método cuando el jugador termina la partida (victoria, derrota, tiempo agotado...).
     *
     * @param {number} score - Puntuación final
     * @param {object} resultData - Datos adicionales (nivel alcanzado, tiempo, etc.)
     */
    async endSession(score, resultData = {}) {
        this._assertReady()
        if (!this.sessionId) throw new Error('[GameCRM] No hay sesión activa. Llama a startSession() primero.')

        const res = await this._post(`/sessions/${this.sessionId}/end`, {
            score,
            result_data: resultData,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message ?? 'No se pudo finalizar la sesión')
        console.log('[GameCRM] Sesión finalizada. Score:', score, '| Duración:', data.duration_seconds, 's')
        this.sessionId = null
        return data
    }

    /**
     * Obtiene la lista de juegos publicados.
     */
    async getGames() {
        this._assertReady()
        const res  = await this._get('/games')
        const data = await res.json()
        return data.data
    }

    // ── Privados ────────────────────────────────────────────────────────────────

    _assertReady() {
        if (!this._ready || !this.token) {
            throw new Error('[GameCRM] Cliente no inicializado. Llama a init() o loginWithCredentials() primero.')
        }
    }

    _headers() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type':  'application/json',
            'Accept':        'application/json',
        }
    }

    _get(path) {
        return fetch(`${this.apiBase}${path}`, { headers: this._headers() })
    }

    _post(path, body) {
        return fetch(`${this.apiBase}${path}`, {
            method:  'POST',
            headers: this._headers(),
            body:    JSON.stringify(body),
        })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ejemplo de integración en tu juego Three.js:
// ─────────────────────────────────────────────────────────────────────────────
//
// import * as THREE from 'three'
// import { GameCRMClient } from './gamecrm-client.js'
//
// const client = new GameCRMClient()
// let score = 0
//
// async function main() {
//     // 1. Inicializar cliente (espera el token de Laravel)
//     await client.init()
//
//     // 2. Iniciar la sesión cuando empieza la partida
//     await client.startSession()
//
//     // 3. Tu lógica de juego Three.js aquí...
//     const scene    = new THREE.Scene()
//     const camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
//     const renderer = new THREE.WebGLRenderer()
//     // ...
//
//     // 4. Al terminar la partida, enviar resultado
//     function onGameOver() {
//         client.endSession(score, {
//             level_reached: 5,
//             enemies_killed: 23,
//         })
//     }
// }
//
// main()
