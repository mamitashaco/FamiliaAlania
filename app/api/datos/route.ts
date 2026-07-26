import { NextRequest, NextResponse } from "next/server";
import { leerTokenSesion } from "../../../lib/session";
import { supabaseServidor } from "../../../lib/supabase-server";

export async function GET(request: NextRequest) {
  const sesion = leerTokenSesion(request.cookies.get("familia_sesion")?.value);
  if (!sesion) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const supabase = supabaseServidor();
  const { data: integrantes, error } = await supabase
    .from("vw_integrantes_con_edad")
    .select("id,nombre_completo,edad,departamento,usuario_id")
    .order("nombre_completo");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ integrantes, usuarioId: sesion.usuarioId, rol: sesion.rol });
}
