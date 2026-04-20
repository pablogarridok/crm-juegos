import { Head } from '@inertiajs/react'
import { useRef, useState } from 'react'
import AppLayout from '@/Components/Layout/AppLayout'

export default function Face({ hasPhoto }) {
    const [tab, setTab] = useState(hasPhoto ? 'verify' : 'enroll')

    return (
        <AppLayout>
            <Head title="Seguridad facial" />

            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Seguridad facial</h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        Registra tu cara para una capa adicional de verificación de identidad.
                    </p>
                </div>

                <div className="flex gap-2 border-b border-zinc-800">
                    <TabButton active={tab === 'enroll'} onClick={() => setTab('enroll')}>
                        📸 Registrar cara
                    </TabButton>
                    <TabButton active={tab === 'verify'} onClick={() => setTab('verify')} disabled={!hasPhoto}>
                        🔍 Verificar identidad
                    </TabButton>
                </div>

                {tab === 'enroll' && <EnrollPanel onSuccess={() => setTab('verify')} />}
                {tab === 'verify' && <VerifyPanel />}
            </div>
        </AppLayout>
    )
}

function TabButton({ active, onClick, disabled, children }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                active
                    ? 'border-indigo-500 text-white'
                    : disabled
                        ? 'border-transparent text-zinc-700 cursor-not-allowed'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
        >
            {children}
        </button>
    )
}

// ─── Panel de enrolamiento ─────────────────────────────────────────────────────

function EnrollPanel({ onSuccess }) {
    const videoRef  = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)

    const [step,    setStep]    = useState('idle')
    const [capture, setCapture] = useState(null)
    const [message, setMessage] = useState('')

    const startCamera = async () => {
        // Primero actualizamos el estado para que el video sea visible
        setStep('camera')
        // Esperamos al siguiente tick para que React monte el elemento
        await new Promise(r => setTimeout(r, 50))

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' },
            })
            streamRef.current = stream
            if (!videoRef.current) throw new Error('Video element not ready')
            videoRef.current.srcObject = stream
            await videoRef.current.play()
        } catch (err) {
            console.error('[Face] Error cámara:', err)
            setMessage('No se pudo acceder a la cámara. Comprueba los permisos del navegador.')
            setStep('error')
            stopCamera()
        }
    }

    const takePhoto = () => {
        const video  = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas) return

        canvas.width  = video.videoWidth  || 640
        canvas.height = video.videoHeight || 480
        canvas.getContext('2d').drawImage(video, 0, 0)

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setCapture(dataUrl)
        stopCamera()
        setStep('captured')
    }

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        if (videoRef.current) videoRef.current.srcObject = null
    }

    const retake = () => {
        setCapture(null)
        setMessage('')
        setStep('idle')
    }

    const savePhoto = async () => {
        setStep('uploading')
        try {
            const res = await fetch('/face/enroll', {
                method:  'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept':       'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ image: capture }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message)
            setStep('done')
            setMessage(data.message)
            setTimeout(() => onSuccess(), 1500)
        } catch (e) {
            setStep('error')
            setMessage(e.message || 'Error al guardar la foto.')
        }
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <p className="text-sm text-zinc-400">
                Colócate frente a la cámara con buena iluminación y pulsa <strong className="text-white">Tomar foto</strong>.
            </p>

            {/* El video SIEMPRE está en el DOM, solo se muestra/oculta con CSS */}
            <div className={step === 'camera' ? 'space-y-3' : 'hidden'}>
                <div className="relative rounded-lg overflow-hidden bg-zinc-950">
                    <video ref={videoRef} className="w-full rounded-lg" muted playsInline />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-64 border-2 border-indigo-400/60 rounded-full" />
                    </div>
                </div>
                <button onClick={takePhoto} className="btn-primary w-full justify-center">
                    📸 Tomar foto
                </button>
            </div>

            {step === 'captured' && capture && (
                <div className="space-y-3">
                    <img src={capture} alt="Foto capturada" className="w-full rounded-lg" />
                    <div className="flex gap-2">
                        <button onClick={retake} className="btn-secondary flex-1 justify-center">
                            🔄 Repetir
                        </button>
                        <button onClick={savePhoto} className="btn-primary flex-1 justify-center">
                            ✅ Guardar como referencia
                        </button>
                    </div>
                </div>
            )}

            {step === 'idle' && (
                <button onClick={startCamera} className="btn-primary w-full justify-center">
                    📷 Activar cámara
                </button>
            )}

            {step === 'uploading' && (
                <p className="text-center text-zinc-400 text-sm animate-pulse">Guardando foto…</p>
            )}

            {step === 'done' && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                    ✓ {message}
                </div>
            )}

            {step === 'error' && (
                <div className="text-red-400 text-sm space-y-2">
                    <p>✕ {message}</p>
                    <button onClick={retake} className="btn-secondary text-xs">Intentar de nuevo</button>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
        </div>
    )
}

// ─── Panel de verificación ────────────────────────────────────────────────────

function VerifyPanel() {
    const videoRef  = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)

    const [step,     setStep]     = useState('idle')
    const [message,  setMessage]  = useState('')
    const [distance, setDistance] = useState(null)

    const startCamera = async () => {
        setStep('camera')
        await new Promise(r => setTimeout(r, 50))

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' },
            })
            streamRef.current = stream
            if (!videoRef.current) throw new Error('Video element not ready')
            videoRef.current.srcObject = stream
            await videoRef.current.play()
        } catch (err) {
            console.error('[Face] Error cámara:', err)
            setMessage('No se pudo acceder a la cámara.')
            setStep('error')
            stopCamera()
        }
    }

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        if (videoRef.current) videoRef.current.srcObject = null
    }

    const captureAndVerify = async () => {
        const video  = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas) return

        canvas.width  = video.videoWidth  || 640
        canvas.height = video.videoHeight || 480
        canvas.getContext('2d').drawImage(video, 0, 0)

        const imageBase64 = canvas.toDataURL('image/jpeg', 0.85)
        stopCamera()
        setStep('verifying')

        try {
            const res = await fetch('/face/verify', {
                method:  'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept':       'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ image: imageBase64 }),
            })
            const data = await res.json()
            setMessage(data.message)
            setDistance(data.distance ?? null)
            setStep(data.match ? 'match' : 'nomatch')
        } catch {
            setMessage('Error de conexión. Inténtalo de nuevo.')
            setStep('error')
        }
    }

    const reset = () => {
        setStep('idle')
        setMessage('')
        setDistance(null)
    }

    return (
        <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                <p className="text-sm text-zinc-400">
                    Mira a la cámara y pulsa <strong className="text-white">Verificar ahora</strong>.
                </p>

                {/* Video siempre en el DOM */}
                <div className={step === 'camera' ? 'space-y-3' : 'hidden'}>
                    <div className="relative rounded-lg overflow-hidden bg-zinc-950">
                        <video ref={videoRef} className="w-full rounded-lg" muted playsInline />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-48 h-64 border-2 border-indigo-400/60 rounded-full" />
                        </div>
                    </div>
                    <button onClick={captureAndVerify} className="btn-primary w-full justify-center">
                        🔍 Verificar ahora
                    </button>
                </div>

                {step === 'idle' && (
                    <button onClick={startCamera} className="btn-primary w-full justify-center">
                        🔍 Activar cámara para verificar
                    </button>
                )}

                {step === 'verifying' && (
                    <div className="text-center py-8 space-y-3">
                        <div className="text-4xl animate-pulse">🔍</div>
                        <p className="text-zinc-400 text-sm">Verificando identidad…</p>
                        <p className="text-zinc-600 text-xs">El microservicio Python está comparando los rostros</p>
                    </div>
                )}

                {step === 'match' && (
                    <div className="text-center py-6 space-y-3">
                        <div className="text-5xl">✅</div>
                        <p className="text-green-400 font-semibold">{message}</p>
                        {distance !== null && (
                            <p className="text-zinc-600 text-xs">Distancia: {distance} (menor = más similar)</p>
                        )}
                        <button onClick={reset} className="btn-secondary text-sm">Verificar de nuevo</button>
                    </div>
                )}

                {step === 'nomatch' && (
                    <div className="text-center py-6 space-y-3">
                        <div className="text-5xl">❌</div>
                        <p className="text-red-400 font-semibold">{message}</p>
                        {distance !== null && (
                            <p className="text-zinc-600 text-xs">Distancia: {distance}</p>
                        )}
                        <button onClick={reset} className="btn-secondary text-sm">Intentar de nuevo</button>
                    </div>
                )}

                {step === 'error' && (
                    <div className="text-center py-4 space-y-2">
                        <p className="text-red-400 text-sm">✕ {message}</p>
                        <button onClick={reset} className="btn-secondary text-sm">Volver</button>
                    </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <p className="text-xs text-zinc-600 font-mono leading-relaxed">
                    Flujo: navegador → imagen actual → Laravel → [foto registrada + imagen actual] → Python/DeepFace → resultado → Laravel → decisión
                </p>
            </div>
        </div>
    )
}

function getCsrfToken() {
    return decodeURIComponent(
        document.cookie.split('; ').find(r => r.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? ''
    )
}
