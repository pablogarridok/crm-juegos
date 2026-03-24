import { Head, Link, router } from '@inertiajs/react'
import AppLayout from '@/Components/Layout/AppLayout'

const STATUS_BADGE = {
    published: <span className="badge-published">● Publicado</span>,
    draft:     <span className="badge-draft">○ Borrador</span>,
    archived:  <span className="badge-archived">◎ Archivado</span>,
}

export default function ShowGame({ game, stats }) {
    const toggleStatus = () => {
        router.post(`/manage/games/${game.id}/toggle-status`, {}, { preserveScroll: true })
    }

    return (
        <AppLayout title={game.title}>
            <Head title={game.title} />

            <div className="flex flex-wrap items-center gap-3 mb-6">
                <Link href="/manage/games" className="btn-secondary text-xs">← Volver</Link>
                <Link href={`/manage/games/${game.id}/edit`} className="btn-secondary text-xs">Editar</Link>
                <Link href={`/manage/games/${game.id}/preview`} className="btn-secondary text-xs">Preview</Link>
                <button onClick={toggleStatus} className="btn-primary text-xs ml-auto">
                    {game.status === 'published' ? 'Despublicar' : 'Publicar'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Info del juego */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="card">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">{game.title}</h2>
                                {game.description && (
                                    <p className="text-zinc-400 text-sm mt-1">{game.description}</p>
                                )}
                            </div>
                            <div className="ml-4 shrink-0">{STATUS_BADGE[game.status]}</div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2 text-sm">
                            <Row label="URL del juego" value={game.game_url} mono />
                            <Row label="Creado por" value={game.creator?.name} />
                            <Row label="Creado" value={new Date(game.created_at).toLocaleString('es-ES')} mono />
                        </div>
                    </div>
                </div>

                {/* Estadísticas */}
                <div className="space-y-4">
                    <div className="card text-center">
                        <p className="text-4xl font-extrabold text-purple-400 font-mono">{stats.total_sessions}</p>
                        <p className="text-zinc-500 text-xs mt-1">Partidas jugadas</p>
                    </div>
                    <div className="card text-center">
                        <p className="text-4xl font-extrabold text-emerald-400 font-mono">{stats.total_players}</p>
                        <p className="text-zinc-500 text-xs mt-1">Jugadores únicos</p>
                    </div>
                    <div className="card text-center">
                        <p className="text-4xl font-extrabold text-amber-400 font-mono">
                            {stats.avg_score ? Math.round(stats.avg_score) : '—'}
                        </p>
                        <p className="text-zinc-500 text-xs mt-1">Puntuación media</p>
                    </div>
                </div>
            </div>

            {/* Últimas sesiones */}
            {game.sessions?.length > 0 && (
                <div className="card overflow-hidden p-0 mt-6">
                    <div className="px-6 py-4 border-b border-zinc-800">
                        <h3 className="font-bold text-white text-sm">Últimas partidas</h3>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="border-b border-zinc-800">
                            <tr className="text-left text-zinc-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-3">Jugador</th>
                                <th className="px-6 py-3">Puntuación</th>
                                <th className="px-6 py-3 hidden sm:table-cell">Duración</th>
                                <th className="px-6 py-3 hidden md:table-cell">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {game.sessions.slice(0, 10).map((session) => (
                                <tr key={session.id} className="hover:bg-zinc-800/30">
                                    <td className="px-6 py-3 text-zinc-300">{session.user?.name ?? '—'}</td>
                                    <td className="px-6 py-3 font-mono text-purple-400">{session.score ?? '—'}</td>
                                    <td className="px-6 py-3 hidden sm:table-cell text-zinc-500 font-mono text-xs">
                                        {session.duration_seconds ? `${session.duration_seconds}s` : '—'}
                                    </td>
                                    <td className="px-6 py-3 hidden md:table-cell text-zinc-500 text-xs font-mono">
                                        {new Date(session.started_at).toLocaleString('es-ES')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AppLayout>
    )
}

function Row({ label, value, mono }) {
    return (
        <div className="flex items-start gap-2">
            <span className="text-zinc-500 w-28 shrink-0">{label}</span>
            <span className={`text-zinc-200 break-all ${mono ? 'font-mono text-xs' : ''}`}>{value ?? '—'}</span>
        </div>
    )
}
