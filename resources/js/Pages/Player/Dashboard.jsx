import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/Components/Layout/AppLayout'

export default function PlayerDashboard({ games }) {
    return (
        <AppLayout title="Juegos disponibles">
            <Head title="Juegos" />

            {games.length === 0 ? (
                <div className="card text-center py-20">
                    <span className="text-6xl block mb-4">🎮</span>
                    <h2 className="text-xl font-bold text-white mb-2">No hay juegos disponibles</h2>
                    <p className="text-zinc-500 text-sm">Vuelve pronto, se añadirán nuevos juegos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {games.map((game) => (
                        <GameCard key={game.id} game={game} />
                    ))}
                </div>
            )}
        </AppLayout>
    )
}

function GameCard({ game }) {
    return (
        <div className="card flex flex-col gap-4 hover:border-purple-800 transition-colors group">
            {/* Thumbnail o placeholder */}
            <div className="aspect-video rounded-lg overflow-hidden bg-zinc-800 flex items-center justify-center">
                {game.thumbnail_url ? (
                    <img
                        src={game.thumbnail_url}
                        alt={game.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-5xl opacity-30 group-hover:opacity-50 transition-opacity">🎮</span>
                )}
            </div>

            {/* Info */}
            <div className="flex-1">
                <h3 className="font-bold text-white text-lg leading-tight">{game.title}</h3>
                {game.description && (
                    <p className="text-zinc-400 text-sm mt-1 line-clamp-2">{game.description}</p>
                )}
            </div>

            {/* Acción */}
            <Link
                href={`/play/${game.id}`}
                className="btn-primary w-full justify-center"
            >
                Jugar ahora →
            </Link>
        </div>
    )
}
