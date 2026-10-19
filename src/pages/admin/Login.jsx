import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase, mensajeError } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'

export default function Login() {
  const { sesion } = useAuth()
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (sesion) return <Navigate to="/admin" replace />

  const entrar = async (ev) => {
    ev.preventDefault()
    setEnviando(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: clave })
    if (error) setError(mensajeError(error))
    setEnviando(false)
  }

  return (
    <form onSubmit={entrar} className="tarjeta mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-bold">Ingreso administración</h1>
      <div>
        <label className="etiqueta">Correo</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="etiqueta">Contraseña</label>
        <input className="input" type="password" value={clave} onChange={(e) => setClave(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primario w-full" disabled={enviando}>{enviando ? 'Ingresando…' : 'Ingresar'}</button>
    </form>
  )
}
