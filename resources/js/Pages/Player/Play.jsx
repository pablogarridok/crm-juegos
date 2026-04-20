import { Head, Link, usePage } from '@inertiajs/react'
import { useEffect, useRef, useState } from 'react'

// ─── Constantes ───────────────────────────────────────────────────────────────
const EMOTION_INTERVAL_MS = 3000
const MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'

export default function Play({ game, apiToken }) {
    const { auth } = usePage().props

    // ── Refs de emociones (igual que antes) ───────────────────────────────────
    const iframeRef   = useRef(null)
    const videoRef    = useRef(null)
    const canvasRef   = useRef(null)
    const intervalRef = useRef(null)
    const sessionRef  = useRef(null)
    const startTimeRef = useRef(null)

    const [emotionStatus, setEmotionStatus] = useState('idle')
    const [lastEmotion,   setLastEmotion]   = useState(null)
    const [faceApiReady,  setFaceApiReady]  = useState(false)

    // ── Estado del chat ───────────────────────────────────────────────────────
    const [chatOpen,    setChatOpen]    = useState(false)
    const [messages,    setMessages]    = useState([])
    const [inputText,   setInputText]   = useState('')
    const [sending,     setSending]     = useState(false)
    const [wsConnected, setWsConnected] = useState(false)
    const messagesEndRef = useRef(null)
    const echoRef        = useRef(null)

    // ─────────────────────────────────────────────────────────────────────────
    // EMOCIONES (sin cambios respecto a la versión anterior)
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.src  = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.js'
        script.onload = () => loadModels()
        document.head.appendChild(script)
        return () => { try { document.head.removeChild(script) } catch {} }
    }, [])

    const loadModels = async () => {
        setEmotionStatus('loading')
        try {
            const faceapi = window.faceapi
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
            ])
            setFaceApiReady(true)
            setEmotionStatus('idle')
        } catch {
            setEmotionStatus('error')
        }
    }

    useEffect(() => {
        const iframe = iframeRef.current
        if (!iframe) return
        const handleLoad = () => {
            iframe.contentWindow.postMessage(
                { type: 'GAMECRM_INIT', token: apiToken, gameId: game.id, apiBase: window.location.origin + '/api' },
                '*'
            )
        }
        iframe.addEventListener('load', handleLoad)
        return () => iframe.removeEventListener('load', handleLoad)
    }, [apiToken, game.id])

    useEffect(() => {
        const handler = (event) => {
            if (event.data?.type === 'GAMECRM_SESSION_STARTED') {
                sessionRef.current   = event.data.session_id
                startTimeRef.current = Date.now()
                startEmotionDetection()
            }
            if (event.data?.type === 'GAMECRM_SESSION_ENDED') {
                stopEmotionDetection()
            }
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [faceApiReady])

    const startEmotionDetection = async () => {
        if (!faceApiReady) return
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } })
            videoRef.current.srcObject = stream
            await videoRef.current.play()
            setEmotionStatus('active')
            intervalRef.current = setInterval(captureEmotion, EMOTION_INTERVAL_MS)
        } catch {
            setEmotionStatus('error')
        }
    }

    const stopEmotionDetection = () => {
        clearInterval(intervalRef.current)
        videoRef.current?.srcObject?.getTracks().forEach(t => t.stop())
        if (videoRef.current) videoRef.current.srcObject = null
        setEmotionStatus('idle')
    }

    const captureEmotion = async () => {
        if (!window.faceapi || !videoRef.current || !sessionRef.current) return
        const faceapi = window.faceapi
        const result = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
            .withFaceExpressions()
        if (!result) { setEmotionStatus('no-face'); return }
        setEmotionStatus('active')
        const dominant = Object.entries(result.expressions).reduce(
            (best, [emotion, score]) => score > best.score ? { emotion, score } : best,
            { emotion: 'neutral', score: 0 }
        )
        setLastEmotion(dominant.emotion)
        try {
            await fetch(`/api/sessions/${sessionRef.current}/emotions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${apiToken}` },
                body: JSON.stringify({
                    emotion: dominant.emotion,
                    confidence: parseFloat(dominant.score.toFixed(4)),
                    session_second: Math.floor((Date.now() - startTimeRef.current) / 1000),
                }),
            })
        } catch {}
    }

    useEffect(() => { return () => stopEmotionDetection() }, [])

    // ─────────────────────────────────────────────────────────────────────────
    // CHAT CON WEBSOCKETS (Laravel Reverb + Laravel Echo)
    // ─────────────────────────────────────────────────────────────────────────

    // Cargar historial de mensajes al abrir el chat
    useEffect(() => {
        if (!chatOpen || messages.length > 0) return
        fetch(`/chat/${game.id}/messages`, {
            headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': getCsrfToken() },
        })
            .then(r => r.json())
            .then(data => setMessages(Array.isArray(data) ? data : []))
            .catch(() => {})
    }, [chatOpen])

    // Conectar a Laravel Echo / Reverb cuando se abre el chat
    useEffect(() => {
        if (!chatOpen) return
        if (typeof window.Echo === 'undefined') {
            console.warn('[Chat] Laravel Echo no está disponible. ¿Has ejecutado npm run build?')
            return
        }

        // Suscribirse al canal público del juego
        const channel = window.Echo.channel(`game.${game.id}`)
        echoRef.current = channel

        channel.listen('.message.sent', (data) => {
            setMessages(prev => [...prev, data])
        })

        setWsConnected(true)

        return () => {
            window.Echo.leaveChannel(`game.${game.id}`)
            setWsConnected(false)
        }
    }, [chatOpen, game.id])

    // Scroll al último mensaje
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async () => {
        const text = inputText.trim()
        if (!text || sending) return

        setSending(true)
        const optimistic = {
            id: Date.now(),
            body: text,
            user_name: auth.user.name,
            user_id: auth.user.id,
            created_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, optimistic])
        setInputText('')

        try {
            const res = await fetch(`/chat/${game.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept':       'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ body: text }),
            })
            if (!res.ok) throw new Error()
        } catch {
            // Si falla, quitar el mensaje optimista
            setMessages(prev => prev.filter(m => m.id !== optimistic.id))
        } finally {
            setSending(false)
        }
    }

    const emotionEmoji = { happy: '😄', sad: '😢', angry: '😠', surprised: '😲', fearful: '😨', disgusted: '🤢', neutral: '😐' }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <>
            <Head title={`Jugando: ${game.title}`} />

            <div className="h-screen flex flex-col bg-zinc-950">

                {/* Header compacto */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <Link href="/play" className="text-zinc-500 hover:text-white transition-colors text-sm">
                            ← Volver
                        </Link>
                        <span className="text-zinc-700">|</span>
                        <h1 className="text-sm font-semibold text-white">{game.title}</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Indicador de emoción */}
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            {emotionStatus === 'loading'  && <span className="animate-pulse">Cargando detección…</span>}
                            {emotionStatus === 'active' && lastEmotion && (
                                <span className="flex items-center gap-1">
                                    {emotionEmoji[lastEmotion] ?? '😐'}
                                    <span className="capitalize text-zinc-400">{lastEmotion}</span>
                                </span>
                            )}
                            {emotionStatus === 'no-face' && <span className="text-zinc-600">Sin cara detectada</span>}
                            {emotionStatus === 'error'   && <span className="text-red-700">Sin webcam</span>}
                        </div>

                        {/* Botón de chat */}
                        <button
                            onClick={() => setChatOpen(v => !v)}
                            className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                                chatOpen
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                            }`}
                        >
                            💬 Chat
                            {wsConnected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" title="Conectado" />
                            )}
                        </button>

                        <span className="text-zinc-700 text-xs">🎮 GameCRM</span>
                    </div>
                </div>

                {/* Área principal */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Iframe del juego */}
                    <div className="flex-1 relative">
                        <iframe
                            ref={iframeRef}
                            src={game.game_url}
                            title={game.title}
                            className="absolute inset-0 w-full h-full border-0"
                            allow="fullscreen; autoplay; camera"
                        />

                        {/* Webcam pequeña en esquina */}
                        {emotionStatus === 'active' && (
                            <div className="absolute bottom-4 right-4 z-10 rounded-lg overflow-hidden border border-zinc-700 shadow-xl opacity-80 hover:opacity-100 transition-opacity">
                                <video ref={videoRef} width={160} height={120} muted playsInline className="block" />
                            </div>
                        )}
                        {emotionStatus !== 'active' && (
                            <video ref={videoRef} width={160} height={120} muted playsInline className="hidden" />
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {/* Panel de chat lateral */}
                    {chatOpen && (
                        <div className="w-72 flex flex-col border-l border-zinc-800 bg-zinc-950 shrink-0">
                            {/* Cabecera del chat */}
                            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-white">Chat del juego</p>
                                    <p className="text-xs text-zinc-600 truncate">{game.title}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {wsConnected
                                        ? <span className="text-xs text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"/>En vivo</span>
                                        : <span className="text-xs text-zinc-600">Sin conexión WS</span>
                                    }
                                </div>
                            </div>

                            {/* Lista de mensajes */}
                            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                                {messages.length === 0 ? (
                                    <p className="text-xs text-zinc-600 text-center mt-8">
                                        Sin mensajes aún.<br />¡Sé el primero en escribir!
                                    </p>
                                ) : (
                                    messages.map((msg) => {
                                        const isMe = msg.user_id === auth.user.id
                                        return (
                                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                {!isMe && (
                                                    <span className="text-[10px] text-zinc-500 mb-0.5 px-1">{msg.user_name}</span>
                                                )}
                                                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm break-words ${
                                                    isMe
                                                        ? 'bg-indigo-600 text-white rounded-br-sm'
                                                        : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                                                }`}>
                                                    {msg.body}
                                                </div>
                                                <span className="text-[10px] text-zinc-600 mt-0.5 px-1">
                                                    {new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input de mensaje */}
                            <div className="px-3 py-3 border-t border-zinc-800">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={e => setInputText(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                        placeholder="Escribe un mensaje…"
                                        maxLength={500}
                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!inputText.trim() || sending}
                                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white transition-colors text-sm"
                                        title="Enviar"
                                    >
                                        ➤
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

function getCsrfToken() {
    return decodeURIComponent(
        document.cookie.split('; ').find(r => r.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? ''
    )
}
