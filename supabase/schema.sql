-- Familia Alania · esquema inicial para Supabase/PostgreSQL
-- Todas las tablas usan el prefijo tb_ y nombres en español.
create extension if not exists pgcrypto;

create type rol_usuario as enum ('administrador', 'integrante');

create table tb_usuarios (
  id uuid primary key default gen_random_uuid(),
  codigo char(8) unique not null check (codigo ~ '^[0-9]{8}$'),
  clave_hash text not null,
  rol rol_usuario not null default 'integrante',
  activo boolean not null default true,
  debe_cambiar_clave boolean not null default true,
  tema varchar(20) not null default 'sistema',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table tb_integrantes (
  id uuid primary key default gen_random_uuid(), usuario_id uuid unique references tb_usuarios(id),
  nombre_completo text not null, dni varchar(12) unique, fecha_nacimiento date, lugar_nacimiento text,
  estado_civil varchar(30), telefono varchar(30), correo_electronico text, departamento text,
  provincia text, distrito text, direccion_actual text, foto_url text, observaciones text,
  creado_en timestamptz not null default now(), actualizado_en timestamptz not null default now()
);

create table tb_informacion_laboral (
  id uuid primary key default gen_random_uuid(), integrante_id uuid not null references tb_integrantes(id) on delete cascade,
  empresa text, cargo text, direccion_trabajo text, telefono_laboral varchar(30), vigente boolean default true
);

create table tb_salud_perfil (
  id uuid primary key default gen_random_uuid(), integrante_id uuid unique not null references tb_integrantes(id) on delete cascade,
  tipo_sangre varchar(5), seguro_medico text, alergias text, enfermedades_relevantes text,
  medicacion_habitual text, medico_referencia text, telefono_medico varchar(30)
);

create table tb_historial_medico (
  id uuid primary key default gen_random_uuid(), integrante_id uuid not null references tb_integrantes(id) on delete cascade,
  fecha date not null, tipo varchar(60), diagnostico text, tratamiento text, profesional text, establecimiento text, observaciones text
);
create table tb_medicamentos (
  id uuid primary key default gen_random_uuid(), integrante_id uuid not null references tb_integrantes(id) on delete cascade,
  nombre text not null, dosis text, frecuencia text, fecha_inicio date, fecha_fin date, indicaciones text, activo boolean default true
);
create table tb_vacunas (
  id uuid primary key default gen_random_uuid(), integrante_id uuid not null references tb_integrantes(id) on delete cascade,
  nombre text not null, dosis text, fecha_aplicacion date, proxima_fecha date, establecimiento text, lote text
);
create table tb_examenes (
  id uuid primary key default gen_random_uuid(), integrante_id uuid not null references tb_integrantes(id) on delete cascade,
  nombre text not null, fecha date, resultado_resumen text, archivo_url text, proximo_control date
);
create table tb_signos_vitales (
  id uuid primary key default gen_random_uuid(), integrante_id uuid not null references tb_integrantes(id) on delete cascade,
  registrado_en timestamptz default now(), peso_kg numeric(6,2), talla_cm numeric(6,2), presion_arterial varchar(15),
  temperatura numeric(4,1), glucosa numeric(7,2), saturacion numeric(5,2), pulso smallint, observaciones text
);

create table tb_contactos_emergencia (
  id uuid primary key default gen_random_uuid(), integrante_id uuid not null references tb_integrantes(id) on delete cascade,
  nombre text not null, relacion text, telefono varchar(30) not null, prioridad smallint default 1
);
create table tb_fechas_importantes (
  id uuid primary key default gen_random_uuid(), integrante_id uuid references tb_integrantes(id) on delete cascade,
  titulo text not null, tipo varchar(40), fecha date not null, recurrente_anual boolean default true, recordatorio_dias smallint default 7
);

create table tb_cuentas_financieras (
  id uuid primary key default gen_random_uuid(), integrante_id uuid not null references tb_integrantes(id) on delete cascade,
  banco_principal text, tipo_cuenta text, observaciones text
);
create table tb_movimientos_financieros (
  id uuid primary key default gen_random_uuid(), integrante_id uuid references tb_integrantes(id), tipo varchar(10) check(tipo in ('ingreso','gasto')),
  categoria text, descripcion text not null, monto numeric(12,2) not null, moneda char(3) default 'PEN', fecha date not null, observaciones text
);
create table tb_reportes_financieros (
  id uuid primary key default gen_random_uuid(), titulo text not null, periodo_inicio date, periodo_fin date, resumen text, creado_en timestamptz default now()
);

create table tb_tiendas (id uuid primary key default gen_random_uuid(), nombre text not null, direccion text, distrito text);
create table tb_productos (id uuid primary key default gen_random_uuid(), descripcion text not null, categoria text, presentacion text, marca text);
create table tb_precios (
  id uuid primary key default gen_random_uuid(), producto_id uuid not null references tb_productos(id), tienda_id uuid not null references tb_tiendas(id),
  precio numeric(10,2) not null, costo_unitario numeric(10,4), registrado_por uuid references tb_usuarios(id), registrado_en timestamptz default now()
);
create index idx_tb_precios_producto_fecha on tb_precios(producto_id, registrado_en desc);

create table tb_estudios (
  id uuid primary key default gen_random_uuid(), integrante_id uuid not null references tb_integrantes(id) on delete cascade,
  institucion text, grado text, especialidad text, fecha_inicio date, fecha_fin date, estado text, archivo_url text
);
create table tb_cursos_certificados (
  id uuid primary key default gen_random_uuid(), integrante_id uuid not null references tb_integrantes(id) on delete cascade,
  nombre text not null, institucion text, fecha_emision date, fecha_vencimiento date, codigo_credencial text, archivo_url text
);

create table tb_seguros (
  id uuid primary key default gen_random_uuid(), integrante_id uuid references tb_integrantes(id), tipo text not null, aseguradora text,
  numero_poliza text, inicio_vigencia date, fin_vigencia date, cobertura text, contacto text, telefono text, archivo_url text, estado text
);
create table tb_viajes_eventos (
  id uuid primary key default gen_random_uuid(), titulo text not null, tipo varchar(20), lugar text, fecha_inicio timestamptz,
  fecha_fin timestamptz, descripcion text, presupuesto numeric(12,2), estado text, creado_por uuid references tb_usuarios(id)
);
create table tb_viajes_eventos_integrantes (
  viaje_evento_id uuid references tb_viajes_eventos(id) on delete cascade, integrante_id uuid references tb_integrantes(id) on delete cascade,
  primary key(viaje_evento_id, integrante_id)
);

create table tb_mascotas (
  id uuid primary key default gen_random_uuid(), nombre text not null, especie text, raza text, sexo text, fecha_nacimiento date,
  color text, peso_kg numeric(6,2), microchip text, foto_url text, observaciones text
);
create table tb_historial_veterinario (
  id uuid primary key default gen_random_uuid(), mascota_id uuid not null references tb_mascotas(id) on delete cascade,
  fecha date not null, tipo text, diagnostico text, tratamiento text, veterinario text, clinica text, proximo_control date, archivo_url text
);
create table tb_viviendas (
  id uuid primary key default gen_random_uuid(), nombre text not null, direccion text, departamento text, provincia text, distrito text,
  tipo text, condicion text, observaciones text
);
create table tb_archivos (
  id uuid primary key default gen_random_uuid(), nombre text not null, categoria text, descripcion text, archivo_url text not null,
  tipo_mime text, fecha_documento date, integrante_id uuid references tb_integrantes(id), subido_por uuid references tb_usuarios(id), creado_en timestamptz default now()
);

-- La edad se calcula, no se almacena, para evitar que quede desactualizada.
create view vw_integrantes_con_edad as
select i.*, extract(year from age(current_date, i.fecha_nacimiento))::int as edad from tb_integrantes i;

-- Seguridad y acceso ---------------------------------------------------------
-- La API debe emitir el UUID de tb_usuarios en el claim JWT "sub".
-- Nunca se almacena una contraseña en texto plano: crypt() usa bcrypt.
create or replace function fn_usuario_actual_id()
returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create or replace function fn_es_administrador()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tb_usuarios
    where id = fn_usuario_actual_id() and rol = 'administrador' and activo
  )
$$;

create or replace function fn_crear_usuario(
  p_codigo char(8), p_rol rol_usuario default 'integrante'
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not fn_es_administrador() and exists(select 1 from tb_usuarios) then
    raise exception 'Solo el administrador puede crear usuarios';
  end if;
  insert into tb_usuarios(codigo, clave_hash, rol)
  values (p_codigo, crypt(p_codigo, gen_salt('bf')), p_rol)
  returning id into v_id;
  return v_id;
end $$;

create or replace function fn_validar_acceso(p_codigo char(8), p_clave text)
returns table(usuario_id uuid, rol rol_usuario, debe_cambiar_clave boolean)
language sql security definer set search_path = public as $$
  select id, tb_usuarios.rol, tb_usuarios.debe_cambiar_clave
  from tb_usuarios
  where codigo = p_codigo and activo and clave_hash = crypt(p_clave, clave_hash)
$$;

create or replace function fn_cambiar_clave(p_clave_actual text, p_clave_nueva text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if length(p_clave_nueva) < 8 then raise exception 'La contraseña debe tener al menos 8 caracteres'; end if;
  update tb_usuarios
  set clave_hash = crypt(p_clave_nueva, gen_salt('bf')), debe_cambiar_clave = false, actualizado_en = now()
  where id = fn_usuario_actual_id() and clave_hash = crypt(p_clave_actual, clave_hash);
  if not found then raise exception 'Contraseña actual incorrecta'; end if;
end $$;

create or replace function fn_restablecer_clave(p_usuario_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not fn_es_administrador() then raise exception 'Acceso denegado'; end if;
  update tb_usuarios
  set clave_hash = crypt(codigo, gen_salt('bf')), debe_cambiar_clave = true, actualizado_en = now()
  where id = p_usuario_id;
end $$;

alter table tb_usuarios enable row level security;
alter table tb_integrantes enable row level security;
alter table tb_informacion_laboral enable row level security;
alter table tb_salud_perfil enable row level security;
alter table tb_historial_medico enable row level security;
alter table tb_medicamentos enable row level security;
alter table tb_vacunas enable row level security;
alter table tb_examenes enable row level security;
alter table tb_signos_vitales enable row level security;
alter table tb_contactos_emergencia enable row level security;
alter table tb_fechas_importantes enable row level security;
alter table tb_cuentas_financieras enable row level security;
alter table tb_movimientos_financieros enable row level security;
alter table tb_reportes_financieros enable row level security;
alter table tb_tiendas enable row level security;
alter table tb_productos enable row level security;
alter table tb_precios enable row level security;
alter table tb_estudios enable row level security;
alter table tb_cursos_certificados enable row level security;
alter table tb_seguros enable row level security;
alter table tb_viajes_eventos enable row level security;
alter table tb_viajes_eventos_integrantes enable row level security;
alter table tb_mascotas enable row level security;
alter table tb_historial_veterinario enable row level security;
alter table tb_viviendas enable row level security;
alter table tb_archivos enable row level security;

-- Todos los usuarios activos pueden leer la información familiar.
create policy usuarios_lectura on tb_usuarios for select using (fn_usuario_actual_id() is not null);
create policy integrantes_lectura on tb_integrantes for select using (fn_usuario_actual_id() is not null);
create policy integrantes_edicion on tb_integrantes for update
  using (usuario_id = fn_usuario_actual_id() or fn_es_administrador())
  with check (usuario_id = fn_usuario_actual_id() or fn_es_administrador());
create policy integrantes_admin_crear on tb_integrantes for insert with check (fn_es_administrador());
create policy usuarios_perfil on tb_usuarios for update
  using (id = fn_usuario_actual_id() or fn_es_administrador())
  with check (id = fn_usuario_actual_id() or fn_es_administrador());

-- Las tablas ligadas a un integrante heredan la propiedad de su perfil.
do $$
declare t text;
begin
  foreach t in array array[
    'tb_informacion_laboral','tb_salud_perfil','tb_historial_medico','tb_medicamentos',
    'tb_vacunas','tb_examenes','tb_signos_vitales','tb_contactos_emergencia',
    'tb_fechas_importantes','tb_cuentas_financieras','tb_estudios',
    'tb_cursos_certificados','tb_seguros'
  ] loop
    execute format('create policy %I on %I for select using (fn_usuario_actual_id() is not null)', t || '_lectura', t);
    execute format(
      'create policy %I on %I for all using (fn_es_administrador() or exists(select 1 from tb_integrantes i where i.id = integrante_id and i.usuario_id = fn_usuario_actual_id())) with check (fn_es_administrador() or exists(select 1 from tb_integrantes i where i.id = integrante_id and i.usuario_id = fn_usuario_actual_id()))',
      t || '_propietario', t
    );
  end loop;
end $$;

-- Datos compartidos: lectura familiar; escritura del administrador o autor.
create policy movimientos_lectura on tb_movimientos_financieros for select using (fn_usuario_actual_id() is not null);
create policy movimientos_propietario on tb_movimientos_financieros for all
  using (fn_es_administrador() or exists(select 1 from tb_integrantes i where i.id = integrante_id and i.usuario_id = fn_usuario_actual_id()))
  with check (fn_es_administrador() or exists(select 1 from tb_integrantes i where i.id = integrante_id and i.usuario_id = fn_usuario_actual_id()));
create policy precios_lectura on tb_precios for select using (fn_usuario_actual_id() is not null);
create policy precios_autor on tb_precios for all
  using (registrado_por = fn_usuario_actual_id() or fn_es_administrador())
  with check (registrado_por = fn_usuario_actual_id() or fn_es_administrador());
create policy archivos_lectura on tb_archivos for select using (fn_usuario_actual_id() is not null);
create policy archivos_autor on tb_archivos for all
  using (subido_por = fn_usuario_actual_id() or fn_es_administrador())
  with check (subido_por = fn_usuario_actual_id() or fn_es_administrador());
create policy viajes_lectura on tb_viajes_eventos for select using (fn_usuario_actual_id() is not null);
create policy viajes_autor on tb_viajes_eventos for all
  using (creado_por = fn_usuario_actual_id() or fn_es_administrador())
  with check (creado_por = fn_usuario_actual_id() or fn_es_administrador());

-- Catálogos y registros comunes administrados por el rol administrador.
do $$
declare t text;
begin
  foreach t in array array[
    'tb_reportes_financieros','tb_tiendas','tb_productos','tb_viajes_eventos_integrantes',
    'tb_mascotas','tb_historial_veterinario','tb_viviendas'
  ] loop
    execute format('create policy %I on %I for select using (fn_usuario_actual_id() is not null)', t || '_lectura', t);
    execute format('create policy %I on %I for all using (fn_es_administrador()) with check (fn_es_administrador())', t || '_admin', t);
  end loop;
end $$;
