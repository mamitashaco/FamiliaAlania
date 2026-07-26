-- Datos iniciales de prueba. La contraseña inicial de cada usuario es su código.
do $$
declare
  v_admin uuid;
  v_carlos uuid;
  v_maria uuid;
  v_jorge uuid;
begin
  select id into v_admin from tb_usuarios where codigo = '12345678';
  if v_admin is null then v_admin := fn_crear_usuario('12345678', 'administrador'); end if;

  select id into v_carlos from tb_usuarios where codigo = '20000001';
  if v_carlos is null then
    insert into tb_usuarios(codigo, clave_hash, rol)
    values ('20000001', extensions.crypt('20000001', extensions.gen_salt('bf')), 'integrante')
    returning id into v_carlos;
  end if;

  select id into v_maria from tb_usuarios where codigo = '20000002';
  if v_maria is null then
    insert into tb_usuarios(codigo, clave_hash, rol)
    values ('20000002', extensions.crypt('20000002', extensions.gen_salt('bf')), 'integrante')
    returning id into v_maria;
  end if;

  select id into v_jorge from tb_usuarios where codigo = '20000003';
  if v_jorge is null then
    insert into tb_usuarios(codigo, clave_hash, rol)
    values ('20000003', extensions.crypt('20000003', extensions.gen_salt('bf')), 'integrante')
    returning id into v_jorge;
  end if;

  insert into tb_integrantes(usuario_id,nombre_completo,dni,fecha_nacimiento,lugar_nacimiento,estado_civil,telefono,correo_electronico,departamento,provincia,distrito,direccion_actual)
  values
    (v_admin,'Rosa Elena Alania Quispe','10000001','1958-07-24','Huancayo','Casada','999 100 101','rosa@example.com','Lima','Lima','Santiago de Surco','Av. Los Álamos 245'),
    (v_carlos,'Carlos Alberto Alania Soto','10000002','1956-03-18','Huancayo','Casado','999 100 102','carlos@example.com','Lima','Lima','Santiago de Surco','Av. Los Álamos 245'),
    (v_maria,'María Fernanda Alania','10000003','1984-11-06','Lima','Casada','999 100 103','maria@example.com','Arequipa','Arequipa','Yanahuara','Calle Misti 118'),
    (v_jorge,'Jorge Luis Alania','10000004','1987-02-12','Lima','Soltero','999 100 104','jorge@example.com','Cusco','Cusco','Wanchaq','Jr. Túpac 372')
  on conflict (usuario_id) do update set
    nombre_completo = excluded.nombre_completo,
    telefono = excluded.telefono,
    departamento = excluded.departamento,
    actualizado_en = now();
end $$;
