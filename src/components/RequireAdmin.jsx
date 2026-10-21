import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

export default function RequireAdmin({ children }) {
  const { sesion, esAdmin, cargando, salir } = useAuth()
  if (cargando) return <p className="text-gray-500">Cargando…</p>
  if (!sesion) return <Navigate to="/admin/login" replace />
  if (!esAdmin) return (
    <div className="tarjeta max-w-md">
      <p className="mb-3">La cuenta <b>{sesion.user.email}</b> no tiene permisos de administración.</p>
      <button className="btn-secundario" onClick={salir}>Cerrar sesión</button>
    </div>
  )
  return children
}
