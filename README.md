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

## Trabajos y certificados
- **Subir trabajo** (`/subir`): el aprendiz usa el código de 6 letras de su proyecto (ver/imprimir en *Fichas y proyectos*). Requiere "Recibir trabajos" activo.
- **Certificados** (`/certificados`): se buscan por número de documento. Registra integrantes en *Fichas y proyectos → 👥 Integrantes* (`Nombre ; documento`) y el documento de los jurados en *Evaluadores*. Requiere "Certificados disponibles" activo.
- **Verificación** (`/verificar/CODIGO`): página pública a la que lleva el QR del certificado.
- La subida usa la Edge Function `trabajo-subida` (ya desplegada en Supabase).

## Otras instituciones
- **Evento organizado por otra institución:** en *Datos → Certificados* sube sus logos (hasta 4), elige el color y hasta 2 firmas.
- **Proyectos de varias instituciones:** en *Fichas y proyectos* cada ficha puede ser "Ficha" o "Grupo" y llevar su centro/institución y logo; aparece en la evaluación, los resultados, el Excel y el certificado.

## Secciones de rúbrica (jurados generales y técnicos)
- Ejecuta una vez `supabase/2026-10-19_secciones_rubrica.sql` en Supabase → SQL Editor.
- En *Rúbrica* crea secciones (ej. General, Técnica) y ubica cada pregunta.
- En *Evaluadores* marca qué secciones califica cada jurado (todas marcadas = evalúa todo).
- Puntaje del proyecto = suma de los promedios de cada pregunta.
