import { NextRequest, NextResponse } from "next/server";
import { crearTokenSesion, leerTokenSesion } from "../../../lib/session";
import { supabaseServidor } from "../../../lib/supabase-server";

const COOKIE = "familia_sesion";

export async function GET(request: NextRequest) {
  const sesion = leerTokenSesion(request.cookies.get(COOKIE)?.value);
  return NextResponse.json({ autenticado: Boolean(sesion), sesion });
}

export async function POST(request: NextRequest) {
  const { codigo, clave } = await request.json();
  if (!/^\d{8}$/.test(codigo ?? "") || typeof clave !== "string") {
    return NextResponse.json({ error: "Datos de acceso inválidos" }, { status: 400 });
  }

  const { data, error } = await supabaseServidor().rpc("fn_validar_acceso", {
    p_codigo: codigo,
    p_clave: clave,
  });
  const usuario = data?.[0];
  if (error || !usuario) {
    return NextResponse.json({ error: "Código o contraseña incorrectos" }, { status: 401 });
  }

  const response = NextResponse.json({
    autenticado: true,
    rol: usuario.rol,
    debeCambiarClave: usuario.debe_cambiar_clave,
  });
  response.cookies.set(COOKIE, crearTokenSesion({
    usuarioId: usuario.usuario_id,
    rol: usuario.rol,
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ autenticado: false });
  response.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
