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
