import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/Components/Layout/AppLayout'

function formatDuration(seconds) {
    if (!seconds) return '—'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
}

export default function PlayerHistory({ sessions }) {
    return (
        <AppLayout title="Mi historial de partidas">
            <Head title="Historial" />

            {sessions.data.length === 0 ? (
                <div className="card text-center py-20">
                    <span className="text-5xl block mb-4">📊</span>
                    <h2 className="text-xl font-bold text-white mb-2">Sin partidas aún</h2>
                    <p className="text-zinc-500 text-sm mb-6">Juega tu primera partida para ver tu historial aquí.</p>
                    <Link href="/play" className="btn-primary">
                        Ir a los juegos
                    </Link>
                </div>
            ) : (
                <>
                    {/* Estadísticas rápidas */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                        <StatCard label="Partidas jugadas" value={sessions.total} />
                        <StatCard
                            label="Completadas"
                            value={sessions.data.filter(s => s.status === 'completed').length}
                        />
                        <StatCard
                            label="Mejor puntuación"
                            value={Math.max(...sessions.data.map(s => s.score ?? 0))}
                            className="hidden sm:block"
                        />
                    </div>

                    {/* Tabla de sesiones */}
                    <div className="card overflow-hidden p-0">
                        <table className="w-full text-sm">
                            <thead className="border-b border-zinc-800">
                                <tr className="text-left text-zinc-500 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-3">Juego</th>
                                    <th className="px-6 py-3">Puntuación</th>
                                    <th className="px-6 py-3 hidden sm:table-cell">Duración</th>
                                    <th className="px-6 py-3 hidden md:table-cell">Estado</th>
                                    <th className="px-6 py-3 hidden lg:table-cell">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {sessions.data.map((session) => (
                                    <tr key={session.id} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-white">
                                                {session.game?.title ?? 'Juego eliminado'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-purple-400 font-bold">
                                                {session.score ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell text-zinc-400 font-mono text-xs">
                                            {formatDuration(session.duration_seconds)}
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            {session.status === 'completed' && (
                                                <span className="badge-published">Completada</span>
                                            )}
                                            {session.status === 'active' && (
                                                <span className="badge-draft">En curso</span>
                                            )}
                                            {session.status === 'abandoned' && (
                                                <span className="badge-archived">Abandonada</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell text-zinc-500 text-xs font-mono">
                                            {new Date(session.started_at).toLocaleString('es-ES')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Paginación */}
                        {sessions.last_page > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
                                <p className="text-xs text-zinc-500">
                                    Página {sessions.current_page} de {sessions.last_page}
                                </p>
                                <div className="flex gap-2">
                                    {sessions.prev_page_url && (
                                        <Link href={sessions.prev_page_url} className="btn-secondary text-xs">← Anterior</Link>
                                    )}
                                    {sessions.next_page_url && (
                                        <Link href={sessions.next_page_url} className="btn-secondary text-xs">Siguiente →</Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </AppLayout>
    )
}

function StatCard({ label, value, className = '' }) {
    return (
        <div className={`card text-center ${className}`}>
            <p className="text-3xl font-extrabold text-purple-400 font-mono">{value}</p>
            <p className="text-zinc-500 text-xs mt-1">{label}</p>
        </div>
    )
}
