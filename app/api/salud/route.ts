import { NextRequest, NextResponse } from "next/server";
import { leerTokenSesion } from "../../../lib/session";
import { supabaseServidor } from "../../../lib/supabase-server";

const CONFIG: Record<
  string,
  { tabla: string; campos: string[]; marca: string }
> = {
  historial: {
    tabla: "tb_historial_medico",
    campos: [
      "fecha",
      "tipo",
      "diagnostico",
      "tratamiento",
      "profesional",
      "establecimiento",
      "observaciones",
    ],
    marca: "observaciones",
  },
  medicamentos: {
    tabla: "tb_medicamentos",
    campos: [
      "nombre",
      "dosis",
      "frecuencia",
      "fecha_inicio",
      "fecha_fin",
      "indicaciones",
    ],
    marca: "indicaciones",
  },
  vacunas: {
    tabla: "tb_vacunas",
    campos: [
      "nombre",
      "dosis",
      "fecha_aplicacion",
      "proxima_fecha",
      "establecimiento",
      "lote",
    ],
    marca: "lote",
  },
  examenes: {
    tabla: "tb_examenes",
    campos: ["nombre", "fecha", "resultado_resumen", "proximo_control"],
    marca: "resultado_resumen",
  },
  signos: {
    tabla: "tb_signos_vitales",
    campos: [
      "registrado_en",
      "peso_kg",
      "talla_cm",
      "presion_arterial",
      "temperatura",
      "glucosa",
      "saturacion",
      "pulso",
      "observaciones",
    ],
    marca: "observaciones",
  },
};
const MARCA = /\s*\[REGISTRADO_POR:([0-9a-f-]{36})\]\s*/i;

function sesion(request: NextRequest) {
  return leerTokenSesion(request.cookies.get("familia_sesion")?.value);
}
function marcar(valor: unknown, usuarioId: string) {
  return `${String(valor ?? "")
    .replace(MARCA, "")
    .trim()} [REGISTRADO_POR:${usuarioId}]`.trim();
}
function autorDe(valor: unknown) {
  return String(valor ?? "").match(MARCA)?.[1] ?? null;
}
async function puedeEditar(
  integranteId: string,
  usuarioId: string,
  rol: string,
) {
  if (rol === "administrador") return true;
  const { data } = await supabaseServidor()
    .from("tb_integrantes")
    .select("usuario_id,observaciones")
    .eq("id", integranteId)
    .single();
  return (
    data?.usuario_id === usuarioId ||
    data?.observaciones?.includes("[ASISTENCIA]")
  );
}

export async function GET(request: NextRequest) {
  const actual = sesion(request);
  if (!actual)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const supabase = supabaseServidor();
  const { data, error } = await supabase
    .from("tb_integrantes")
    .select(
      "id,nombre_completo,usuario_id,observaciones,tb_salud_perfil(*),tb_historial_medico(*),tb_medicamentos(*),tb_vacunas(*),tb_examenes(*),tb_signos_vitales(*)",
    )
    .order("nombre_completo");
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: usuarios } = await supabase
    .from("tb_integrantes")
    .select("usuario_id,nombre_completo")
    .not("usuario_id", "is", null);
  const nombres = new Map(
    (usuarios ?? []).map((u) => [u.usuario_id, u.nombre_completo]),
  );
  const enriquecidos = (data ?? []).map((persona) => {
    const copia: Record<string, unknown> = { ...persona };
    Object.entries(CONFIG).forEach(([seccion, config]) => {
      const relacion = `tb_${seccion === "historial" ? "historial_medico" : seccion === "signos" ? "signos_vitales" : seccion}`;
      copia[relacion] = ((persona as Record<string, any>)[relacion] ?? []).map(
        (registro: Record<string, unknown>) => {
          const autorId = autorDe(registro[config.marca]);
          return {
            ...registro,
            [config.marca]: String(registro[config.marca] ?? "")
              .replace(MARCA, "")
              .trim(),
            autor_id: autorId,
            autor_nombre: autorId
              ? (nombres.get(autorId) ?? "Usuario familiar")
              : "Registro anterior",
          };
        },
      );
    });
    return copia;
  });
  return NextResponse.json({
    integrantes: enriquecidos,
    usuarioId: actual.usuarioId,
    rol: actual.rol,
  });
}

function prepararValores(
  cuerpo: Record<string, any>,
  config: { campos: string[] },
  integranteId: string,
) {
  const valores: Record<string, unknown> = { integrante_id: integranteId };
  config.campos.forEach((campo) => {
    valores[campo] = cuerpo[campo] || null;
  });
  if (cuerpo.seccion === "medicamentos" && cuerpo.frecuencia_horas)
    valores.frecuencia = `Cada ${cuerpo.frecuencia_horas} horas`;
  if (
    cuerpo.seccion === "medicamentos" &&
    !valores.fecha_fin &&
    cuerpo.fecha_inicio
  ) {
    const fin = new Date(`${cuerpo.fecha_inicio}T00:00:00`);
    if (cuerpo.duracion_dias)
      fin.setDate(fin.getDate() + Number(cuerpo.duracion_dias));
    else if (cuerpo.repeticiones && cuerpo.frecuencia_horas)
      fin.setHours(
        fin.getHours() +
          Number(cuerpo.repeticiones) * Number(cuerpo.frecuencia_horas),
      );
    if (cuerpo.duracion_dias || cuerpo.repeticiones)
      valores.fecha_fin = fin.toISOString().slice(0, 10);
  }
  if (
    cuerpo.seccion === "vacunas" &&
    !valores.proxima_fecha &&
    cuerpo.proxima_cantidad
  ) {
    const proxima = new Date(
      `${cuerpo.fecha_aplicacion || new Date().toISOString().slice(0, 10)}T00:00:00`,
    );
    cuerpo.proxima_unidad === "semanas"
      ? proxima.setDate(proxima.getDate() + Number(cuerpo.proxima_cantidad) * 7)
      : proxima.setMonth(proxima.getMonth() + Number(cuerpo.proxima_cantidad));
    valores.proxima_fecha = proxima.toISOString().slice(0, 10);
  }
  return valores;
}

export async function POST(request: NextRequest) {
  const actual = sesion(request);
  if (!actual)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const cuerpo = await request.json();
  const integranteId = String(cuerpo.integrante_id ?? "");
  if (
    !integranteId ||
    !(await puedeEditar(integranteId, actual.usuarioId, actual.rol))
  )
    return NextResponse.json(
      { error: "No tienes permiso para editar esta información" },
      { status: 403 },
    );
  const supabase = supabaseServidor();
  if (cuerpo.seccion === "perfil") {
    const valores = {
      integrante_id: integranteId,
      tipo_sangre: cuerpo.tipo_sangre || null,
      seguro_medico: cuerpo.seguro_medico || null,
      alergias: cuerpo.alergias || null,
      enfermedades_relevantes: cuerpo.enfermedades_relevantes || null,
      medicacion_habitual: cuerpo.medicacion_habitual || null,
      medico_referencia: cuerpo.medico_referencia || null,
    };
    const { error } = await supabase
      .from("tb_salud_perfil")
      .upsert(valores, { onConflict: "integrante_id" });
    return error
      ? NextResponse.json({ error: error.message }, { status: 500 })
      : NextResponse.json({ guardado: true });
  }
  const config = CONFIG[cuerpo.seccion];
  if (!config)
    return NextResponse.json(
      { error: "Tipo de registro inválido" },
      { status: 400 },
    );
  const requeridos: Record<string, string[]> = {
    historial: ["fecha", "diagnostico", "tratamiento"],
    medicamentos: ["nombre"],
    vacunas: ["nombre", "fecha_aplicacion"],
    examenes: ["nombre", "fecha"],
    signos: ["registrado_en"],
  };
  if (
    requeridos[cuerpo.seccion]?.some(
      (campo) => !String(cuerpo[campo] ?? "").trim(),
    )
  )
    return NextResponse.json(
      { error: "Completa todos los campos marcados con *" },
      { status: 400 },
    );
  const valores = prepararValores(cuerpo, config, integranteId);
  valores[config.marca] = marcar(valores[config.marca], actual.usuarioId);
  const { error } = await supabase.from(config.tabla).insert(valores);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (cuerpo.seccion === "historial" && Array.isArray(cuerpo.medicamentos)) {
    const medicamentos = cuerpo.medicamentos
      .filter((m: Record<string, string>) => m.nombre)
      .map((m: Record<string, string>) => ({
        integrante_id: integranteId,
        nombre: m.nombre,
        dosis: m.dosis || null,
        frecuencia: m.frecuencia || null,
        fecha_inicio: cuerpo.fecha,
        indicaciones: marcar(
          m.indicaciones || "Registrado desde historial médico",
          actual.usuarioId,
        ),
      }));
    if (medicamentos.length)
      await supabase.from("tb_medicamentos").insert(medicamentos);
  }
  return NextResponse.json({ guardado: true }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const actual = sesion(request);
  if (!actual)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const cuerpo = await request.json();
  const config = CONFIG[cuerpo.seccion];
  if (!config || !cuerpo.id)
    return NextResponse.json({ error: "Registro inválido" }, { status: 400 });
  const supabase = supabaseServidor();
  const { data: existente } = await supabase
    .from(config.tabla)
    .select("*")
    .eq("id", cuerpo.id)
    .single();
  if (
    !existente ||
    !(await puedeEditar(existente.integrante_id, actual.usuarioId, actual.rol))
  )
    return NextResponse.json(
      { error: "No tienes permiso para editar este registro" },
      { status: 403 },
    );
  const valores = prepararValores(cuerpo, config, existente.integrante_id);
  delete valores.integrante_id;
  valores[config.marca] = marcar(
    valores[config.marca],
    autorDe(existente[config.marca]) ?? actual.usuarioId,
  );
  const { error } = await supabase
    .from(config.tabla)
    .update(valores)
    .eq("id", cuerpo.id);
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json({ guardado: true });
}

export async function DELETE(request: NextRequest) {
  const actual = sesion(request);
  if (!actual)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const cuerpo = await request.json();
  const config = CONFIG[cuerpo.seccion];
  if (!config || !cuerpo.id)
    return NextResponse.json({ error: "Registro inválido" }, { status: 400 });
  const supabase = supabaseServidor();
  const { data: existente } = await supabase
    .from(config.tabla)
    .select("*")
    .eq("id", cuerpo.id)
    .single();
  const autorId = existente ? autorDe(existente[config.marca]) : null;
  if (actual.rol !== "administrador" && autorId !== actual.usuarioId)
    return NextResponse.json(
      { error: "Solo puedes eliminar registros creados por ti" },
      { status: 403 },
    );
  const { error } = await supabase
    .from(config.tabla)
    .delete()
    .eq("id", cuerpo.id);
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json({ eliminado: true });
}
