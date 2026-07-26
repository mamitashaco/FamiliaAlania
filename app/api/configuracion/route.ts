import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { leerTokenSesion } from "../../../lib/session";
import { supabaseServidor } from "../../../lib/supabase-server";

function sesionAdministrador(request: NextRequest) {
  const sesion = leerTokenSesion(request.cookies.get("familia_sesion")?.value);
  return sesion?.rol === "administrador" ? sesion : null;
}

export async function GET(request: NextRequest) {
  if (!sesionAdministrador(request)) return NextResponse.json({ error: "Acceso exclusivo del administrador" }, { status: 403 });
  const supabase = supabaseServidor();
  const { data: integrantes, error } = await supabase.from("tb_integrantes").select("id,usuario_id,nombre_completo,observaciones").order("nombre_completo");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: usuarios } = await supabase.from("tb_usuarios").select("id,codigo,activo,rol");
  const { data: accesos } = await supabase
    .from("tb_historial_accesos")
    .select("id,usuario_id,codigo,exitoso,direccion_ip,dispositivo,navegador,creado_en")
    .order("creado_en", { ascending: false })
    .limit(100);
  const porId = new Map((usuarios ?? []).map((u) => [u.id, u]));
  const nombres = new Map((integrantes ?? []).map((i) => [i.usuario_id, i.nombre_completo]));
  return NextResponse.json({
    integrantes: integrantes?.map((i) => ({ ...i, requiere_asistencia: i.observaciones?.includes("[ASISTENCIA]") ?? false, codigo: i.usuario_id ? porId.get(i.usuario_id)?.codigo?.trim() ?? "" : "", activo: i.usuario_id ? porId.get(i.usuario_id)?.activo : false })),
    accesos: (accesos ?? []).map((a) => ({ ...a, nombre: a.usuario_id ? nombres.get(a.usuario_id) ?? "Usuario" : "Intento sin identificar" })),
  });
}

export async function PATCH(request: NextRequest) {
  if (!sesionAdministrador(request)) return NextResponse.json({ error: "Acceso exclusivo del administrador" }, { status: 403 });
  const { id, nombre_completo, codigo, rol, restablecer, requiere_asistencia } = await request.json();
  const nombre = String(nombre_completo ?? "").trim();
  const nuevoCodigo = String(codigo ?? "").trim();
  if (!id || !nombre) return NextResponse.json({ error: "El nombre completo es obligatorio" }, { status: 400 });
  if (nuevoCodigo && !/^\d{8}$/.test(nuevoCodigo)) return NextResponse.json({ error: "El código debe tener exactamente 8 dígitos" }, { status: 400 });
  if (rol && !["administrador", "integrante"].includes(rol)) return NextResponse.json({ error: "Rol inválido" }, { status: 400 });

  const supabase = supabaseServidor();
  const { data: integrantePrevio } = await supabase.from("tb_integrantes").select("observaciones").eq("id", id).single();
  const observacionesLimpias = String(integrantePrevio?.observaciones ?? "").replace(/\s*\[ASISTENCIA\]\s*/g, " ").trim();
  const observaciones = requiere_asistencia ? `[ASISTENCIA]${observacionesLimpias ? ` ${observacionesLimpias}` : ""}` : observacionesLimpias || null;
  const { data: integrante, error: errorIntegrante } = await supabase.from("tb_integrantes").update({ nombre_completo: nombre, observaciones, actualizado_en: new Date().toISOString() }).eq("id", id).select("usuario_id").single();
  if (errorIntegrante) return NextResponse.json({ error: errorIntegrante.message }, { status: 500 });
  if (!integrante.usuario_id) {
    if (!nuevoCodigo) return NextResponse.json({ guardado: true });
    const claveHash = (await bcrypt.hash(nuevoCodigo, 10)).replace(/^\$2b\$/, "$2a$");
    const { data: nuevoUsuario, error: errorUsuario } = await supabase.from("tb_usuarios").insert({
      codigo: nuevoCodigo, clave_hash: claveHash, rol: rol ?? "integrante", debe_cambiar_clave: true,
    }).select("id").single();
    if (errorUsuario) return NextResponse.json({ error: errorUsuario.code === "23505" ? "Ese código ya está siendo utilizado" : errorUsuario.message }, { status: 500 });
    const { error: errorVinculo } = await supabase.from("tb_integrantes").update({ usuario_id: nuevoUsuario.id }).eq("id", id);
    if (errorVinculo) return NextResponse.json({ error: errorVinculo.message }, { status: 500 });
    return NextResponse.json({ guardado: true, accesoCreado: true });
  }
  if (integrante.usuario_id && nuevoCodigo) {
    const { data: usuarioExistente } = await supabase.from("tb_usuarios").select("codigo,rol").eq("id", integrante.usuario_id).single();
    if (rol === "integrante") {
      if (usuarioExistente?.rol === "administrador") {
        const { count } = await supabase.from("tb_usuarios").select("id", { count: "exact", head: true }).eq("rol", "administrador").eq("activo", true);
        if ((count ?? 0) <= 1) return NextResponse.json({ error: "Debe existir al menos otro administrador antes de cambiar este rol" }, { status: 400 });
      }
    }
    const codigoCambio = usuarioExistente?.codigo?.trim() !== nuevoCodigo;
    const actualizacion: Record<string, unknown> = { codigo: nuevoCodigo, rol, actualizado_en: new Date().toISOString() };
    if (codigoCambio || restablecer) {
      actualizacion.clave_hash = (await bcrypt.hash(nuevoCodigo, 10)).replace(/^\$2b\$/, "$2a$");
      actualizacion.debe_cambiar_clave = true;
    }
    const { error } = await supabase.from("tb_usuarios").update(actualizacion).eq("id", integrante.usuario_id);
    if (error) return NextResponse.json({ error: error.code === "23505" ? "Ese código ya está siendo utilizado" : error.message }, { status: 500 });
  }
  return NextResponse.json({ guardado: true, claveRestablecida: Boolean(restablecer) });
}
