import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(undefined) // undefined = cargando
  const [esAdmin, setEsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!sesion) { setEsAdmin(false); return }
    supabase.rpc('es_admin').then(({ data }) => setEsAdmin(!!data))
  }, [sesion])

  const salir = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ sesion, esAdmin, cargando: sesion === undefined, salir }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
