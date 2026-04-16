import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/Components/Layout/AppLayout'
import { useState } from 'react'

const EMOTION_EMOJI = {
    happy:     '😄',
    sad:       '😢',
    angry:     '😠',
    surprised: '😲',
    fearful:   '😨',
    disgusted: '🤢',
    neutral:   '😐',
}

const EMOTION_LABEL = {
    happy:     'Feliz',
    sad:       'Triste',
    angry:     'Enfadado',
    surprised: 'Sorprendido',
    fearful:   'Asustado',
    disgusted: 'Disgustado',
    neutral:   'Neutral',
}

function EmotionBadge({ emotion }) {
    if (!emotion) return null
    return (
        <span className="inline-flex items-center gap-1 text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
            {EMOTION_EMOJI[emotion] ?? '😐'}
            {EMOTION_LABEL[emotion] ?? emotion}
        </span>
    )
}

function SessionCard({ session, apiToken }) {
    const [emotions, setEmotions] = useState(null)
    const [loading, setLoading]   = useState(false)

    const loadEmotions = async () => {
        if (emotions) return  // ya cargadas
        setLoading(true)
        try {
            const res  = await fetch(`/api/sessions/${session.id}/emotions`, {
                headers: { 'Accept': 'application/json', ...(apiToken ? { 'Authorization': `Bearer ${apiToken}` } : {}) },
            })
            const data = await res.json()
            setEmotions(data)
        } catch {
            setEmotions({ error: true })
        } finally {
            setLoading(false)
        }
    }

    const durationLabel = session.duration_seconds != null
        ? `${Math.floor(session.duration_seconds / 60)}m ${session.duration_seconds % 60}s`
        : '—'

    const dateLabel = new Date(session.started_at).toLocaleString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            {/* Cabecera */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="font-semibold text-white">{session.game?.title ?? '—'}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{dateLabel}</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-white">
                        {session.score != null ? session.score.toLocaleString() : '—'}
                        {session.score != null && <span className="text-xs text-zinc-500 ml-1">pts</span>}
                    </p>
                    <p className="text-xs text-zinc-500">{durationLabel}</p>
                </div>
            </div>

            {/* Estado */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                    session.status === 'completed' ? 'bg-green-900/40 text-green-400' :
                    session.status === 'active'    ? 'bg-yellow-900/40 text-yellow-400' :
                                                     'bg-zinc-800 text-zinc-500'
                }`}>
                    {session.status === 'completed' ? 'Completada' :
                     session.status === 'active'    ? 'En curso' : 'Abandonada'}
                </span>
            </div>

            {/* Emociones */}
            <div>
                {emotions === null ? (
                    <button
                        onClick={loadEmotions}
                        disabled={loading}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
                    >
                        {loading ? 'Cargando emociones…' : 'Ver emociones detectadas'}
                    </button>
                ) : emotions.error ? (
                    <p className="text-xs text-red-500">No se pudieron cargar las emociones.</p>
                ) : emotions.total === 0 ? (
                    <p className="text-xs text-zinc-600">Sin datos de emociones en esta sesión.</p>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-zinc-500">Emoción dominante:</span>
                            <EmotionBadge emotion={emotions.dominant} />
                            <span className="text-xs text-zinc-600">({emotions.total} capturas)</span>
                        </div>

                        {/* Distribución de emociones */}
                        <EmotionDistribution events={emotions.events} />
                    </div>
                )}
            </div>
        </div>
    )
}

function EmotionDistribution({ events }) {
    if (!events?.length) return null

    // Contar ocurrencias por emoción
    const counts = events.reduce((acc, e) => {
        acc[e.emotion] = (acc[e.emotion] ?? 0) + 1
        return acc
    }, {})

    const total = events.length
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])

    return (
        <div className="space-y-1">
            {sorted.map(([emotion, count]) => (
                <div key={emotion} className="flex items-center gap-2">
                    <span className="text-sm w-5">{EMOTION_EMOJI[emotion]}</span>
                    <div className="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${(count / total) * 100}%` }}
                        />
                    </div>
                    <span className="text-xs text-zinc-500 w-8 text-right">
                        {Math.round((count / total) * 100)}%
                    </span>
                </div>
            ))}
        </div>
    )
}

export default function History({ sessions, apiToken }) {
    return (
        <AppLayout>
            <Head title="Mi historial" />

            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Mi historial</h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        Tus partidas y las emociones detectadas durante cada sesión.
                    </p>
                </div>

                {sessions.data.length === 0 ? (
                    <div className="text-center py-16 text-zinc-600">
                        <p className="text-4xl mb-3">🎮</p>
                        <p>Todavía no has jugado ninguna partida.</p>
                        <Link href="/play" className="text-indigo-400 hover:underline text-sm mt-2 inline-block">
                            Explorar juegos
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sessions.data.map(session => (
                            <SessionCard key={session.id} session={session} apiToken={apiToken} />
                        ))}
                    </div>
                )}

                {/* Paginación */}
                {sessions.last_page > 1 && (
                    <div className="flex justify-center gap-2 pt-4">
                        {sessions.links.map((link, i) => (
                            link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`px-3 py-1 rounded text-sm transition-colors ${
                                        link.active
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <span
                                    key={i}
                                    className="px-3 py-1 rounded text-sm bg-zinc-900 text-zinc-700"
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            )
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
