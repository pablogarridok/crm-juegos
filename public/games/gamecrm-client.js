

export class GameCRMClient {
    constructor() {
        this.token    = null
        this.gameId   = null
        this.apiBase  = null
        this.sessionId = null
        this._ready   = false
    }


    init() {
        return new Promise((resolve) => {
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


    async startSession(gameId = null) {
        this._assertReady()
        const res = await this._post('/sessions', {
            game_id: gameId ?? this.gameId,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message ?? 'No se pudo iniciar la sesión')
        this.sessionId = data.session_id
        console.log('[GameCRM] Sesión iniciada:', this.sessionId)

        window.parent?.postMessage({ type: 'GAMECRM_SESSION_STARTED', session_id: this.sessionId }, '*')

        return this.sessionId
    }

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

        window.parent?.postMessage({ type: 'GAMECRM_SESSION_ENDED' }, '*')

        return data
    }


    async getGames() {
        this._assertReady()
        const res  = await this._get('/games')
        const data = await res.json()
        return data.data
    }


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
