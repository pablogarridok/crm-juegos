import { Head, Link, router } from '@inertiajs/react'
import AppLayout from '@/Components/Layout/AppLayout'

const STATUS_BADGE = {
    published: <span className="badge-published">● Publicado</span>,
    draft:     <span className="badge-draft">○ Borrador</span>,
    archived:  <span className="badge-archived">◎ Archivado</span>,
}

export default function GamesIndex({ games, auth }) {
    const isAdmin = auth.user.role === 'admin'

    const toggleStatus = (game) => {
        router.post(`/manage/games/${game.id}/toggle-status`, {}, {
            preserveScroll: true,
        })
    }

    const destroy = (game) => {
        if (confirm(`¿Eliminar "${game.title}"? Esta acción no se puede deshacer.`)) {
            router.delete(`/manage/games/${game.id}`)
        }
    }

    return (
        <AppLayout title="Gestión de Juegos">
            <Head title="Juegos" />

            <div className="flex items-center justify-between mb-6">
                <p className="text-zinc-400 text-sm">
                    {games.total} juego{games.total !== 1 ? 's' : ''} en total
                </p>
                <Link href="/manage/games/create" className="btn-primary">
                    + Nuevo juego
                </Link>
            </div>

            {/* Tabla de juegos */}
            {games.data.length === 0 ? (
                <div className="card text-center py-16">
                    <span className="text-5xl block mb-3">🎮</span>
                    <p className="text-zinc-400 text-sm">Aún no hay juegos. ¡Crea el primero!</p>
                </div>
            ) : (
                <div className="card overflow-hidden p-0">
                    <table className="w-full text-sm">
                        <thead className="border-b border-zinc-800">
                            <tr className="text-left text-zinc-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-3">Juego</th>
                                <th className="px-6 py-3 hidden sm:table-cell">Estado</th>
                                <th className="px-6 py-3 hidden md:table-cell">Creado por</th>
                                <th className="px-6 py-3 hidden lg:table-cell">Creado</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {games.data.map((game) => (
                                <tr key={game.id} className="hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-semibold text-white">{game.title}</p>
                                            {game.description && (
                                                <p className="text-zinc-500 text-xs mt-0.5 truncate max-w-xs">
                                                    {game.description}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 hidden sm:table-cell">
                                        {STATUS_BADGE[game.status]}
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell text-zinc-400">
                                        {game.creator?.name ?? '—'}
                                    </td>
                                    <td className="px-6 py-4 hidden lg:table-cell text-zinc-500 font-mono text-xs">
                                        {new Date(game.created_at).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Preview */}
                                            <Link
                                                href={`/manage/games/${game.id}/preview`}
                                                className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-zinc-700"
                                            >
                                                Ver
                                            </Link>

                                            {/* Editar */}
                                            <Link
                                                href={`/manage/games/${game.id}/edit`}
                                                className="text-xs text-purple-400 hover:text-purple-300 transition-colors px-2 py-1 rounded hover:bg-zinc-700"
                                            >
                                                Editar
                                            </Link>

                                            {/* Toggle estado */}
                                            <button
                                                onClick={() => toggleStatus(game)}
                                                className={`text-xs px-2 py-1 rounded transition-colors ${
                                                    game.status === 'published'
                                                        ? 'text-amber-400 hover:bg-zinc-700'
                                                        : 'text-emerald-400 hover:bg-zinc-700'
                                                }`}
                                            >
                                                {game.status === 'published' ? 'Despublicar' : 'Publicar'}
                                            </button>

                                            {/* Eliminar: solo admin */}
                                            {isAdmin && (
                                                <button
                                                    onClick={() => destroy(game)}
                                                    className="text-xs text-red-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-zinc-700"
                                                >
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Paginación */}
                    {games.last_page > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
                            <p className="text-xs text-zinc-500">
                                Página {games.current_page} de {games.last_page}
                            </p>
                            <div className="flex gap-2">
                                {games.prev_page_url && (
                                    <Link href={games.prev_page_url} className="btn-secondary text-xs">← Anterior</Link>
                                )}
                                {games.next_page_url && (
                                    <Link href={games.next_page_url} className="btn-secondary text-xs">Siguiente →</Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </AppLayout>
    )
}
