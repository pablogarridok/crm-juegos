import { Head, useForm, router } from '@inertiajs/react'
import { useState } from 'react'
import AppLayout from '@/Components/Layout/AppLayout'

const ROLE_BADGE = {
    admin:   'bg-red-900/40 text-red-400 border-red-800',
    manager: 'bg-purple-900/40 text-purple-400 border-purple-800',
    player:  'bg-zinc-800 text-zinc-400 border-zinc-700',
}

export default function UsersIndex({ users, roles }) {
    const [showCreate, setShowCreate] = useState(false)

    const toggleActive = (user) => {
        router.patch(`/admin/users/${user.id}/toggle-active`, {}, { preserveScroll: true })
    }

    const destroy = (user) => {
        if (confirm(`¿Eliminar al usuario "${user.name}"?`)) {
            router.delete(`/admin/users/${user.id}`, { preserveScroll: true })
        }
    }

    return (
        <AppLayout title="Gestión de Usuarios">
            <Head title="Usuarios" />

            <div className="flex items-center justify-between mb-6">
                <p className="text-zinc-400 text-sm">{users.total} usuario{users.total !== 1 ? 's' : ''}</p>
                <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
                    {showCreate ? 'Cancelar' : '+ Nuevo usuario'}
                </button>
            </div>

            {/* Formulario de creación */}
            {showCreate && (
                <div className="card mb-6">
                    <h3 className="font-bold text-white mb-4">Crear usuario</h3>
                    <CreateUserForm roles={roles} onDone={() => setShowCreate(false)} />
                </div>
            )}

            {/* Tabla */}
            <div className="card overflow-hidden p-0">
                <table className="w-full text-sm">
                    <thead className="border-b border-zinc-800">
                        <tr className="text-left text-zinc-500 text-xs uppercase tracking-wider">
                            <th className="px-6 py-3">Usuario</th>
                            <th className="px-6 py-3">Rol</th>
                            <th className="px-6 py-3 hidden sm:table-cell">Estado</th>
                            <th className="px-6 py-3 hidden md:table-cell">Registro</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {users.data.map((user) => (
                            <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-medium text-white">{user.name}</p>
                                    <p className="text-zinc-500 text-xs">{user.email}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <RoleSelector user={user} roles={roles} />
                                </td>
                                <td className="px-6 py-4 hidden sm:table-cell">
                                    {user.is_active ? (
                                        <span className="badge-published">Activo</span>
                                    ) : (
                                        <span className="badge-archived">Inactivo</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell text-zinc-500 text-xs font-mono">
                                    {new Date(user.created_at).toLocaleDateString('es-ES')}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => toggleActive(user)}
                                            className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-zinc-700"
                                        >
                                            {user.is_active ? 'Desactivar' : 'Activar'}
                                        </button>
                                        <button
                                            onClick={() => destroy(user)}
                                            className="text-xs text-red-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-zinc-700"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {users.last_page > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
                        <p className="text-xs text-zinc-500">Página {users.current_page} de {users.last_page}</p>
                    </div>
                )}
            </div>
        </AppLayout>
    )
}

// ── Selector de rol inline ─────────────────────────────────────────────────────
function RoleSelector({ user, roles }) {
    const { data, setData, patch, processing } = useForm({ role_id: user.role_id })

    const handleChange = (e) => {
        const newRoleId = e.target.value
        setData('role_id', newRoleId)
        patch(`/admin/users/${user.id}/role`, { data: { role_id: newRoleId }, preserveScroll: true })
    }

    const roleClass = ROLE_BADGE[user.role?.name] ?? ROLE_BADGE.player

    return (
        <select
            value={data.role_id}
            onChange={handleChange}
            disabled={processing}
            className={`text-xs px-2 py-1 rounded-full border bg-transparent cursor-pointer focus:outline-none ${roleClass}`}
        >
            {roles.map(r => (
                <option key={r.id} value={r.id} className="bg-zinc-900 text-zinc-100">
                    {r.display_name}
                </option>
            ))}
        </select>
    )
}

// ── Formulario de creación ─────────────────────────────────────────────────────
function CreateUserForm({ roles, onDone }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '', email: '', password: '', role_id: roles.find(r => r.name === 'player')?.id ?? '',
    })

    const submit = (e) => {
        e.preventDefault()
        post('/admin/users', {
            onSuccess: () => { reset(); onDone() },
            preserveScroll: true,
        })
    }

    return (
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label className="form-label">Nombre</label>
                <input className="form-input" value={data.name}
                    onChange={e => setData('name', e.target.value)} />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={data.email}
                    onChange={e => setData('email', e.target.value)} />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
                <label className="form-label">Contraseña</label>
                <input type="password" className="form-input" value={data.password}
                    onChange={e => setData('password', e.target.value)} />
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>
            <div>
                <label className="form-label">Rol</label>
                <select className="form-input" value={data.role_id}
                    onChange={e => setData('role_id', e.target.value)}>
                    {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.display_name}</option>
                    ))}
                </select>
            </div>
            <div className="sm:col-span-2 flex gap-3">
                <button type="submit" disabled={processing} className="btn-primary">
                    {processing ? 'Creando...' : 'Crear usuario'}
                </button>
                <button type="button" onClick={onDone} className="btn-secondary">Cancelar</button>
            </div>
        </form>
    )
}
