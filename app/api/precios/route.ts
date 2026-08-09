import { NextRequest, NextResponse } from "next/server";
import { leerTokenSesion } from "../../../lib/session";
import { supabaseServidor } from "../../../lib/supabase-server";

const COOKIE = "familia_sesion";

function sesion(request: NextRequest) {
  return leerTokenSesion(request.cookies.get(COOKIE)?.value);
}

export async function GET(request: NextRequest) {
  if (!sesion(request))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await supabaseServidor()
    .from("tb_precios")
    .select("id,precio,costo_unitario,registrado_en,tb_productos(descripcion,categoria,presentacion),tb_tiendas(nombre)")
    .order("registrado_en", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ precios: data ?? [] });
}

export async function POST(request: NextRequest) {
  const actual = sesion(request);
  if (!actual)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const cuerpo = await request.json();
  const descripcion = String(cuerpo.descripcion ?? "").trim();
  const categoria = String(cuerpo.categoria ?? "").trim();
  const presentacionTexto = String(cuerpo.presentacion ?? "").trim();
  const cantidadPresentacion = Number(presentacionTexto.replace(",", "."));
  const tienda = String(cuerpo.tienda ?? "").trim();
  const fecha = String(cuerpo.fecha ?? "").trim();
  const precio = Number(cuerpo.precio);
  if (
    !fecha ||
    !descripcion ||
    !categoria ||
    !tienda ||
    !Number.isFinite(precio) ||
    precio <= 0 ||
    !presentacionTexto ||
    !Number.isFinite(cantidadPresentacion) ||
    cantidadPresentacion <= 0
  )
    return NextResponse.json({ error: "Completa todos los campos obligatorios" }, { status: 400 });

  const supabase = supabaseServidor();
  let { data: producto } = await supabase
    .from("tb_productos")
    .select("id")
    .ilike("descripcion", descripcion)
    .limit(1)
    .maybeSingle();
  if (!producto) {
    const resultado = await supabase.from("tb_productos").insert({
      descripcion,
      categoria,
      presentacion: presentacionTexto,
    }).select("id").single();
    if (resultado.error)
      return NextResponse.json({ error: resultado.error.message }, { status: 500 });
    producto = resultado.data;
  } else {
    await supabase.from("tb_productos").update({
      categoria,
      presentacion: String(cantidadPresentacion),
    }).eq("id", producto.id);
  }

  let { data: tiendaBd } = await supabase
    .from("tb_tiendas")
    .select("id")
    .ilike("nombre", tienda)
    .limit(1)
    .maybeSingle();
  if (!tiendaBd) {
    const resultado = await supabase.from("tb_tiendas").insert({ nombre: tienda }).select("id").single();
    if (resultado.error)
      return NextResponse.json({ error: resultado.error.message }, { status: 500 });
    tiendaBd = resultado.data;
  }

  const { error } = await supabase.from("tb_precios").insert({
    producto_id: producto.id,
    tienda_id: tiendaBd.id,
    precio,
    costo_unitario: Number((precio / cantidadPresentacion).toFixed(4)),
    registrado_por: actual.usuarioId,
    registrado_en: `${fecha}T12:00:00-05:00`,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ guardado: true }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const actual = sesion(request);
  if (!actual) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const cuerpo = await request.json();
  const supabase = supabaseServidor();
  if (cuerpo.accion === "categoria") {
    const anterior = String(cuerpo.categoria_actual ?? "").trim();
    const nueva = String(cuerpo.categoria_nueva ?? "").trim();
    if (!anterior || !nueva) return NextResponse.json({ error: "Indica la categoría" }, { status: 400 });
    const { error } = await supabase.from("tb_productos").update({ categoria: nueva }).eq("categoria", anterior);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ guardado: true });
  }
  const id = String(cuerpo.id ?? "");
  const tienda = String(cuerpo.tienda ?? "").trim();
  const fecha = String(cuerpo.fecha ?? "").trim();
  if (!id || !tienda || !fecha)
    return NextResponse.json({ error: "Fecha y tienda son obligatorias" }, { status: 400 });
  const { data: precio } = await supabase.from("tb_precios").select("registrado_por").eq("id", id).single();
  if (actual.rol !== "administrador" && precio?.registrado_por !== actual.usuarioId)
    return NextResponse.json({ error: "Solo puedes editar tus registros" }, { status: 403 });
  let { data: tiendaBd } = await supabase.from("tb_tiendas").select("id").ilike("nombre", tienda).limit(1).maybeSingle();
  if (!tiendaBd) {
    const creada = await supabase.from("tb_tiendas").insert({ nombre: tienda }).select("id").single();
    if (creada.error) return NextResponse.json({ error: creada.error.message }, { status: 500 });
    tiendaBd = creada.data;
  }
  const { error } = await supabase.from("tb_precios").update({
    tienda_id: tiendaBd.id,
    registrado_en: `${fecha}T12:00:00-05:00`,
  }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ guardado: true });
}

export async function DELETE(request: NextRequest) {
  const actual = sesion(request);
  if (!actual) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await request.json();
  const supabase = supabaseServidor();
  const { data } = await supabase.from("tb_precios").select("registrado_por").eq("id", id).single();
  if (actual.rol !== "administrador" && data?.registrado_por !== actual.usuarioId)
    return NextResponse.json({ error: "Solo puedes eliminar tus registros" }, { status: 403 });
  const { error } = await supabase.from("tb_precios").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ eliminado: true });
}
