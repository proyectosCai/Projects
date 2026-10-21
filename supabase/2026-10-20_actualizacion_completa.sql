-- =====================================================================
-- Secciones de rúbrica y evaluadores por sección (General, Técnica, ...)
-- Ejecutar completo en Supabase → SQL Editor.
-- Es seguro con los datos actuales: los eventos existentes quedan con
-- una sola sección "General" y los evaluadores califican todo.
-- =====================================================================

-- Secciones del evento (orden en que se muestran)
alter table public.eventos add column if not exists secciones jsonb not null default '["General"]'::jsonb;

-- Secciones que califica cada evaluador (NULL = todas)
alter table public.evaluadores add column if not exists secciones text[];
grant select (secciones) on public.evaluadores to anon;

-- Sección de la pregunta i (0-based). La rúbrica admite textos sueltos
-- (formato anterior) u objetos {"texto": "...", "seccion": "..."}.
create or replace function public.seccion_pregunta(p_rubrica jsonb, p_i int, p_secciones jsonb)
returns text language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(p_rubrica -> p_i) = 'object'
              then coalesce(nullif(p_rubrica -> p_i ->> 'seccion', ''), p_secciones ->> 0, 'General')
              else coalesce(p_secciones ->> 0, 'General') end;
$$;

-- Registrar/corregir calificación: cada jurado responde SOLO las preguntas de sus secciones
create or replace function public.registrar_calificacion(
  p_evento uuid, p_proyecto uuid, p_evaluador uuid,
  p_puntajes int[], p_observacion text default null
) returns int
language plpgsql security definer set search_path = ''
as $$
declare
  v_ev public.eventos%rowtype;
  v_secs text[];
  v_n int;
  v_asignadas int := 0;
  v_total int := 0;
  v_p int;
begin
  select * into v_ev from public.eventos where id = p_evento and activo;
  if not found then raise exception 'El evento no está activo'; end if;

  select secciones into v_secs from public.evaluadores where id = p_evaluador and evento_id = p_evento;
  if not found then raise exception 'Evaluador no válido'; end if;

  if not exists (select 1 from public.proyectos p join public.fichas f on f.id = p.ficha_id
                 where p.id = p_proyecto and f.evento_id = p_evento) then
    raise exception 'Proyecto no válido';
  end if;

  v_n := jsonb_array_length(v_ev.rubrica);
  if coalesce(array_length(p_puntajes, 1), 0) <> v_n then
    raise exception 'La rúbrica cambió: recarga la página';
  end if;

  for i in 1..v_n loop
    v_p := p_puntajes[i];
    if v_secs is null or public.seccion_pregunta(v_ev.rubrica, i - 1, v_ev.secciones) = any(v_secs) then
      v_asignadas := v_asignadas + 1;
      if v_p is null then raise exception 'Faltan preguntas por calificar'; end if;
      if v_p < v_ev.escala_min or v_p > v_ev.escala_max then raise exception 'Puntaje fuera de la escala'; end if;
      v_total := v_total + v_p;
    elsif v_p is not null then
      raise exception 'Hay preguntas que no le corresponden a este evaluador';
    end if;
  end loop;

  if v_asignadas = 0 then raise exception 'Este evaluador no tiene preguntas asignadas en la rúbrica'; end if;

  insert into public.calificaciones (evento_id, proyecto_id, evaluador_id, puntajes, total, observacion, updated_at)
  values (p_evento, p_proyecto, p_evaluador, p_puntajes, v_total, p_observacion, now())
  on conflict (proyecto_id, evaluador_id)
  do update set puntajes = excluded.puntajes, total = excluded.total,
                observacion = excluded.observacion, updated_at = now();
  return v_total;
end;
$$;

-- Puntaje de cada proyecto = suma de los promedios por pregunta
-- (si todos los jurados califican todo, es igual al promedio de los totales)
create or replace function public.puntajes_evento(p_evento uuid)
returns table (proyecto_id uuid, ficha_id uuid, n_jurados int, promedio numeric, por_pregunta numeric[])
language sql stable security definer set search_path = '' as $$
  select c.proyecto_id, p.ficha_id, count(*)::int,
    (select round(sum(x.a), 2) from (
        select avg(c2.puntajes[i]) a
        from public.calificaciones c2, generate_series(1, jsonb_array_length(e.rubrica)) i
        where c2.proyecto_id = c.proyecto_id group by i) x),
    array(
        select round(avg(c2.puntajes[i]), 2)
        from generate_series(1, jsonb_array_length(e.rubrica)) i
        left join public.calificaciones c2 on c2.proyecto_id = c.proyecto_id
        group by i order by i)
  from public.calificaciones c
  join public.proyectos p on p.id = c.proyecto_id
  join public.eventos e on e.id = c.evento_id
  where c.evento_id = p_evento
  group by c.proyecto_id, p.ficha_id, e.rubrica;
$$;
revoke all on function public.puntajes_evento(uuid) from public, anon, authenticated;

-- Resultados públicos (misma forma que antes, nueva fórmula)
create or replace function public.resultados_publicos(p_evento uuid)
returns table (proyecto_id uuid, n_jurados int, promedio numeric, por_pregunta numeric[])
language sql stable security definer set search_path = '' as $$
  select pe.proyecto_id, pe.n_jurados, pe.promedio, pe.por_pregunta
  from public.puntajes_evento(p_evento) pe
  where exists (select 1 from public.eventos e where e.id = p_evento and e.resultados_publicos);
$$;

-- Certificados: el puesto de ganador usa la misma fórmula
create or replace function public.mis_certificados(p_documento text)
returns table (codigo text, tipo text, nombre text, documento text, proyecto text, ficha text, programa text, puesto int,
               evento text, fecha date, horas int, entidad text, firmante text, cargo text, firma_url text, emitido_at timestamptz)
language plpgsql volatile security definer set search_path = '' as $$
declare v_doc text := regexp_replace(coalesce(p_documento, ''), '[^0-9A-Za-z]', '', 'g');
begin
  if length(v_doc) < 5 then return; end if;

  insert into public.certificados (codigo, evento_id, tipo, documento, nombre, proyecto_id, proyecto, ficha, programa)
  select public.generar_codigo_cert(), e.id, 'participacion', v_doc, i.nombre, p.id, p.nombre, f.numero, f.programa
  from public.integrantes i
  join public.proyectos p on p.id = i.proyecto_id
  join public.fichas f on f.id = p.ficha_id
  join public.eventos e on e.id = f.evento_id
  where regexp_replace(i.documento, '[^0-9A-Za-z]', '', 'g') = v_doc and e.certificados_disponibles
  on conflict do nothing;

  insert into public.certificados (codigo, evento_id, tipo, documento, nombre, proyecto_id, proyecto, ficha, programa, puesto)
  select public.generar_codigo_cert(), r.evento_id, 'ganador', v_doc, i.nombre, r.proyecto_id, p.nombre, f.numero, f.programa, r.puesto
  from (
    select e.id evento_id, pe.proyecto_id,
           rank() over (partition by pe.ficha_id order by pe.promedio desc)::int puesto
    from public.eventos e
    cross join lateral public.puntajes_evento(e.id) pe
    where e.certificados_disponibles
  ) r
  join public.proyectos p on p.id = r.proyecto_id
  join public.fichas f on f.id = p.ficha_id
  join public.integrantes i on i.proyecto_id = r.proyecto_id
  where r.puesto <= 3 and regexp_replace(i.documento, '[^0-9A-Za-z]', '', 'g') = v_doc
  on conflict do nothing;

  insert into public.certificados (codigo, evento_id, tipo, documento, nombre)
  select public.generar_codigo_cert(), e.id, 'jurado', v_doc, ev.nombre
  from public.evaluadores ev
  join public.eventos e on e.id = ev.evento_id
  where regexp_replace(coalesce(ev.documento, ''), '[^0-9A-Za-z]', '', 'g') = v_doc and e.certificados_disponibles
  on conflict do nothing;

  return query
  select c.codigo, c.tipo, c.nombre, c.documento, c.proyecto, c.ficha, c.programa, c.puesto,
         e.nombre, e.fecha, e.cert_horas, e.cert_entidad, e.cert_firmante, e.cert_cargo, e.cert_firma_url, c.emitido_at
  from public.certificados c
  join public.eventos e on e.id = c.evento_id
  where c.documento = v_doc and e.certificados_disponibles
  order by e.fecha desc nulls last, c.tipo, c.puesto nulls last;
end $$;
revoke execute on function public.mis_certificados(text) from public, anon, authenticated;
-- =====================================================================
-- Asignación de jurados a fichas/grupos o a proyectos (ponencias) específicos.
-- Requiere haber ejecutado antes 2026-10-19_secciones_rubrica.sql.
-- Seguro con los datos actuales: los jurados existentes quedan "sin asignación"
-- y siguen pudiendo calificar todo el evento.
-- =====================================================================

-- NULL o vacío = todas. Si hay algo asignado, el jurado califica los proyectos de
-- esas fichas MÁS los proyectos sueltos asignados.
alter table public.evaluadores add column if not exists fichas uuid[];
alter table public.evaluadores add column if not exists proyectos uuid[];
grant select (fichas, proyectos) on public.evaluadores to anon;

create or replace function public.jurado_asignado(p_evaluador uuid, p_proyecto uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((
    select (coalesce(cardinality(ev.fichas), 0) = 0 and coalesce(cardinality(ev.proyectos), 0) = 0)
           or p.ficha_id = any(coalesce(ev.fichas, '{}'))
           or p.id = any(coalesce(ev.proyectos, '{}'))
    from public.evaluadores ev, public.proyectos p
    where ev.id = p_evaluador and p.id = p_proyecto), false);
$$;
grant execute on function public.jurado_asignado(uuid, uuid) to anon, authenticated;

create or replace function public.registrar_calificacion(
  p_evento uuid, p_proyecto uuid, p_evaluador uuid,
  p_puntajes int[], p_observacion text default null
) returns int
language plpgsql security definer set search_path = ''
as $$
declare
  v_ev public.eventos%rowtype;
  v_secs text[];
  v_n int;
  v_asignadas int := 0;
  v_total int := 0;
  v_p int;
begin
  select * into v_ev from public.eventos where id = p_evento and activo;
  if not found then raise exception 'El evento no está activo'; end if;

  select secciones into v_secs from public.evaluadores where id = p_evaluador and evento_id = p_evento;
  if not found then raise exception 'Evaluador no válido'; end if;

  if not exists (select 1 from public.proyectos p join public.fichas f on f.id = p.ficha_id
                 where p.id = p_proyecto and f.evento_id = p_evento) then
    raise exception 'Proyecto no válido';
  end if;

  if not public.jurado_asignado(p_evaluador, p_proyecto) then
    raise exception 'Este proyecto no está asignado a este jurado';
  end if;

  v_n := jsonb_array_length(v_ev.rubrica);
  if coalesce(array_length(p_puntajes, 1), 0) <> v_n then
    raise exception 'La rúbrica cambió: recarga la página';
  end if;

  for i in 1..v_n loop
    v_p := p_puntajes[i];
    if v_secs is null or public.seccion_pregunta(v_ev.rubrica, i - 1, v_ev.secciones) = any(v_secs) then
      v_asignadas := v_asignadas + 1;
      if v_p is null then raise exception 'Faltan preguntas por calificar'; end if;
      if v_p < v_ev.escala_min or v_p > v_ev.escala_max then raise exception 'Puntaje fuera de la escala'; end if;
      v_total := v_total + v_p;
    elsif v_p is not null then
      raise exception 'Hay preguntas que no le corresponden a este evaluador';
    end if;
  end loop;

  if v_asignadas = 0 then raise exception 'Este evaluador no tiene preguntas asignadas en la rúbrica'; end if;

  insert into public.calificaciones (evento_id, proyecto_id, evaluador_id, puntajes, total, observacion, updated_at)
  values (p_evento, p_proyecto, p_evaluador, p_puntajes, v_total, p_observacion, now())
  on conflict (proyecto_id, evaluador_id)
  do update set puntajes = excluded.puntajes, total = excluded.total,
                observacion = excluded.observacion, updated_at = now();
  return v_total;
end;
$$;
