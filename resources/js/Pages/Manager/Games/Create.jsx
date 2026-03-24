import { Head, Link, useForm } from '@inertiajs/react'
import AppLayout from '@/Components/Layout/AppLayout'

export default function CreateGame() {
    const { data, setData, post, processing, errors } = useForm({
        title:         '',
        description:   '',
        game_url:      '',
        thumbnail_url: '',
        status:        'draft',
    })

    const submit = (e) => {
        e.preventDefault()
        post('/manage/games')
    }

    return (
        <AppLayout title="Nuevo juego">
            <Head title="Nuevo juego" />

            <div className="max-w-2xl">
                <div className="card">
                    <form onSubmit={submit} className="space-y-5">
                        {/* Título */}
                        <div>
                            <label className="form-label">Título <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Nombre del juego"
                                value={data.title}
                                onChange={e => setData('title', e.target.value)}
                                autoFocus
                            />
                            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="form-label">Descripción</label>
                            <textarea
                                className="form-input resize-none"
                                rows={3}
                                placeholder="Descripción breve del juego..."
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                            />
                            {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
                        </div>

                        {/* URL del juego */}
                        <div>
                            <label className="form-label">URL / Ruta del juego <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                className="form-input font-mono text-xs"
                                placeholder="/games/mi-juego/index.html  o  https://..."
                                value={data.game_url}
                                onChange={e => setData('game_url', e.target.value)}
                            />
                            <p className="text-zinc-600 text-xs mt-1">
                                Ruta relativa al public/ de Laravel o URL externa donde vive el juego Three.js.
                            </p>
                            {errors.game_url && <p className="text-red-400 text-xs mt-1">{errors.game_url}</p>}
                        </div>

                        {/* Thumbnail */}
                        <div>
                            <label className="form-label">URL de miniatura</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="https://... (opcional)"
                                value={data.thumbnail_url}
                                onChange={e => setData('thumbnail_url', e.target.value)}
                            />
                            {errors.thumbnail_url && <p className="text-red-400 text-xs mt-1">{errors.thumbnail_url}</p>}
                        </div>

                        {/* Estado */}
                        <div>
                            <label className="form-label">Estado inicial</label>
                            <select
                                className="form-input"
                                value={data.status}
                                onChange={e => setData('status', e.target.value)}
                            >
                                <option value="draft">Borrador (no visible para jugadores)</option>
                                <option value="published">Publicado (visible para jugadores)</option>
                            </select>
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={processing} className="btn-primary">
                                {processing ? 'Guardando...' : 'Crear juego'}
                            </button>
                            <Link href="/manage/games" className="btn-secondary">
                                Cancelar
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    )
}
