# Evaluación de Proyectos (Vite + React + Supabase)

App para que los jurados califiquen las exposiciones de proyectos **por ficha**.

## Correr en local
```bash
npm install
npm run dev
```
Abre http://localhost:5173

## Primer uso (una sola vez)
1. En Supabase → **Authentication → Users → Add user → Create new user**
   con el correo `dipamato@gmail.com`, una contraseña y **Auto Confirm User** marcado.
2. Entra a `/admin` con ese correo y contraseña.

Para autorizar a otra administradora, agrega su correo en la tabla `administradores`
y créale el usuario igual que en el paso 1.

## Antes de cada evento
- Si Supabase pausó el proyecto por inactividad: panel de Supabase → **Restore project**.
- `/admin` → crear evento → pestañas **Datos**, **Rúbrica**, **Fichas y proyectos**, **Evaluadores**.
- Marcar **Evento activo** y compartir el QR/enlace desde **Compartir**.
- En **Datos** marca **Publicar resultados** para que cualquiera vea el podio en `/resultados` (solo promedios).
- En la pestaña **Resultados** se ve el podio y el ranking por ficha (se actualiza solo cada 20 s) y se exporta a Excel.
- Los jurados abren el enlace (`/evento/<id>`), eligen su nombre, la ficha y califican.

## Despliegue
Sitio estático: `npm run build` genera `dist/`. Incluye `vercel.json` y `public/_redirects` (Netlify)
para que las rutas funcionen al recargar.
