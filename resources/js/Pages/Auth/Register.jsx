import { Head, Link, useForm } from '@inertiajs/react'

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    })

    const submit = (e) => {
        e.preventDefault()
        post('/register')
    }

    return (
        <>
            <Head title="Registro" />

            <div className="min-h-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.08)_0%,_transparent_70%)]" />

                <div className="relative w-full max-w-md px-6">
                    <div className="text-center mb-8">
                        <span className="text-5xl block mb-3">🎮</span>
                        <h1 className="text-3xl font-extrabold tracking-tight text-white">
                            Game<span className="text-purple-400">CRM</span>
                        </h1>
                    </div>

                    <div className="card">
                        <h2 className="text-lg font-bold text-white mb-6">Crear cuenta</h2>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="form-label">Nombre</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Tu nombre"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    autoFocus
                                />
                                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="tu@email.com"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                />
                                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="form-label">Contraseña</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Mínimo 8 caracteres"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                />
                                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="form-label">Confirmar contraseña</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Repite la contraseña"
                                    value={data.password_confirmation}
                                    onChange={e => setData('password_confirmation', e.target.value)}
                                />
                            </div>

                            <p className="text-xs text-zinc-500">
                                Las nuevas cuentas se crean con rol de <strong className="text-zinc-400">Jugador</strong>.
                            </p>

                            <button type="submit" disabled={processing} className="btn-primary w-full justify-center">
                                {processing ? 'Creando cuenta...' : 'Crear cuenta'}
                            </button>
                        </form>

                        <p className="text-center text-sm text-zinc-500 mt-4">
                            ¿Ya tienes cuenta?{' '}
                            <Link href="/login" className="text-purple-400 hover:text-purple-300">
                                Inicia sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
