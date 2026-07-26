import { NextRequest, NextResponse } from "next/server";
import { leerTokenSesion } from "../../../lib/session";
import { supabaseServidor } from "../../../lib/supabase-server";

function sesion(request: NextRequest) {
  return leerTokenSesion(request.cookies.get("familia_sesion")?.value);
}

async function puedeEditar(integranteId: string, usuarioId: string, rol: string) {
  if (rol === "administrador") return true;
  const { data } = await supabaseServidor().from("tb_integrantes").select("usuario_id").eq("id", integranteId).single();
  return data?.usuario_id === usuarioId;
}

export async function GET(request: NextRequest) {
  const actual = sesion(request);
  if (!actual) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { data, error } = await supabaseServidor().from("tb_integrantes").select(
    "id,nombre_completo,usuario_id,tb_salud_perfil(*),tb_historial_medico(*),tb_medicamentos(*),tb_vacunas(*),tb_examenes(*),tb_signos_vitales(*)",
  ).order("nombre_completo");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ integrantes: data, usuarioId: actual.usuarioId, rol: actual.rol });
}

export async function POST(request: NextRequest) {
  const actual = sesion(request);
  if (!actual) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const cuerpo = await request.json();
  const integranteId = String(cuerpo.integrante_id ?? "");
  if (!integranteId || !(await puedeEditar(integranteId, actual.usuarioId, actual.rol))) {
    return NextResponse.json({ error: "No tienes permiso para editar esta información" }, { status: 403 });
  }
  const supabase = supabaseServidor();
  if (cuerpo.tipo === "perfil") {
    const valores = {
      integrante_id: integranteId, tipo_sangre: cuerpo.tipo_sangre || null, seguro_medico: cuerpo.seguro_medico || null,
      alergias: cuerpo.alergias || null, enfermedades_relevantes: cuerpo.enfermedades_relevantes || null,
      medicacion_habitual: cuerpo.medicacion_habitual || null, medico_referencia: cuerpo.medico_referencia || null,
    };
    const { error } = await supabase.from("tb_salud_perfil").upsert(valores, { onConflict: "integrante_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ guardado: true });
  }

  const configuracion: Record<string, { tabla: string; campos: string[] }> = {
    historial: { tabla: "tb_historial_medico", campos: ["fecha", "tipo", "diagnostico", "tratamiento", "profesional", "establecimiento", "observaciones"] },
    medicamentos: { tabla: "tb_medicamentos", campos: ["nombre", "dosis", "frecuencia", "fecha_inicio", "fecha_fin", "indicaciones"] },
    vacunas: { tabla: "tb_vacunas", campos: ["nombre", "dosis", "fecha_aplicacion", "proxima_fecha", "establecimiento", "lote"] },
    examenes: { tabla: "tb_examenes", campos: ["nombre", "fecha", "resultado_resumen", "proximo_control"] },
    signos: { tabla: "tb_signos_vitales", campos: ["registrado_en", "peso_kg", "talla_cm", "presion_arterial", "temperatura", "glucosa", "saturacion", "pulso", "observaciones"] },
  };
  const config = configuracion[cuerpo.tipo];
  if (!config) return NextResponse.json({ error: "Tipo de registro inválido" }, { status: 400 });
  const valores: Record<string, unknown> = { integrante_id: integranteId };
  config.campos.forEach((campo) => { valores[campo] = cuerpo[campo] || null; });
  if (cuerpo.tipo === "medicamentos" && !valores.fecha_fin && cuerpo.duracion_dias && cuerpo.fecha_inicio) {
    const fin = new Date(`${cuerpo.fecha_inicio}T00:00:00`); fin.setDate(fin.getDate() + Number(cuerpo.duracion_dias));
    valores.fecha_fin = fin.toISOString().slice(0, 10);
  }
  if (cuerpo.tipo === "vacunas" && !valores.proxima_fecha && cuerpo.proxima_cantidad) {
    const proxima = new Date(`${cuerpo.fecha_aplicacion || new Date().toISOString().slice(0, 10)}T00:00:00`);
    cuerpo.proxima_unidad === "semanas" ? proxima.setDate(proxima.getDate() + Number(cuerpo.proxima_cantidad) * 7) : proxima.setMonth(proxima.getMonth() + Number(cuerpo.proxima_cantidad));
    valores.proxima_fecha = proxima.toISOString().slice(0, 10);
  }
  const { error } = await supabase.from(config.tabla).insert(valores);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ guardado: true }, { status: 201 });
}
