import { Head, Link, useForm } from '@inertiajs/react'

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    })

    const submit = (e) => {
        e.preventDefault()
        post('/login')
    }

    return (
        <>
            <Head title="Iniciar sesión" />

            <div className="min-h-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden">
                {/* Fondo decorativo */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.08)_0%,_transparent_70%)]" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />

                <div className="relative w-full max-w-md px-6">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <span className="text-5xl block mb-3">🎮</span>
                        <h1 className="text-3xl font-extrabold tracking-tight text-white">
                            Game<span className="text-purple-400">CRM</span>
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1">Plataforma de juegos</p>
                    </div>

                    {/* Card */}
                    <div className="card">
                        <h2 className="text-lg font-bold text-white mb-6">Iniciar sesión</h2>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="tu@email.com"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    autoFocus
                                />
                                {errors.email && (
                                    <p className="text-red-400 text-xs mt-1">Email incorrecto</p>
                                )}
                            </div>

                            <div>
                                <label className="form-label">Contraseña</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                />
                                {errors.password && (
                                    <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={data.remember}
                                    onChange={e => setData('remember', e.target.checked)}
                                    className="accent-purple-500"
                                />
                                <label htmlFor="remember" className="text-sm text-zinc-400">
                                    Recordarme
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="btn-primary w-full justify-center"
                            >
                                {processing ? 'Entrando...' : 'Entrar'}
                            </button>
                        </form>

                        <p className="text-center text-sm text-zinc-500 mt-4">
                            ¿Sin cuenta?{' '}
                            <Link href="/register" className="text-purple-400 hover:text-purple-300">
                                Regístrate
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
