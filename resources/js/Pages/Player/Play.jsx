import { Head, Link } from '@inertiajs/react'
import { useEffect, useRef, useState } from 'react'

// ─── Constantes ───────────────────────────────────────────────────────────────
// Intervalo en ms entre cada captura de emoción (3 segundos)
const EMOTION_INTERVAL_MS = 3000

// Modelos que necesita face-api.js (se cargan desde CDN de jsDelivr)
const MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'

export default function Play({ game, apiToken }) {
    const iframeRef  = useRef(null)
    const videoRef   = useRef(null)
    const canvasRef  = useRef(null)
    const intervalRef = useRef(null)
    const sessionRef  = useRef(null)   // ID de sesión activa
    const startTimeRef = useRef(null)  // Para calcular session_second

    const [emotionStatus, setEmotionStatus] = useState('idle')
    // idle | loading | active | error | no-face
    const [lastEmotion, setLastEmotion] = useState(null)
    const [faceApiReady, setFaceApiReady] = useState(false)

    // ── 1. Cargar face-api.js desde CDN ──────────────────────────────────────
    useEffect(() => {
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.js'
        script.onload = () => loadModels()
        document.head.appendChild(script)

        return () => {
            document.head.removeChild(script)
        }
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
        } catch (err) {
            console.error('[Emociones] Error cargando modelos:', err)
            setEmotionStatus('error')
        }
    }

    // ── 2. Postmessage al iframe cuando carga el juego ────────────────────────
    useEffect(() => {
        const iframe = iframeRef.current
        if (!iframe) return

        const handleLoad = () => {
            iframe.contentWindow.postMessage(
                {
                    type:    'GAMECRM_INIT',
                    token:   apiToken,
                    gameId:  game.id,
                    apiBase: window.location.origin + '/api',
                },
                '*'
            )
        }

        iframe.addEventListener('load', handleLoad)
        return () => iframe.removeEventListener('load', handleLoad)
    }, [apiToken, game.id])

    // ── 3. Escuchar cuando el juego inicia sesión (postMessage) ──────────────
    useEffect(() => {
        const handler = (event) => {
            if (event.data?.type === 'GAMECRM_SESSION_STARTED') {
                sessionRef.current  = event.data.session_id
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

    // ── 4. Iniciar webcam y detección ─────────────────────────────────────────
    const startEmotionDetection = async () => {
        if (!faceApiReady) return

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: 'user' },
            })
            videoRef.current.srcObject = stream
            await videoRef.current.play()
            setEmotionStatus('active')

            intervalRef.current = setInterval(captureEmotion, EMOTION_INTERVAL_MS)
        } catch (err) {
            console.warn('[Emociones] Sin acceso a webcam:', err)
            setEmotionStatus('error')
        }
    }

    const stopEmotionDetection = () => {
        clearInterval(intervalRef.current)
        const stream = videoRef.current?.srcObject
        stream?.getTracks().forEach(t => t.stop())
        if (videoRef.current) videoRef.current.srcObject = null
        setEmotionStatus('idle')
    }

    // ── 5. Capturar emoción y enviar a la API ─────────────────────────────────
    const captureEmotion = async () => {
        if (!window.faceapi || !videoRef.current || !sessionRef.current) return

        const faceapi = window.faceapi
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224 })

        const result = await faceapi
            .detectSingleFace(videoRef.current, options)
            .withFaceExpressions()

        if (!result) {
            setEmotionStatus('no-face')
            return
        }

        setEmotionStatus('active')

        // Emoción dominante
        const expressions = result.expressions
        const dominant = Object.entries(expressions).reduce(
            (best, [emotion, score]) => score > best.score ? { emotion, score } : best,
            { emotion: 'neutral', score: 0 }
        )

        setLastEmotion(dominant.emotion)

        const sessionSecond = Math.floor((Date.now() - startTimeRef.current) / 1000)

        // Enviar a la API de Laravel (solo datos, nunca imágenes)
        try {
            await fetch(`/api/sessions/${sessionRef.current}/emotions`, {
                method:  'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'Accept':        'application/json',
                    'Authorization': `Bearer ${apiToken}`,
                },
                body: JSON.stringify({
                    emotion:        dominant.emotion,
                    confidence:     parseFloat(dominant.score.toFixed(4)),
                    session_second: sessionSecond,
                }),
            })
        } catch (err) {
            console.warn('[Emociones] Error enviando emoción:', err)
        }
    }

    // ── Limpieza al desmontar ─────────────────────────────────────────────────
    useEffect(() => {
        return () => stopEmotionDetection()
    }, [])

    // ── Emoji por emoción ─────────────────────────────────────────────────────
    const emotionEmoji = {
        happy:     '😄',
        sad:       '😢',
        angry:     '😠',
        surprised: '😲',
        fearful:   '😨',
        disgusted: '🤢',
        neutral:   '😐',
    }

    return (
        <>
            <Head title={`Jugando: ${game.title}`} />

            <div className="h-screen flex flex-col bg-zinc-950">

                {/* Header compacto */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/play"
                            className="text-zinc-500 hover:text-white transition-colors text-sm"
                        >
                            ← Volver
                        </Link>
                        <span className="text-zinc-700">|</span>
                        <h1 className="text-sm font-semibold text-white">{game.title}</h1>
                    </div>

                    {/* Indicador de emoción en tiempo real */}
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        {emotionStatus === 'loading' && (
                            <span className="animate-pulse">Cargando detección…</span>
                        )}
                        {emotionStatus === 'active' && lastEmotion && (
                            <span className="flex items-center gap-1">
                                {emotionEmoji[lastEmotion] ?? '😐'}
                                <span className="capitalize text-zinc-400">{lastEmotion}</span>
                            </span>
                        )}
                        {emotionStatus === 'no-face' && (
                            <span className="text-zinc-600">Sin cara detectada</span>
                        )}
                        {emotionStatus === 'error' && (
                            <span className="text-red-700">Sin webcam</span>
                        )}
                        <span className="text-zinc-700">🎮 GameCRM</span>
                    </div>
                </div>

                {/* Área principal: juego + webcam oculta */}
                <div className="flex-1 relative">
                    <iframe
                        ref={iframeRef}
                        src={game.game_url}
                        title={game.title}
                        className="absolute inset-0 w-full h-full border-0"
                        allow="fullscreen; autoplay; camera"
                    />

                    {/* Webcam: pequeña y en esquina. Solo visible si está activa */}
                    {emotionStatus === 'active' && (
                        <div className="absolute bottom-4 right-4 z-10 rounded-lg overflow-hidden border border-zinc-700 shadow-xl opacity-80 hover:opacity-100 transition-opacity">
                            <video
                                ref={videoRef}
                                width={160}
                                height={120}
                                muted
                                playsInline
                                className="block"
                            />
                        </div>
                    )}

                    {/* Video oculto cuando no está activo (necesario para el stream) */}
                    {emotionStatus !== 'active' && (
                        <video
                            ref={videoRef}
                            width={160}
                            height={120}
                            muted
                            playsInline
                            className="hidden"
                        />
                    )}

                    {/* Canvas auxiliar para face-api (invisible) */}
                    <canvas ref={canvasRef} className="hidden" />
                </div>
            </div>
        </>
    )
}
