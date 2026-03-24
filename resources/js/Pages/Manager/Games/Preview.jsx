import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/Components/Layout/AppLayout'

export default function PreviewGame({ game }) {
    return (
        <AppLayout title={`Previsualización: ${game.title}`}>
            <Head title={`Preview: ${game.title}`} />

            <div className="mb-4 flex items-center gap-3">
                <Link href="/manage/games" className="btn-secondary text-xs">
                    ← Volver
                </Link>
                <span className="badge-draft text-xs">Modo previsualización</span>
                <Link href={`/manage/games/${game.id}/edit`} className="btn-secondary text-xs ml-auto">
                    Editar juego
                </Link>
            </div>

            {/* Metadatos del juego */}
            <div className="card mb-4">
                <h2 className="text-xl font-bold text-white">{game.title}</h2>
                {game.description && (
                    <p className="text-zinc-400 text-sm mt-1">{game.description}</p>
                )}
                <p className="text-zinc-600 text-xs mt-2 font-mono">
                    URL: {game.game_url}
                </p>
            </div>

            {/* Contenedor del juego */}
            <div className="card overflow-hidden p-0">
                <div className="bg-zinc-800 px-4 py-2 flex items-center gap-2 border-b border-zinc-700">
                    <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500/60" />
                        <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                        <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
                    </div>
                    <span className="text-zinc-500 text-xs font-mono truncate">{game.game_url}</span>
                </div>

                {/*
                    El juego se integra aquí dentro del contexto de la plataforma.
                    Puede ser un iframe para juegos externos o una ruta interna.
                    El usuario sigue dentro de la sesión de Laravel.
                */}
                <div className="relative" style={{ height: '600px' }}>
                    <iframe
                        src={game.game_url}
                        title={game.title}
                        className="w-full h-full border-0"
                        allow="fullscreen"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                </div>
            </div>

            <p className="text-xs text-zinc-600 text-center mt-3">
                Esta es la vista de previsualización para gestores. Los jugadores ven la misma integración.
            </p>
        </AppLayout>
    )
}
