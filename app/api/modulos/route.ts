import { NextRequest, NextResponse } from "next/server";
import { leerTokenSesion } from "../../../lib/session";
import { supabaseServidor } from "../../../lib/supabase-server";

const COOKIE = "familia_sesion";
const BUCKET = "documentos-familia";

function sesion(request: NextRequest) {
  return leerTokenSesion(request.cookies.get(COOKIE)?.value);
}

async function integranteActual(usuarioId: string) {
  const { data } = await supabaseServidor()
    .from("tb_integrantes")
    .select("id")
    .eq("usuario_id", usuarioId)
    .maybeSingle();
  return data?.id ?? null;
}

async function subirArchivo(archivo: File, usuarioId: string) {
  const supabase = supabaseServidor();
  const limpio = archivo.name.replace(/[^\w.-]+/g, "-");
  const ruta = `${usuarioId}/${crypto.randomUUID()}-${limpio}`;
  let resultado = await supabase.storage.from(BUCKET).upload(ruta, archivo, {
    contentType: archivo.type || "application/octet-stream",
  });
  if (resultado.error?.message.toLowerCase().includes("bucket")) {
    await supabase.storage.createBucket(BUCKET, { public: false });
    resultado = await supabase.storage.from(BUCKET).upload(ruta, archivo, {
      contentType: archivo.type || "application/octet-stream",
    });
  }
  if (resultado.error) throw new Error(resultado.error.message);
  return ruta;
}

export async function GET(request: NextRequest) {
  const actual = sesion(request);
  if (!actual) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const modulo = request.nextUrl.searchParams.get("modulo");
  const supabase = supabaseServidor();
  let registros: Array<Record<string, unknown>> = [];
  let error: { message: string } | null = null;

  if (modulo === "Finanzas") {
    const r = await supabase.from("tb_movimientos_financieros").select("*,tb_integrantes(nombre_completo)").order("fecha", { ascending: false });
    error = r.error; registros = (r.data ?? []).map((x) => ({
      titulo: x.descripcion, detalle: `${x.tipo} · ${x.categoria ?? "Sin categoría"}`,
      meta: new Date(`${x.fecha}T00:00:00`).toLocaleDateString("es-PE"),
      estado: `S/ ${Number(x.monto).toFixed(2)}`,
      id: x.id, tipo: x.tipo, categoria: x.categoria, descripcion: x.descripcion,
      monto: Number(x.monto), fecha: x.fecha, observaciones: x.observaciones,
      usuario: (Array.isArray(x.tb_integrantes) ? x.tb_integrantes[0] : x.tb_integrantes)?.nombre_completo ?? "Usuario",
    }));
  } else if (modulo === "Seguros") {
    const r = await supabase.from("tb_seguros").select("*,tb_integrantes(nombre_completo)").order("fin_vigencia", { ascending: true });
    error = r.error; registros = await Promise.all((r.data ?? []).map(async (x) => ({
      titulo: x.tipo, detalle: `${x.aseguradora ?? "Sin aseguradora"} · ${x.numero_poliza ?? "Sin póliza"}`,
      meta: x.fin_vigencia ? `Vence ${new Date(`${x.fin_vigencia}T00:00:00`).toLocaleDateString("es-PE")}` : "Sin vencimiento",
      estado: x.estado ?? "Activo", id: x.id, propio: x.integrante_id === await integranteActual(actual.usuarioId),
      autor: (Array.isArray(x.tb_integrantes) ? x.tb_integrantes[0] : x.tb_integrantes)?.nombre_completo ?? "Usuario",
      archivo_url: x.archivo_url,
      aseguradora: x.aseguradora, numero_poliza: x.numero_poliza, cobertura: x.cobertura,
      url: x.archivo_url ? (await supabase.storage.from(BUCKET).createSignedUrl(x.archivo_url, 3600)).data?.signedUrl : null,
    })));
  } else if (modulo === "Viajes, eventos y proyectos") {
    const r = await supabase.from("tb_viajes_eventos").select("*").order("fecha_inicio", { ascending: true });
    error = r.error; registros = (r.data ?? []).map((x) => ({
      titulo: x.titulo, detalle: `${x.tipo ?? "Evento"} · ${x.lugar ?? "Sin lugar"}`,
      meta: x.fecha_inicio ? new Date(x.fecha_inicio).toLocaleDateString("es-PE") : "Sin fecha",
      estado: x.estado ?? "Planificado",
    }));
  } else if (modulo === "Mascotas") {
    const r = await supabase.from("tb_mascotas").select("*").order("nombre");
    error = r.error; registros = (r.data ?? []).map((x) => ({
      titulo: x.nombre, detalle: `${x.especie ?? "Mascota"} · ${x.raza ?? "Sin raza"}`,
      meta: x.fecha_nacimiento ? `Nació ${new Date(`${x.fecha_nacimiento}T00:00:00`).toLocaleDateString("es-PE")}` : "Edad sin registrar",
      estado: x.sexo ?? "Sin registrar",
    }));
  } else if (modulo === "Educación") {
    const { data: integrantes } = await supabase.from("tb_integrantes").select("id,nombre_completo");
    const nombres = new Map((integrantes ?? []).map((x) => [x.id, x.nombre_completo]));
    const propioId = await integranteActual(actual.usuarioId);
    const [estudios, cursos] = await Promise.all([
      supabase.from("tb_estudios").select("*").order("fecha_inicio", { ascending: false }),
      supabase.from("tb_cursos_certificados").select("*").order("fecha_emision", { ascending: false }),
    ]);
    error = estudios.error || cursos.error;
    registros = await Promise.all([
      ...(estudios.data ?? []).map(async (x) => ({
        titulo: x.grado ?? "Estudio", detalle: x.institucion ?? "Sin institución",
        meta: "Estudios", estado: x.estado ?? "Registrado",
        url: x.archivo_url ? (await supabase.storage.from(BUCKET).createSignedUrl(x.archivo_url, 3600)).data?.signedUrl : null,
        id: x.id, tabla: "tb_estudios", integrante_id: x.integrante_id,
        autor: nombres.get(x.integrante_id) ?? "Usuario", propio: x.integrante_id === propioId,
      })),
      ...(cursos.data ?? []).map(async (x) => ({
        titulo: x.nombre, detalle: x.institucion ?? "Sin institución",
        meta: x.codigo_credencial ?? "Cursos y certificados", estado: "Documento",
        url: x.archivo_url ? (await supabase.storage.from(BUCKET).createSignedUrl(x.archivo_url, 3600)).data?.signedUrl : null,
        id: x.id, tabla: "tb_cursos_certificados", integrante_id: x.integrante_id,
        autor: nombres.get(x.integrante_id) ?? "Usuario", propio: x.integrante_id === propioId,
      })),
    ]);
  } else if (modulo === "Archivos históricos") {
    const r = await supabase.from("tb_archivos").select("*").order("creado_en", { ascending: false });
    error = r.error; registros = await Promise.all((r.data ?? []).map(async (x) => ({
      titulo: x.nombre, detalle: x.descripcion ?? "Sin descripción",
      meta: x.categoria ?? "Fotografía", estado: "Compartido",
      url: (await supabase.storage.from(BUCKET).createSignedUrl(x.archivo_url, 3600)).data?.signedUrl,
    })));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ registros });
}

export async function POST(request: NextRequest) {
  const actual = sesion(request);
  if (!actual) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const modulo = request.nextUrl.searchParams.get("modulo");
  const form = await request.formData();
  const valor = (nombre: string) => String(form.get(nombre) ?? "").trim();
  const supabase = supabaseServidor();
  const integranteId = await integranteActual(actual.usuarioId);
  let error: { message: string } | null = null;

  if (modulo === "Finanzas") {
    ({ error } = await supabase.from("tb_movimientos_financieros").insert({
      integrante_id: integranteId, tipo: valor("tipo"), categoria: valor("categoria") || null,
      descripcion: valor("descripcion"), monto: Number(valor("monto")), fecha: valor("fecha"),
      observaciones: valor("observaciones") || null,
    }));
  } else if (modulo === "Seguros") {
    const archivo = form.get("archivo");
    const ruta = archivo instanceof File && archivo.size
      ? await subirArchivo(archivo, actual.usuarioId)
      : null;
    ({ error } = await supabase.from("tb_seguros").insert({
      integrante_id: integranteId, tipo: valor("tipo"), aseguradora: valor("aseguradora"),
      numero_poliza: valor("numero_poliza"), inicio_vigencia: valor("fecha_inicio") || null,
      fin_vigencia: valor("fecha_fin") || null, cobertura: valor("cobertura") || null,
      contacto: valor("contacto") || null, telefono: valor("telefono") || null,
      archivo_url: ruta, estado: "Activo",
    }));
  } else if (modulo === "Viajes, eventos y proyectos") {
    ({ error } = await supabase.from("tb_viajes_eventos").insert({
      titulo: valor("titulo"), tipo: valor("tipo"), lugar: valor("lugar") || null,
      fecha_inicio: valor("fecha_inicio") || null, fecha_fin: valor("fecha_fin") || null,
      descripcion: valor("descripcion") || null, presupuesto: Number(valor("presupuesto")) || null,
      estado: "Planificado", creado_por: actual.usuarioId,
    }));
  } else if (modulo === "Mascotas") {
    ({ error } = await supabase.from("tb_mascotas").insert({
      nombre: valor("nombre"), especie: valor("especie"), raza: valor("raza") || null,
      sexo: valor("sexo") || null, fecha_nacimiento: valor("fecha_nacimiento") || null,
      observaciones: valor("observaciones") || null,
    }));
  } else if (modulo === "Educación" || modulo === "Archivos históricos") {
    const archivo = form.get("archivo");
    if (!(archivo instanceof File) || !archivo.size)
      return NextResponse.json({ error: "Selecciona un archivo" }, { status: 400 });
    let ruta: string;
    try { ruta = await subirArchivo(archivo, actual.usuarioId); }
    catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "No se pudo subir" }, { status: 500 }); }
    if (modulo === "Educación") {
      const categoria = valor("categoria");
      if (categoria === "Estudios") {
        ({ error } = await supabase.from("tb_estudios").insert({
          integrante_id: integranteId, institucion: valor("institucion"),
          grado: valor("titulo"), estado: "Registrado", archivo_url: ruta,
        }));
      } else {
        ({ error } = await supabase.from("tb_cursos_certificados").insert({
          integrante_id: integranteId, nombre: valor("titulo"), institucion: valor("institucion"),
          codigo_credencial: categoria, archivo_url: ruta,
        }));
      }
    } else {
      ({ error } = await supabase.from("tb_archivos").insert({
        nombre: valor("titulo"), categoria: "Fotografía", descripcion: valor("descripcion") || null,
        archivo_url: ruta, tipo_mime: archivo.type, integrante_id: integranteId,
        subido_por: actual.usuarioId,
      }));
    }
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ guardado: true }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const actual = sesion(request);
  if (!actual) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const modulo = request.nextUrl.searchParams.get("modulo");
  const cuerpo = await request.json();
  const supabase = supabaseServidor();
  const propioId = await integranteActual(actual.usuarioId);
  const id = String(cuerpo.id ?? "");
  if (!id) return NextResponse.json({ error: "Registro inválido" }, { status: 400 });

  if (modulo === "Educación") {
    const tabla = cuerpo.tabla === "tb_estudios" ? "tb_estudios" : "tb_cursos_certificados";
    const { data } = await supabase.from(tabla).select("integrante_id").eq("id", id).single();
    if (actual.rol !== "administrador" && data?.integrante_id !== propioId)
      return NextResponse.json({ error: "Solo puedes editar tus documentos" }, { status: 403 });
    const valores = tabla === "tb_estudios"
      ? { grado: cuerpo.titulo, institucion: cuerpo.institucion }
      : { nombre: cuerpo.titulo, institucion: cuerpo.institucion };
    const { error } = await supabase.from(tabla).update(valores).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (modulo === "Seguros") {
    const { data } = await supabase.from("tb_seguros").select("integrante_id").eq("id", id).single();
    if (actual.rol !== "administrador" && data?.integrante_id !== propioId)
      return NextResponse.json({ error: "Solo puedes editar tus seguros" }, { status: 403 });
    const { error } = await supabase.from("tb_seguros").update({
      tipo: cuerpo.titulo, aseguradora: cuerpo.aseguradora,
      numero_poliza: cuerpo.numero_poliza, cobertura: cuerpo.cobertura,
    }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ guardado: true });
}
