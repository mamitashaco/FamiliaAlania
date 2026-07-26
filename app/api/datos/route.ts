import { NextRequest, NextResponse } from "next/server";
import { leerTokenSesion } from "../../../lib/session";
import { supabaseServidor } from "../../../lib/supabase-server";

const COOKIE = "familia_sesion";

function obtenerSesion(request: NextRequest) {
  return leerTokenSesion(request.cookies.get(COOKIE)?.value);
}

export async function GET(request: NextRequest) {
  const sesion = obtenerSesion(request);
  if (!sesion) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const supabase = supabaseServidor();
  const { data: integrantes, error } = await supabase
    .from("tb_integrantes")
    .select("*,tb_informacion_laboral(*),tb_salud_perfil(*),tb_cuentas_financieras(*),tb_contactos_emergencia(*),tb_fechas_importantes(*)")
    .order("nombre_completo");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const conEdad = integrantes?.map((integrante) => {
    if (!integrante.fecha_nacimiento) return { ...integrante, edad: null };
    const nacimiento = new Date(`${integrante.fecha_nacimiento}T00:00:00`);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    if (hoy.getMonth() < nacimiento.getMonth() || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate())) edad--;
    return { ...integrante, edad };
  });
  const { data: usuarios } = sesion.rol === "administrador"
    ? await supabase.from("tb_usuarios").select("id,codigo")
    : { data: [] };
  const codigos = new Map((usuarios ?? []).map((u) => [u.id, u.codigo.trim()]));
  const datos = conEdad?.map((integrante) => ({
    ...integrante,
    codigo_acceso: sesion.rol === "administrador" && integrante.usuario_id ? codigos.get(integrante.usuario_id) ?? null : null,
  }));
  return NextResponse.json({ integrantes: datos, usuarioId: sesion.usuarioId, rol: sesion.rol });
}

export async function POST(request: NextRequest) {
  const sesion = obtenerSesion(request);
  if (!sesion) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const cuerpo = await request.json();
  const nombre = String(cuerpo.nombre_completo ?? "").trim();
  const parentesco = String(cuerpo.parentesco ?? "").trim();
  if (!nombre || (sesion.rol !== "administrador" && !parentesco)) {
    return NextResponse.json({ error: "Nombre completo y parentesco son obligatorios" }, { status: 400 });
  }

  const supabase = supabaseServidor();
  const { data: creador } = await supabase.from("tb_integrantes").select("nombre_completo").eq("usuario_id", sesion.usuarioId).maybeSingle();
  const { data, error } = await supabase
    .from("tb_integrantes")
    .insert({ nombre_completo: nombre, observaciones: parentesco ? `Parentesco con ${creador?.nombre_completo ?? "usuario"}: ${parentesco}` : null })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const sesion = obtenerSesion(request);
  if (!sesion) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const cuerpo = await request.json();
  const id = String(cuerpo.id ?? "");
  if (!id) return NextResponse.json({ error: "Ficha inválida" }, { status: 400 });

  const supabase = supabaseServidor();
  if (cuerpo.accion === "configuracion") {
    if (sesion.rol !== "administrador") return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    const nombre = String(cuerpo.nombre_completo ?? "").trim();
    const codigo = String(cuerpo.codigo ?? "").trim();
    const usuarioId = cuerpo.usuario_id ? String(cuerpo.usuario_id) : "";
    if (!nombre) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    if (usuarioId && !/^\d{8}$/.test(codigo)) {
      return NextResponse.json({ error: "El código debe contener exactamente 8 dígitos" }, { status: 400 });
    }
    if (usuarioId) {
      const { error: errorCodigo } = await supabase.from("tb_usuarios").update({ codigo, actualizado_en: new Date().toISOString() }).eq("id", usuarioId);
      if (errorCodigo) return NextResponse.json({ error: errorCodigo.code === "23505" ? "Ese código ya está asignado" : errorCodigo.message }, { status: 400 });
    }
    const { error: errorNombre } = await supabase.from("tb_integrantes").update({ nombre_completo: nombre, actualizado_en: new Date().toISOString() }).eq("id", id);
    if (errorNombre) return NextResponse.json({ error: errorNombre.message }, { status: 500 });
    return NextResponse.json({ guardado: true });
  }
  const { data: integrante } = await supabase
    .from("tb_integrantes")
    .select("usuario_id")
    .eq("id", id)
    .single();
  const puedeEditar = sesion.rol === "administrador" || integrante?.usuario_id === sesion.usuarioId;
  if (!puedeEditar) return NextResponse.json({ error: "No tienes permiso para editar esta ficha" }, { status: 403 });

  const personales = {
    nombre_completo: cuerpo.nombre_completo || cuerpo.nombre || null,
    dni: cuerpo.dni || null,
    fecha_nacimiento: cuerpo.fecha_nacimiento || null,
    lugar_nacimiento: cuerpo.lugar_nacimiento || null,
    estado_civil: cuerpo.estado_civil || null,
    telefono: cuerpo.telefono || null,
    correo_electronico: cuerpo.correo_electronico || null,
    departamento: cuerpo.departamento || null,
    provincia: cuerpo.provincia || null,
    distrito: cuerpo.distrito || null,
    direccion_actual: cuerpo.direccion_actual || null,
    observaciones: cuerpo.observaciones || null,
    actualizado_en: new Date().toISOString(),
  };
  const { error: errorPersonal } = await supabase.from("tb_integrantes").update(personales).eq("id", id);
  if (errorPersonal) return NextResponse.json({ error: errorPersonal.message }, { status: 500 });

  const relaciones: Array<[string, Record<string, unknown>]> = [
    ["tb_informacion_laboral", {
      integrante_id: id, empresa: cuerpo.empresa || null, cargo: cuerpo.cargo || null,
      direccion_trabajo: cuerpo.direccion_trabajo || null, telefono_laboral: cuerpo.telefono_laboral || null,
    }],
    ["tb_salud_perfil", {
      integrante_id: id, tipo_sangre: cuerpo.tipo_sangre || null, seguro_medico: cuerpo.seguro_medico || null,
      alergias: cuerpo.alergias || null, enfermedades_relevantes: cuerpo.enfermedades_relevantes || null,
      medicacion_habitual: cuerpo.medicacion_habitual || null, medico_referencia: cuerpo.medico_referencia || null,
    }],
  ];
  for (const [tabla, valores] of relaciones) {
    await supabase.from(tabla).delete().eq("integrante_id", id);
    const { error } = await supabase.from(tabla).insert(valores);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const cuentas = Array.isArray(cuerpo.cuentas) ? cuerpo.cuentas.filter((x: Record<string, string>) => x.banco_principal || x.tipo_cuenta || x.observaciones) : [];
  await supabase.from("tb_cuentas_financieras").delete().eq("integrante_id", id);
  if (cuentas.length) {
    const { error } = await supabase.from("tb_cuentas_financieras").insert(cuentas.map((x: Record<string, string>) => ({
      integrante_id: id, banco_principal: x.banco_principal || null, tipo_cuenta: x.tipo_cuenta || null, observaciones: x.observaciones || null,
    })));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const contactos = Array.isArray(cuerpo.contactos) ? cuerpo.contactos.filter((x: Record<string, string>) => x.nombre || x.telefono) : [];
  await supabase.from("tb_contactos_emergencia").delete().eq("integrante_id", id);
  if (contactos.length) {
    const { error } = await supabase.from("tb_contactos_emergencia").insert(contactos.map((x: Record<string, string>, i: number) => ({
      integrante_id: id, nombre: x.nombre || "Sin nombre", relacion: x.relacion || null, telefono: x.telefono || "", prioridad: i + 1,
    })));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const fechasEntrada = Array.isArray(cuerpo.fechas) ? cuerpo.fechas.filter((x: Record<string, string>) => x.titulo && x.valor) : [];
  type FechaGuardada = { titulo: string; tipo: string; fecha: string; recurrente_anual: boolean };
  const fechas: FechaGuardada[] = fechasEntrada.map((x: Record<string, string>): FechaGuardada | null => {
    if (x.tipo === "regla") return { titulo: x.titulo, tipo: `regla:${x.valor.trim()}`, fecha: "2000-01-01", recurrente_anual: true };
    if (x.tipo === "anual") {
      const partes = x.valor.match(/^(\d{1,2})\/(\d{1,2})$/);
      if (!partes) return null;
      return { titulo: x.titulo, tipo: "anual", fecha: `2000-${partes[2].padStart(2, "0")}-${partes[1].padStart(2, "0")}`, recurrente_anual: true };
    }
    return { titulo: x.titulo, tipo: "completa", fecha: x.valor, recurrente_anual: false };
  }).filter((x: FechaGuardada | null): x is FechaGuardada => x !== null);
  await supabase.from("tb_fechas_importantes").delete().eq("integrante_id", id);
  if (fechas.length) {
    const { error } = await supabase.from("tb_fechas_importantes").insert(fechas.map((x) => ({ integrante_id: id, ...x })));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ guardado: true });
}
