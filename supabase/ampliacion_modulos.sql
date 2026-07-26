-- Ejecutar una sola vez en el editor SQL de Supabase.
create table if not exists tb_historial_accesos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references tb_usuarios(id) on delete set null,
  codigo char(8),
  exitoso boolean not null default false,
  direccion_ip text,
  dispositivo text,
  navegador text,
  creado_en timestamptz not null default now()
);

create table if not exists tb_eventos_compromisos (
  id uuid primary key default gen_random_uuid(),
  viaje_evento_id uuid not null references tb_viajes_eventos(id) on delete cascade,
  integrante_id uuid not null references tb_integrantes(id) on delete cascade,
  monto_comprometido numeric(12,2) not null check (monto_comprometido > 0),
  monto_abonado numeric(12,2) not null default 0 check (monto_abonado >= 0),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique(viaje_evento_id, integrante_id)
);

create table if not exists tb_configuracion_sistema (
  clave text primary key,
  valor text,
  actualizado_por uuid references tb_usuarios(id),
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_tb_historial_accesos_fecha
  on tb_historial_accesos(creado_en desc);
create index if not exists idx_tb_eventos_compromisos_evento
  on tb_eventos_compromisos(viaje_evento_id);

alter table tb_historial_accesos enable row level security;
alter table tb_eventos_compromisos enable row level security;
alter table tb_configuracion_sistema enable row level security;
