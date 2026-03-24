import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/Components/Layout/AppLayout'
import { useEffect, useRef } from 'react'

export default function Play({ game, apiToken }) {
    const iframeRef = useRef(null)

    /**
     * Cuando el iframe carga el juego Three.js, le enviamos el token de API
     * y la información del juego mediante postMessage.
     * El juego escucha este evento para poder autenticarse con la API de Laravel.
     */
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

    return (
        <>
            <Head title={`Jugando: ${game.title}`} />

            {/* Barra superior mínima: el usuario sigue dentro de la plataforma */}
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

                    <span className="text-xs text-zinc-600">
                        🎮 GameCRM
                    </span>
                </div>

                {/* Contenedor del juego: ocupa toda la pantalla restante */}
                <div className="flex-1 relative">
                    <iframe
                        ref={iframeRef}
                        src={game.game_url}
                        title={game.title}
                        className="absolute inset-0 w-full h-full border-0"
                        allow="fullscreen; autoplay"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"
                    />
                </div>
            </div>
        </>
    )
}
