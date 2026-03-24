import { Head, Link, useForm } from '@inertiajs/react'
import AppLayout from '@/Components/Layout/AppLayout'

export default function EditGame({ game }) {
    const { data, setData, patch, processing, errors } = useForm({
        title:         game.title,
        description:   game.description ?? '',
        game_url:      game.game_url,
        thumbnail_url: game.thumbnail_url ?? '',
        status:        game.status,
    })

    const submit = (e) => {
        e.preventDefault()
        patch(`/manage/games/${game.id}`)
    }

    return (
        <AppLayout title={`Editar: ${game.title}`}>
            <Head title={`Editar ${game.title}`} />

            <div className="max-w-2xl">
                <div className="card">
                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <label className="form-label">Título <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                className="form-input"
                                value={data.title}
                                onChange={e => setData('title', e.target.value)}
                            />
                            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="form-label">Descripción</label>
                            <textarea
                                className="form-input resize-none"
                                rows={3}
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="form-label">URL / Ruta del juego <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                className="form-input font-mono text-xs"
                                value={data.game_url}
                                onChange={e => setData('game_url', e.target.value)}
                            />
                            {errors.game_url && <p className="text-red-400 text-xs mt-1">{errors.game_url}</p>}
                        </div>

                        <div>
                            <label className="form-label">URL de miniatura</label>
                            <input
                                type="text"
                                className="form-input"
                                value={data.thumbnail_url}
                                onChange={e => setData('thumbnail_url', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="form-label">Estado</label>
                            <select
                                className="form-input"
                                value={data.status}
                                onChange={e => setData('status', e.target.value)}
                            >
                                <option value="draft">Borrador</option>
                                <option value="published">Publicado</option>
                                <option value="archived">Archivado</option>
                            </select>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={processing} className="btn-primary">
                                {processing ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                            <Link href="/manage/games" className="btn-secondary">Cancelar</Link>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    )
}
