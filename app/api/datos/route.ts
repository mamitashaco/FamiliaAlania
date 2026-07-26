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
  return NextResponse.json({ integrantes: conEdad, usuarioId: sesion.usuarioId, rol: sesion.rol });
}

export async function POST(request: NextRequest) {
  const sesion = obtenerSesion(request);
  if (!sesion) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (sesion.rol !== "administrador") {
    return NextResponse.json({ error: "Solo el administrador puede crear integrantes" }, { status: 403 });
  }

  const cuerpo = await request.json();
  const nombre = String(cuerpo.nombre_completo ?? "").trim();
  const parentesco = String(cuerpo.parentesco ?? "").trim();
  if (!nombre || !parentesco) {
    return NextResponse.json({ error: "Nombre completo y parentesco son obligatorios" }, { status: 400 });
  }

  const supabase = supabaseServidor();
  const { data, error } = await supabase
    .from("tb_integrantes")
    .insert({ nombre_completo: nombre, observaciones: `Parentesco: ${parentesco}` })
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
    ["tb_cuentas_financieras", {
      integrante_id: id, banco_principal: cuerpo.banco_principal || null,
      tipo_cuenta: cuerpo.tipo_cuenta || null, observaciones: cuerpo.observaciones_financieras || null,
    }],
  ];
  for (const [tabla, valores] of relaciones) {
    await supabase.from(tabla).delete().eq("integrante_id", id);
    const { error } = await supabase.from(tabla).insert(valores);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("tb_contactos_emergencia").delete().eq("integrante_id", id);
  if (cuerpo.contacto_nombre || cuerpo.contacto_telefono) {
    const { error } = await supabase.from("tb_contactos_emergencia").insert({
      integrante_id: id, nombre: cuerpo.contacto_nombre || "Sin nombre",
      relacion: cuerpo.contacto_relacion || null, telefono: cuerpo.contacto_telefono || "",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("tb_fechas_importantes").delete().eq("integrante_id", id);
  if (cuerpo.fecha_titulo && cuerpo.fecha_importante) {
    const { error } = await supabase.from("tb_fechas_importantes").insert({
      integrante_id: id, titulo: cuerpo.fecha_titulo, fecha: cuerpo.fecha_importante,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ guardado: true });
}
