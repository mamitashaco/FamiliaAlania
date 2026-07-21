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

-- En producción: activar RLS y crear políticas que permitan SELECT a usuarios activos,
-- UPDATE/INSERT solo al propietario del registro y acceso total al administrador.
