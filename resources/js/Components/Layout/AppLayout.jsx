import { Link, usePage } from '@inertiajs/react'
import { useState } from 'react'

const NAV_ITEMS = {
    admin: [
        { href: '/manage/games', label: 'Juegos', icon: '🎮' },
        { href: '/admin/users', label: 'Usuarios', icon: '👥' },
        { href: '/play', label: 'Ver como jugador', icon: '👁️' },
    ],
    manager: [
        { href: '/manage/games', label: 'Mis Juegos', icon: '🎮' },
        { href: '/play', label: 'Ver plataforma', icon: '👁️' },
    ],
    player: [
        { href: '/play', label: 'Juegos', icon: '🎮' },
        { href: '/play/history', label: 'Mi historial', icon: '📊' },
    ],
}

export default function AppLayout({ children, title }) {
    const { auth, flash } = usePage().props
    const [menuOpen, setMenuOpen] = useState(false)

    const navItems = NAV_ITEMS[auth.user?.role] ?? []
    const roleLabel = { admin: 'Admin', manager: 'Gestor', player: 'Jugador' }[auth.user?.role]

    return (
        <div className="min-h-screen flex flex-col">
            {/* ── Navbar ── */}
            <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/play" className="flex items-center gap-2 font-bold text-lg tracking-tight">
                        <span className="text-2xl">🎮</span>
                        <span className="text-white">Game<span className="text-purple-400">CRM</span></span>
                    </Link>

                    {/* Nav desktop */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <span className="mr-1.5">{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Usuario */}
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:block text-xs text-zinc-500">
                            {auth.user?.name}
                            <span className="ml-1.5 px-1.5 py-0.5 bg-purple-900/50 text-purple-400 rounded text-[10px] font-mono uppercase">
                                {roleLabel}
                            </span>
                        </span>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="text-xs text-zinc-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
                        >
                            Salir
                        </Link>
                    </div>
                </div>
            </header>

            {/* ── Flash messages ── */}
            {flash?.success && (
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-4">
                    <div className="flex items-center gap-2 px-4 py-3 bg-emerald-900/30 border border-emerald-800 rounded-lg text-emerald-400 text-sm">
                        <span>✓</span> {flash.success}
                    </div>
                </div>
            )}
            {flash?.error && (
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-4">
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
                        <span>✕</span> {flash.error}
                    </div>
                </div>
            )}

            {/* ── Contenido ── */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                {title && (
                    <h1 className="text-2xl font-bold text-white mb-6">{title}</h1>
                )}
                {children}
            </main>

            {/* ── Footer ── */}
            <footer className="border-t border-zinc-800 py-4 text-center text-xs text-zinc-600">
                GameCRM — Plataforma de juegos
            </footer>
        </div>
    )
}
