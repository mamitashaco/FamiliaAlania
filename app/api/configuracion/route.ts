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
  const { data: integrantes, error } = await supabase.from("tb_integrantes").select("id,usuario_id,nombre_completo").order("nombre_completo");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: usuarios } = await supabase.from("tb_usuarios").select("id,codigo,activo,rol");
  const porId = new Map((usuarios ?? []).map((u) => [u.id, u]));
  return NextResponse.json({ integrantes: integrantes?.map((i) => ({ ...i, codigo: i.usuario_id ? porId.get(i.usuario_id)?.codigo?.trim() ?? "" : "", activo: i.usuario_id ? porId.get(i.usuario_id)?.activo : false })) });
}

export async function PATCH(request: NextRequest) {
  if (!sesionAdministrador(request)) return NextResponse.json({ error: "Acceso exclusivo del administrador" }, { status: 403 });
  const { id, nombre_completo, codigo, rol } = await request.json();
  const nombre = String(nombre_completo ?? "").trim();
  const nuevoCodigo = String(codigo ?? "").trim();
  if (!id || !nombre) return NextResponse.json({ error: "El nombre completo es obligatorio" }, { status: 400 });
  if (nuevoCodigo && !/^\d{8}$/.test(nuevoCodigo)) return NextResponse.json({ error: "El código debe tener exactamente 8 dígitos" }, { status: 400 });
  if (rol && !["administrador", "integrante"].includes(rol)) return NextResponse.json({ error: "Rol inválido" }, { status: 400 });

  const supabase = supabaseServidor();
  const { data: integrante, error: errorIntegrante } = await supabase.from("tb_integrantes").update({ nombre_completo: nombre, actualizado_en: new Date().toISOString() }).eq("id", id).select("usuario_id").single();
  if (errorIntegrante) return NextResponse.json({ error: errorIntegrante.message }, { status: 500 });
  if (!integrante.usuario_id) {
    if (!nuevoCodigo) return NextResponse.json({ error: "Ingresa un código de 8 dígitos para crear el acceso" }, { status: 400 });
    const claveHash = await bcrypt.hash(nuevoCodigo, 10);
    const { data: nuevoUsuario, error: errorUsuario } = await supabase.from("tb_usuarios").insert({
      codigo: nuevoCodigo, clave_hash: claveHash, rol: rol ?? "integrante", debe_cambiar_clave: true,
    }).select("id").single();
    if (errorUsuario) return NextResponse.json({ error: errorUsuario.code === "23505" ? "Ese código ya está siendo utilizado" : errorUsuario.message }, { status: 500 });
    const { error: errorVinculo } = await supabase.from("tb_integrantes").update({ usuario_id: nuevoUsuario.id }).eq("id", id);
    if (errorVinculo) return NextResponse.json({ error: errorVinculo.message }, { status: 500 });
    return NextResponse.json({ guardado: true, accesoCreado: true });
  }
  if (integrante.usuario_id && nuevoCodigo) {
    if (rol === "integrante") {
      const { data: usuarioActual } = await supabase.from("tb_usuarios").select("rol").eq("id", integrante.usuario_id).single();
      if (usuarioActual?.rol === "administrador") {
        const { count } = await supabase.from("tb_usuarios").select("id", { count: "exact", head: true }).eq("rol", "administrador").eq("activo", true);
        if ((count ?? 0) <= 1) return NextResponse.json({ error: "Debe existir al menos otro administrador antes de cambiar este rol" }, { status: 400 });
      }
    }
    const { error } = await supabase.from("tb_usuarios").update({ codigo: nuevoCodigo, rol, actualizado_en: new Date().toISOString() }).eq("id", integrante.usuario_id);
    if (error) return NextResponse.json({ error: error.code === "23505" ? "Ese código ya está siendo utilizado" : error.message }, { status: 500 });
  }
  return NextResponse.json({ guardado: true });
}
