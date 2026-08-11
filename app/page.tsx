"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Archive, CalendarDays, GraduationCap, HeartPulse, Home as HomeIcon, PawPrint, Plane, ShieldCheck, ShoppingBasket, Users, WalletCards, Stethoscope } from "lucide-react";

type Registro = {
  titulo: string;
  detalle: string;
  meta: string;
  estado?: string;
  fecha?: string;
  precio?: number;
  valor?: number;
  tienda?: string;
  presentacion?: string;
  url?: string;
  [clave: string]: any;
};
type Integrante = {
  id: string;
  usuarioId: string | null;
  iniciales: string;
  nombre: string;
  rol: string;
  edad: string;
  lugar: string;
  codigo: string;
  actualizado_en?: string;
  dni?: string;
  fecha_nacimiento?: string;
  lugar_nacimiento?: string;
  estado_civil?: string;
  telefono?: string;
  correo_electronico?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  direccion_actual?: string;
  observaciones?: string;
  empresa?: string;
  cargo?: string;
  direccion_trabajo?: string;
  telefono_laboral?: string;
  tipo_sangre?: string;
  seguro_medico?: string;
  alergias?: string;
  enfermedades_relevantes?: string;
  medicacion_habitual?: string;
  medico_referencia?: string;
  cuentas: Array<{
    banco_principal: string;
    tipo_cuenta: string;
    observaciones: string;
  }>;
  contactos: Array<{ nombre: string; relacion: string; telefono: string }>;
  fechas: Array<{
    titulo: string;
    tipo: "completa" | "anual" | "regla";
    valor: string;
  }>;
  medicamentos: Array<{
    nombre: string;
    frecuencia: string;
    fecha_inicio: string;
    fecha_fin: string;
    activo: boolean;
  }>;
};

const navegacion = [
  ["Inicio", HomeIcon], ["Salud", HeartPulse], ["Finanzas", WalletCards], ["Precios", ShoppingBasket],
  ["Proyectos y eventos", Plane], ["Integrantes", Users], ["Mascotas", PawPrint], ["Educación", GraduationCap],
  ["Seguros", ShieldCheck], ["Archivos históricos", Archive],
] as const;

const integrantes: Integrante[] = [];

const datos: Record<string, Registro[]> = {};

function relacionUnica(valor: unknown): Record<string, any> {
  if (Array.isArray(valor)) return valor[0] ?? {};
  return valor && typeof valor === "object"
    ? (valor as Record<string, any>)
    : {};
}

function Icono({ children }: { children: React.ReactNode }) {
  return (
    <span className="icono" aria-hidden="true">
      {children}
    </span>
  );
}

function siguienteDiaMes(dia: number, mes: number) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  let fecha = new Date(hoy.getFullYear(), mes - 1, dia);
  if (fecha < hoy) fecha = new Date(hoy.getFullYear() + 1, mes - 1, dia);
  return fecha;
}

function fechaPorRegla(regla: string) {
  const texto = regla
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  const dias = [
    "domingo",
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
  ];
  const mes = meses.findIndex((m) => texto.includes(m));
  const diaSemana = dias.findIndex((d) => texto.includes(d));
  const orden = texto.match(/(1|primer|primero)/)
    ? 1
    : texto.match(/(2|segundo)/)
      ? 2
      : texto.match(/(3|tercer|tercero)/)
        ? 3
        : texto.match(/(4|cuarto)/)
          ? 4
          : 0;
  if (mes < 0 || diaSemana < 0 || !orden) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const calcular = (anio: number) => {
    const primero = new Date(anio, mes, 1);
    const dia = 1 + ((diaSemana - primero.getDay() + 7) % 7) + (orden - 1) * 7;
    return new Date(anio, mes, dia);
  };
  const este = calcular(hoy.getFullYear());
  return este >= hoy ? este : calcular(hoy.getFullYear() + 1);
}

function calcularProximasFechas(personas: Integrante[]) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(hoy);
  limite.setDate(limite.getDate() + 45);
  const eventos: Array<{ titulo: string; detalle: string; fecha: Date }> = [];
  personas.forEach((p) => {
    if (p.fecha_nacimiento) {
      const [, mes, dia] = p.fecha_nacimiento.split("-").map(Number);
      eventos.push({
        titulo: `Cumpleaños de ${p.nombre.split(" ")[0]}`,
        detalle: p.nombre,
        fecha: siguienteDiaMes(dia, mes),
      });
    }
    p.fechas.forEach((f) => {
      let fecha: Date | null = null;
      if (f.tipo === "completa") fecha = new Date(`${f.valor}T00:00:00`);
      if (f.tipo === "anual") {
        const [dia, mes] = f.valor.split("/").map(Number);
        fecha = siguienteDiaMes(dia, mes);
      }
      if (f.tipo === "regla") fecha = fechaPorRegla(f.valor);
      if (fecha && !Number.isNaN(fecha.getTime()))
        eventos.push({
          titulo: f.titulo,
          detalle: f.tipo === "regla" ? f.valor : p.nombre,
          fecha,
        });
    });
  });
  return eventos
    .filter((e) => e.fecha >= hoy && e.fecha <= limite)
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}

export default function Home() {
  const [sesion, setSesion] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [seccion, setSeccion] = useState("Inicio");
  const [oscuro, setOscuro] = useState(false);
  const [buscar, setBuscar] = useState("");
  const [modal, setModal] = useState<string | null>(null);
  const [modalSeccion, setModalSeccion] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const [integrantesBd, setIntegrantesBd] = useState<Integrante[]>([]);
  const [precios, setPrecios] = useState<Registro[]>([]);
  const [registrosModulo, setRegistrosModulo] = useState<Record<string, Registro[]>>({});
  const [proyectosAbiertos, setProyectosAbiertos] = useState(0);
  const [usuarioId, setUsuarioId] = useState("");
  const [rolSesion, setRolSesion] = useState<"administrador" | "integrante">(
    "integrante",
  );
  const [ficha, setFicha] = useState<Integrante | null>(null);
  const [fichaDesdeSalud, setFichaDesdeSalud] = useState(false);
  const [versionSalud, setVersionSalud] = useState(0);
  const [menuCuenta, setMenuCuenta] = useState(false);
  const [accionRapida, setAccionRapida] = useState<"ingreso" | "egreso" | "precio" | "historial" | null>(null);
  const cargasModulo = useRef<Record<string, number>>({});

  useEffect(() => {
    setOscuro(window.localStorage.getItem("familia-alania-tema") === "oscuro");
  }, []);
  useEffect(() => {
    window.localStorage.setItem("familia-alania-tema", oscuro ? "oscuro" : "claro");
  }, [oscuro]);

  function abrirSeccion(nombre: string) {
    setSeccion(nombre);
    cargarModulo(nombre, true);
  }

  async function cargarDatos(forzar = false) {
    const respuesta = await fetch("/api/datos", {
      cache: forzar ? "no-store" : "default",
    });
    if (!respuesta.ok) return;
    const json = await respuesta.json();
    setUsuarioId(json.usuarioId);
    setRolSesion(json.rol);
    setProyectosAbiertos(json.proyectosAbiertos ?? 0);
    setIntegrantesBd(
      (json.integrantes ?? []).map((p: Record<string, any>) => {
        const partes = p.nombre_completo.split(" ");
        const laboral = p.tb_informacion_laboral?.[0] ?? {};
        const salud = relacionUnica(p.tb_salud_perfil);
        return {
          id: p.id,
          usuarioId: p.usuario_id,
          iniciales:
            `${partes[0]?.[0] ?? ""}${partes[1]?.[0] ?? ""}`.toUpperCase(),
          nombre: p.nombre_completo,
          rol: p.usuario_id ? "Integrante" : "Familiar",
          edad: p.edad == null ? "Edad sin registrar" : `${p.edad} años`,
          lugar: p.departamento ?? "Perú",
          codigo: p.usuario_id ? "Usuario vinculado" : "Sin acceso",
          actualizado_en: p.actualizado_en ?? p.creado_en,
          dni: p.dni ?? "",
          fecha_nacimiento: p.fecha_nacimiento ?? "",
          lugar_nacimiento: p.lugar_nacimiento ?? "",
          estado_civil: p.estado_civil ?? "",
          telefono: p.telefono ?? "",
          correo_electronico: p.correo_electronico ?? "",
          departamento: p.departamento ?? "",
          provincia: p.provincia ?? "",
          distrito: p.distrito ?? "",
          direccion_actual: p.direccion_actual ?? "",
          observaciones: String(p.observaciones ?? "")
            .replace(/\s*\[ASISTENCIA\]\s*/g, " ")
            .trim(),
          empresa: laboral.empresa ?? "",
          cargo: laboral.cargo ?? "",
          direccion_trabajo: laboral.direccion_trabajo ?? "",
          telefono_laboral: laboral.telefono_laboral ?? "",
          tipo_sangre: salud.tipo_sangre ?? "",
          seguro_medico: salud.seguro_medico ?? "",
          alergias: salud.alergias ?? "",
          enfermedades_relevantes: salud.enfermedades_relevantes ?? "",
          medicacion_habitual: salud.medicacion_habitual ?? "",
          medico_referencia: salud.medico_referencia ?? "",
          cuentas: (p.tb_cuentas_financieras ?? []).map(
            (x: Record<string, string>) => ({
              banco_principal: x.banco_principal ?? "",
              tipo_cuenta: x.tipo_cuenta ?? "",
              observaciones: x.observaciones ?? "",
            }),
          ),
          contactos: (p.tb_contactos_emergencia ?? []).map(
            (x: Record<string, string>) => ({
              nombre: x.nombre ?? "",
              relacion: x.relacion ?? "",
              telefono: x.telefono ?? "",
            }),
          ),
          medicamentos: (p.tb_medicamentos ?? []).map(
            (x: Record<string, any>) => ({
              nombre: x.nombre ?? "",
              frecuencia: x.frecuencia ?? "",
              fecha_inicio: x.fecha_inicio ?? "",
              fecha_fin: x.fecha_fin ?? "",
              activo: x.activo !== false,
            }),
          ),
          fechas: (p.tb_fechas_importantes ?? []).map(
            (x: Record<string, string>) => {
              const tipo = x.tipo?.startsWith("regla:")
                ? "regla"
                : x.tipo === "anual"
                  ? "anual"
                  : "completa";
              const valor =
                tipo === "regla"
                  ? x.tipo.slice(6)
                  : tipo === "anual"
                    ? `${x.fecha?.slice(8, 10)}/${x.fecha?.slice(5, 7)}`
                    : (x.fecha ?? "");
              return { titulo: x.titulo ?? "", tipo, valor };
            },
          ),
        };
      }),
    );
  }

  async function cargarPrecios() {
    const respuesta = await fetch("/api/precios");
    if (!respuesta.ok) return;
    const json = await respuesta.json();
    setPrecios((json.precios ?? []).map((registro: Record<string, any>) => {
      const producto = relacionUnica(registro.tb_productos);
      const tienda = relacionUnica(registro.tb_tiendas);
      const precio = Number(registro.precio);
      const costo = Number(registro.costo_unitario);
      return {
        id: registro.id,
        titulo: producto.descripcion ?? "Producto",
        detalle: `${tienda.nombre ?? "Tienda"} S/${precio.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/${producto.presentacion ?? ""}`,
        meta: Number.isFinite(costo)
          ? `S/${costo.toLocaleString("es-PE", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
          : "—",
        estado: producto.categoria ?? "Sin categoría",
        fecha: registro.registrado_en,
        precio,
        valor: costo,
        tienda: tienda.nombre ?? "Tienda",
        presentacion: producto.presentacion ?? "",
      };
    }));
  }

  async function cargarModulo(nombre: string, forzar = false) {
    if (nombre === "Precios") return cargarPrecios();
    if (["Inicio", "Integrantes", "Salud"].includes(nombre)) return;
    if (!forzar && Date.now() - (cargasModulo.current[nombre] ?? 0) < 30_000)
      return;
    const respuesta = await fetch(`/api/modulos?modulo=${encodeURIComponent(nombre)}`);
    if (!respuesta.ok) return;
    const json = await respuesta.json();
    cargasModulo.current[nombre] = Date.now();
    setRegistrosModulo((actual) => ({ ...actual, [nombre]: json.registros ?? [] }));
  }

  useEffect(() => {
    fetch("/api/sesion")
      .then((r) => r.json())
      .then((r) => {
        if (r.autenticado) {
          setSesion(true);
          cargarDatos();
          cargarModulo("Proyectos y eventos");
        }
      })
      .catch(() => undefined);
  }, []);

  const integrantesVisibles = integrantesBd;

  const personasFiltradas = useMemo(
    () =>
      integrantesVisibles.filter((p) =>
        p.nombre.toLowerCase().includes(buscar.toLowerCase()),
      ),
    [buscar, integrantesVisibles],
  );

  async function ingresar(e: FormEvent) {
    e.preventDefault();
    if (codigo.length !== 8 || clave.length < 8) {
      setError("Ingresa un código de 8 dígitos y una contraseña válida.");
      return;
    }
    const respuesta = await fetch("/api/sesion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, clave }),
    });
    const json = await respuesta.json();
    if (!respuesta.ok) {
      setError(json.error ?? "No se pudo iniciar sesión.");
      return;
    }
    setError("");
    setSesion(true);
    await cargarDatos();
    await cargarModulo("Proyectos y eventos");
  }

  async function cerrarSesion() {
    await fetch("/api/sesion", { method: "DELETE" });
    setSesion(false);
    setIntegrantesBd([]);
    setUsuarioId("");
  }

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const destino = modalSeccion ?? seccion;
    if (destino === "Precios") {
      const valores = Object.fromEntries(new FormData(e.currentTarget));
      const respuesta = await fetch("/api/precios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
      });
      const json = await respuesta.json();
      if (!respuesta.ok) {
        setAviso(json.error ?? "No se pudo guardar el precio");
        return;
      }
      await cargarPrecios();
    } else if (!["Inicio", "Integrantes", "Salud", "Configuración"].includes(destino)) {
      const respuesta = await fetch(`/api/modulos?modulo=${encodeURIComponent(destino)}`, {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      const json = await respuesta.json();
      if (!respuesta.ok) {
        setAviso(json.error ?? "No se pudo guardar el registro");
        return;
      }
      await cargarModulo(destino, true);
    }
    setModal(null); setModalSeccion(null);
    setAviso("Registro guardado correctamente");
    window.setTimeout(() => setAviso(""), 2600);
  }

  if (!sesion)
    return (
      <main className={`acceso ${oscuro ? "dark" : ""}`}>
        <button
          className="boton-icono tema-flotante"
          onClick={() => setOscuro(!oscuro)}
          aria-label="Cambiar tema"
        >
          {oscuro ? "☀" : "☾"}
        </button>
        <section className="tarjeta-acceso">
          <div className="marca">FA</div>
          <div className="etiqueta">ESPACIO FAMILIAR PRIVADO</div>
          <h1>Familia Alania</h1>
          <p>
            Información, cuidado y recuerdos de nuestra familia en un solo
            lugar.
          </p>
          <form onSubmit={ingresar}>
            <label htmlFor="codigo">
              Código de acceso <b className="obligatorio">*</b>
            </label>
            <input
              id="codigo"
              required
              inputMode="numeric"
              maxLength={8}
              placeholder="8 dígitos"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
            />
            <label htmlFor="clave">
              Contraseña <b className="obligatorio">*</b>
            </label>
            <input
              id="clave"
              required
              type="password"
              placeholder="Tu contraseña"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
            />
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primario" type="submit">
              Ingresar <span>→</span>
            </button>
          </form>
          <p className="ayuda">
            La contraseña inicial es tu mismo código. Al entrar por primera vez
            te pediremos cambiarla.
          </p>
        </section>
        <p className="privacidad">
          Información protegida · Uso exclusivo de la familia
        </p>
      </main>
    );

  return (
    <div className={`aplicacion ${oscuro ? "dark" : ""} tema-${seccion.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/\s+/g, "-")}`}>
      <main className="contenido">
        <header className="barra">
          <div className="marca-nav" title="Familia Alania">
            FA
          </div>
          <nav className="nav-superior" aria-label="Navegación principal">
            {navegacion.map(([nombre, IconoNav]) => (
              <button
                key={nombre}
                className={seccion === nombre ? "activo" : ""}
                onClick={() => {
                  abrirSeccion(nombre);
                }}
              >
                <IconoNav size={15} strokeWidth={1.8} /> {nombre === "Proyectos y eventos" ? "Proyectos" : nombre === "Archivos históricos" ? "Archivos Históricos" : nombre}
              </button>
            ))}
          </nav>
          <div className="acciones">
            <div className="buscar-global">
              ⌕ <span>Buscar...</span>
              <kbd>⌘ K</kbd>
            </div>
            <button
              className="boton-icono"
              onClick={() => setOscuro(!oscuro)}
              aria-label="Cambiar tema"
            >
              {oscuro ? "☀" : "☾"}
            </button>
            <div className="menu-cuenta">
              <button
                className="avatar avatar-boton"
                onClick={() => setMenuCuenta(!menuCuenta)}
                aria-expanded={menuCuenta}
                aria-label="Abrir menú de cuenta"
              >
                {integrantesVisibles.find((p) => p.usuarioId === usuarioId)
                  ?.iniciales || "FA"}
              </button>
              {menuCuenta && (
                <div className="menu-cuenta-panel">
                  <button
                    onClick={() => {
                      const propia = integrantesVisibles.find(
                        (persona) => persona.usuarioId === usuarioId,
                      );
                      if (propia) {
                        setFichaDesdeSalud(false);
                        setFicha(propia);
                      }
                      setMenuCuenta(false);
                    }}
                  >
                    ♙ Mi ficha
                  </button>
                  {rolSesion === "administrador" && (
                    <button
                      onClick={() => {
                        setSeccion("Configuración");
                        setMenuCuenta(false);
                      }}
                    >
                      ⚙ Configuración
                    </button>
                  )}
                  <button onClick={cerrarSesion}>↪ Cerrar sesión</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="pagina">
          {seccion === "Inicio" ? (
            <Inicio
              personas={integrantesVisibles}
              proyectos={registrosModulo["Proyectos y eventos"] ?? []}
              onNavigate={abrirSeccion}
              onQuick={(accion) => { const propia=integrantesVisibles.find((p)=>p.usuarioId===usuarioId); if (accion === "historial") { setModal("Nuevo historial médico"); return; } setModalSeccion(accion === "precio" ? "Precios" : "Finanzas"); setModal(accion === "precio" ? "Nuevo registro · Precios" : accion === "ingreso" ? "Nuevo ingreso" : "Nuevo egreso"); }}
              onAdd={() => setModal("Agregar registro")}
              nombre={
                integrantesVisibles
                  .find((p) => p.usuarioId === usuarioId)
                  ?.nombre.split(" ")[0] ?? "Integrante"
              }
              proyectosAbiertos={proyectosAbiertos}
            />
          ) : seccion === "Integrantes" ? (
            <VistaIntegrantes
              buscar={buscar}
              setBuscar={setBuscar}
              personas={personasFiltradas}
              esAdministrador={rolSesion === "administrador"}
              usuarioId={usuarioId}
              onAdd={() => setModal("Nuevo integrante")}
              onOpen={setFicha}
            />
          ) : seccion === "Salud" ? (
            <VistaSalud key={versionSalud} accionRapida={accionRapida} onAccionUsada={() => setAccionRapida(null)} onChanged={() => cargarDatos(true)} onEditProfile={(id) => {
              const persona = integrantesVisibles.find((p) => p.id === id);
              if (persona) { setFichaDesdeSalud(true); setFicha(persona); }
            }} />
          ) : seccion === "Configuración" ? (
            <VistaConfiguracion onChanged={() => cargarDatos(true)} />
          ) : seccion === "Educación" || seccion === "Seguros" ? (
            <VistaDocumentosModulo
              titulo={seccion}
              registros={registrosModulo[seccion] ?? []}
              onAdd={() => setModal(`Nuevo registro · ${seccion}`)}
              onReload={() => cargarModulo(seccion, true)}
            />
          ) : seccion === "Finanzas" ? (
            <VistaFinanzas
              registros={registrosModulo.Finanzas ?? []}
              accionRapida={accionRapida}
              onAccionUsada={() => setAccionRapida(null)}
              onAdd={() => setModal("Nuevo registro · Finanzas")}
              onReload={() => cargarModulo("Finanzas", true)}
            />
          ) : seccion === "Proyectos y eventos" ? (
            <VistaProyectosEventos
              registros={registrosModulo["Proyectos y eventos"] ?? []}
              onAdd={() => setModal("Nuevo registro · Proyectos y eventos")}
              onReload={() => cargarModulo("Proyectos y eventos", true)}
            />
          ) : seccion === "Mascotas" ? (
            <VistaMascotas
              registros={registrosModulo.Mascotas ?? []}
              onAdd={() => setModal("Nuevo registro · Mascotas")}
              onReload={() => cargarModulo("Mascotas", true)}
            />
          ) : seccion === "Archivos históricos" ? (
            <VistaArchivosHistoricos
              registros={registrosModulo["Archivos históricos"] ?? []}
              onAdd={() => setModal("Nuevo registro · Archivos históricos")}
            />
          ) : (
            <VistaModulo
              titulo={seccion}
              registros={
                seccion === "Precios"
                  ? precios
                  : (registrosModulo[seccion] ?? datos[seccion] ?? [])
              }
              onAdd={() => setModal(`Nuevo registro · ${seccion}`)}
              onReload={seccion === "Precios" ? cargarPrecios : undefined}
            />
          )}
        </div>
      </main>

      {aviso && (
        <div className="toast" role="status">
          ✓ {aviso}
        </div>
      )}
      {modal === "Nuevo integrante" && (
        <ModalNuevoIntegrante
          esAdministrador={rolSesion === "administrador"}
          onClose={() => setModal(null)}
          onSaved={async () => {
            setModal(null);
            await cargarDatos(true);
            setAviso("Integrante creado correctamente");
            window.setTimeout(() => setAviso(""), 2600);
          }}
        />
      )}
      {modal && modal !== "Nuevo integrante" && (
        (modalSeccion ?? seccion) === "Precios" ? (
          <ModalPrecios
            onClose={() => { setModal(null); setModalSeccion(null); }}
            onSaved={async () => {
              setModal(null); setModalSeccion(null);
              await cargarPrecios();
              setAviso("Precios guardados correctamente");
              window.setTimeout(() => setAviso(""), 2600);
            }}
          />
        ) : (
          modal === "Nuevo historial médico" ? <ModalHistorialRapido integranteId={integrantesVisibles.find((p)=>p.usuarioId===usuarioId)?.id ?? ""} onClose={() => setModal(null)} onSaved={() => { setModal(null); setVersionSalud((x)=>x+1); }} /> : <Modal
            titulo={modal}
            seccion={modalSeccion ?? seccion}
            categoriasFinanzas={Array.from(new Set((registrosModulo.Finanzas ?? []).map((r) => r.categoria).filter(Boolean)))}
            onClose={() => { setModal(null); setModalSeccion(null); }}
            onSave={guardar}
          />
        )
      )}
      {ficha && (
        <ModalFicha
          integrante={ficha}
          puedeEditar={
            rolSesion === "administrador" || ficha.usuarioId === usuarioId
          }
          onClose={() => { setFicha(null); setFichaDesdeSalud(false); }}
          soloSalud={fichaDesdeSalud}
          onSaved={async () => {
            setFicha(null);
            await cargarDatos(true);
            if (fichaDesdeSalud) {
              setVersionSalud((actual) => actual + 1);
              setSeccion("Salud");
            }
            setFichaDesdeSalud(false);
            setAviso("Ficha actualizada correctamente");
            window.setTimeout(() => setAviso(""), 2600);
          }}
        />
      )}
    </div>
  );
}

function Inicio({
  personas,
  proyectos,
  onNavigate,
  onQuick,
  onAdd,
  nombre,
  proyectosAbiertos,
}: {
  personas: typeof integrantes;
  proyectos: Registro[];
  onNavigate: (s: string) => void;
  onQuick: (accion: "ingreso" | "egreso" | "precio" | "historial") => void;
  onAdd: () => void;
  nombre: string;
  proyectosAbiertos: number;
}) {
  const hora = new Date().getHours();
  const saludo =
    hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const proximas = useMemo(() => calcularProximasFechas(personas), [personas]);
  const hoyIso = new Date().toISOString().slice(0, 10);
  const recordatorios = useMemo(
    () =>
      personas.flatMap((p) =>
        p.medicamentos
          .filter((m) => m.activo && (!m.fecha_fin || m.fecha_fin >= hoyIso))
          .map((m) => ({ ...m, persona: p.nombre.split(" ")[0] })),
      ),
    [personas, hoyIso],
  );
  return (
    <>
      <section className="bienvenida">
        <div>
          <div className="etiqueta">ESPACIO FAMILIAR</div>
          <h1>
            {saludo}, {nombre}
          </h1>
          <p>Información familiar centralizada y protegida.</p>
        </div>
      </section>
      <section className="metricas mosaico-inicio">
        <article className="tarjeta-metrica"><WalletCards size={21}/><span>Finanzas</span><strong>Registrar movimiento</strong><div><button className="boton-icono" onClick={() => onQuick("ingreso")} aria-label="Agregar ingreso">↗</button><button className="boton-icono" onClick={() => onQuick("egreso")} aria-label="Agregar egreso">↙</button></div></article>
        <article className="tarjeta-metrica"><ShoppingBasket size={21}/><span>Precio</span><strong>Nuevo precio</strong><div><button className="boton-icono" onClick={() => onQuick("precio")} aria-label="Agregar precio">⌕</button></div></article>
        <article className="tarjeta-metrica"><Stethoscope size={21}/><span>Historial médico</span><strong>Nuevo registro</strong><div><button className="boton-icono" onClick={() => onQuick("historial")} aria-label="Agregar historial médico">♡</button></div></article>
        <button className="metrica-proyectos" onClick={() => onNavigate("Proyectos y eventos")}><span>Proyectos y eventos abiertos</span><strong>{proyectosAbiertos}</strong><small>Ver planificación familiar →</small></button>
      </section>
      <div className="grilla-inicio una-columna">
        {proximas.length > 0 && (
          <section>
            <div className="cabecera-seccion">
              <div>
                <h2>Próximas fechas</h2>
                <p>Cumpleaños y fechas familiares</p>
              </div>
            </div>
            <div className="tarjeta lista-fechas">
              {proximas.map((f) => (
                <article key={`${f.titulo}-${f.fecha.toISOString()}`}>
                  <div className="fecha">
                    <strong>{f.fecha.getDate()}</strong>
                    <span>
                      {f.fecha
                        .toLocaleDateString("es-PE", { month: "short" })
                        .toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3>{f.titulo}</h3>
                    <p>{f.detalle}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        <section>
          <div className="cabecera-seccion"><div><h2>Proyectos y eventos activos</h2><p>Planificación familiar</p></div><button onClick={() => onNavigate("Proyectos y eventos")}>Ver todos →</button></div>
          <div className="tarjeta lista-personas">
            {proyectos.filter((p) => p.estado !== "Cerrado").slice(0, 3).map((p) => <button key={p.id} onClick={() => onNavigate("Proyectos y eventos")}><span className="avatar">PE</span><span><strong>{p.titulo}</strong><small>{p.detalle}</small></span><i>›</i></button>)}
            {!proyectos.filter((p) => p.estado !== "Cerrado").length && <p className="muted">No hay proyectos abiertos.</p>}
          </div>
        </section>
        {recordatorios.length > 0 && (
          <section>
            <div className="cabecera-seccion">
              <div>
                <h2>Recordatorios de medicamentos</h2>
                <p>Tratamientos activos</p>
              </div>
              <button onClick={() => onNavigate("Salud")}>Ver Salud →</button>
            </div>
            <div className="tarjeta lista-personas">
              {recordatorios.map((m, i) => (
                <button
                  key={`${m.nombre}-${i}`}
                  onClick={() => onNavigate("Salud")}
                >
                  <span className="avatar">Rx</span>
                  <span>
                    <strong>{m.nombre}</strong>
                    <small>
                      {m.persona} · {m.frecuencia || "Frecuencia sin registrar"}
                      {m.fecha_fin
                        ? ` · hasta ${new Date(`${m.fecha_fin}T00:00:00`).toLocaleDateString("es-PE")}`
                        : ""}
                    </small>
                  </span>
                  <i>›</i>
                </button>
              ))}
            </div>
          </section>
        )}
        <section>
          <div className="cabecera-seccion">
            <div>
              <h2>Integrantes</h2>
              <p>{personas.length} miembros registrados</p>
            </div>
            <button onClick={() => onNavigate("Integrantes")}>
              Ver todos →
            </button>
          </div>
          <div className="tarjeta lista-personas">
            {personas.slice(0, 3).map((p) => (
              <button key={p.nombre} onClick={() => onNavigate("Integrantes")}>
                <span className="avatar">{p.iniciales}</span>
                <span>
                  <strong>{p.nombre}</strong>
                  <small>
                    {p.edad} · {p.lugar}
                  </small>
                </span>
                <i>›</i>
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function VistaIntegrantes({
  buscar,
  setBuscar,
  personas,
  onAdd,
  onOpen,
  esAdministrador,
  usuarioId,
}: {
  buscar: string;
  setBuscar: (s: string) => void;
  personas: Integrante[];
  onAdd: () => void;
  onOpen: (p: Integrante) => void;
  esAdministrador: boolean;
  usuarioId: string;
}) {
  return (
    <>
      <TituloPagina
        etiqueta="FAMILIA"
        titulo="Integrantes"
        descripcion="Perfiles, contactos y datos importantes de cada miembro."
        onAdd={onAdd}
        textoBoton="Agregar integrante +"
      />
      <div className="herramientas">
        <div className="buscador">
          ⌕
          <input
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar por nombre"
          />
        </div>
        <button className="secundario">Todos los roles⌄</button>
      </div>
      <section className="grilla-personas">
        {[...personas].sort((a, b) => Number(b.usuarioId === usuarioId) - Number(a.usuarioId === usuarioId)).map((p) => {
          const puedeEditar = esAdministrador || p.usuarioId === usuarioId;
          const direccion =
            [p.direccion_actual, p.distrito, p.provincia, p.departamento]
              .filter(Boolean)
              .join(", ") || "Sin registrar";
          const fechaCercana = calcularProximasFechas([p])[0];
          return (
            <article className="tarjeta ficha" key={p.id}>
              <div className="ficha-arriba">
                <span className="avatar grande">{p.iniciales}</span>
              </div>
              <h2>{p.nombre}</h2>
              <p>
                {p.edad} · {p.lugar}
              </p>
              <dl>
                <div>
                  <dt>DNI</dt>
                  <dd>{p.dni || "Sin registrar"}</dd>
                </div>
                <div>
                  <dt>Dirección</dt>
                  <dd className="dato-largo">{direccion}</dd>
                </div>
                <div>
                  <dt>Próxima fecha</dt>
                  <dd>
                    {fechaCercana
                      ? `${fechaCercana.titulo} · ${fechaCercana.fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}`
                      : "Sin fechas próximas"}
                  </dd>
                </div>
              </dl>
              <div className="ficha-acciones">
                <button className="secundario" onClick={() => onOpen(p)}>
                  {puedeEditar ? "Ver y editar ficha" : "Ver ficha"}
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}

const CAMPOS_SALUD: Record<string, Array<[string, string, string?]>> = {
  historial: [
    ["fecha", "Fecha", "date"],
    ["establecimiento", "Establecimiento"],
    ["tipo", "Tipo de atención", "sugerencia"],
    ["profesional", "Profesional"],
    ["diagnostico", "Diagnóstico"],
    ["tratamiento", "Tratamiento", "textarea"],
    ["observaciones", "Observaciones", "textarea"],
  ],
  medicamentos: [
    ["nombre", "Medicamento"],
    ["dosis", "Dosis"],
    ["frecuencia_horas", "Frecuencia en horas", "number"],
    ["repeticiones", "Veces que se repite", "number"],
    ["duracion_dias", "O duración en días", "number"],
    ["fecha_inicio", "Fecha de inicio", "date"],
    ["fecha_fin", "Fecha de fin calculada o manual", "date"],
    ["indicaciones", "Indicaciones", "textarea"],
  ],
  vacunas: [
    ["nombre", "Vacuna"],
    ["dosis", "Dosis"],
    ["establecimiento", "Establecimiento"],
    ["lote", "Lote"],
    ["fecha_aplicacion", "Fecha de aplicación", "date"],
    ["proxima_fecha", "Próxima dosis (opcional)", "date"],
    ["proxima_cantidad", "Dentro de", "number"],
    ["proxima_unidad", "Unidad", "unidad"],
  ],
  examenes: [
    ["nombre", "Examen"],
    ["fecha", "Fecha", "date"],
    ["resultado_resumen", "Resultado", "textarea"],
    ["proximo_control", "Próximo control (opcional)", "date"],
  ],
  signos: [
    ["registrado_en", "Fecha", "date"],
    ["peso_kg", "Peso (kg)", "number"],
    ["talla_cm", "Talla (cm)", "number"],
    ["presion_arterial", "Presión arterial"],
    ["temperatura", "Temperatura", "number"],
    ["glucosa", "Glucosa", "number"],
    ["saturacion", "Saturación", "number"],
    ["pulso", "Pulso", "number"],
    ["observaciones", "Observaciones", "textarea"],
  ],
};
const TABLAS_SALUD: Record<string, string> = {
  historial: "tb_historial_medico",
  medicamentos: "tb_medicamentos",
  vacunas: "tb_vacunas",
  examenes: "tb_examenes",
  signos: "tb_signos_vitales",
};

function VistaSalud({ onChanged, onEditProfile, accionRapida, onAccionUsada }: { onChanged: () => void; onEditProfile: (id: string) => void; accionRapida: string | null; onAccionUsada: () => void }) {
  const [datosSalud, setDatosSalud] = useState<Record<string, any>[]>([]);
  const [usuarioActual, setUsuarioActual] = useState("");
  const [rolActual, setRolActual] = useState("");
  const [integranteId, setIntegranteId] = useState("");
  const [pestana, setPestana] = useState("perfil");
  const [avisoSalud, setAvisoSalud] = useState("");
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [medicamentosTratamiento, setMedicamentosTratamiento] = useState([
    { nombre: "", dosis: "", frecuencia: "", indicaciones: "" },
  ]);
  const [registroEditando, setRegistroEditando] = useState<Record<
    string,
    any
  > | null>(null);
  async function cargarSalud() {
    const respuesta = await fetch("/api/salud");
    const json = await respuesta.json();
    const lista = json.integrantes ?? [];
    setDatosSalud(lista);
    setUsuarioActual(json.usuarioId);
    setRolActual(json.rol);
    setIntegranteId(
      (actual) =>
        actual ||
        lista.find(
          (x: Record<string, string>) => x.usuario_id === json.usuarioId,
        )?.id ||
        lista[0]?.id ||
        "",
    );
  }
  useEffect(() => {
    cargarSalud();
  }, []);
  useEffect(() => { if (accionRapida === "historial") { setPestana("historial"); setFormularioAbierto(true); onAccionUsada(); } }, [accionRapida, onAccionUsada]);
  const persona = datosSalud.find((x) => x.id === integranteId);
  const puedeEditar =
    rolActual === "administrador" ||
    persona?.usuario_id === usuarioActual ||
    persona?.observaciones?.includes("[ASISTENCIA]");
  const perfil = relacionUnica(persona?.tb_salud_perfil);
  const registros =
    pestana === "perfil" ? [] : (persona?.[TABLAS_SALUD[pestana]] ?? []);

  async function guardarSalud(e: FormEvent<HTMLFormElement>, tipo: string) {
    e.preventDefault();
    const formulario = e.currentTarget;
    const valores = Object.fromEntries(new FormData(formulario));
    const respuesta = await fetch("/api/salud", {
      method: registroEditando ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: registroEditando?.id,
        integrante_id: integranteId,
        seccion: tipo,
        ...valores,
        medicamentos:
          tipo === "historial" ? medicamentosTratamiento : undefined,
      }),
    });
    const json = await respuesta.json();
    setAvisoSalud(
      respuesta.ok ? "✓ Guardado" : (json.error ?? "No se pudo guardar"),
    );
    if (respuesta.ok) {
      formulario.reset();
      setRegistroEditando(null);
      setMedicamentosTratamiento([
        { nombre: "", dosis: "", frecuencia: "", indicaciones: "" },
      ]);
      setFormularioAbierto(false);
      await cargarSalud();
      await onChanged();
    }
    window.setTimeout(() => setAvisoSalud(""), respuesta.ok ? 2200 : 5000);
  }
  async function eliminarRegistro(registro: Record<string, any>) {
    const respuesta = await fetch("/api/salud", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: registro.id, seccion: pestana }),
    });
    const json = await respuesta.json();
    setAvisoSalud(
      respuesta.ok
        ? "✓ Registro eliminado"
        : (json.error ?? "No se pudo eliminar"),
    );
    if (respuesta.ok) await cargarSalud();
  }

  return (
    <>
      <TituloPagina
        etiqueta="CUIDADO FAMILIAR"
        titulo="Salud"
        descripcion="Perfil de salud, historial, medicamentos, vacunas, exámenes y signos."
        textoBoton=""
      />
      <div className="selector-integrante">
        <label>
          Integrante
          <select
            value={integranteId}
            onChange={(e) => setIntegranteId(e.target.value)}
          >
            {datosSalud.map((p) => (
              <option value={p.id} key={p.id}>
                {p.nombre_completo}
              </option>
            ))}
          </select>
        </label>
        {avisoSalud && <small>{avisoSalud}</small>}
      </div>
      <section className="pestanas">
        {[
          ["perfil", "Perfil de salud"],
          ["historial", "Historial médico"],
          ["medicamentos", "Medicamentos"],
          ["vacunas", "Vacunas"],
          ["examenes", "Exámenes"],
          ["signos", "Signos"],
        ].map(([id, nombre]) => (
          <button
            onClick={() => {
              setPestana(id);
              setRegistroEditando(null);
              setFormularioAbierto(false);
            }}
            className={pestana === id ? "seleccionada" : ""}
            key={id}
          >
            {nombre}
          </button>
        ))}
      </section>
      {pestana === "perfil" ? (
        <section className="tarjeta resumen-salud">
          <div className="cabecera-seccion">
            <div>
              <h2>Perfil de salud</h2>
              <p>Información compartida con la ficha del integrante</p>
            </div>
            {puedeEditar && (
              <button onClick={() => onEditProfile(integranteId)}>
                Editar →
              </button>
            )}
          </div>
          <dl>
            {[
              ["Tipo de sangre", perfil.tipo_sangre],
              ["Seguro médico", perfil.seguro_medico],
              ["Alergias", perfil.alergias],
              ["Enfermedades relevantes", perfil.enfermedades_relevantes],
              ["Medicación habitual", perfil.medicacion_habitual],
              ["Médico de referencia", perfil.medico_referencia],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v || "Sin registrar"}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : (
        <section className="tarjeta registros-salud">
          <div className="cabecera-seccion">
            <div>
              <h2>Registros</h2>
              <p>{registros.length} registros guardados</p>
            </div>
            {puedeEditar && (
              <button
                onClick={() => {
                  setRegistroEditando(null);
                  setFormularioAbierto(true);
                }}
              >
                ＋ Agregar
              </button>
            )}
          </div>
          {registros.length ? (
            registros.map((r: Record<string, any>) => (
              <article key={r.id}>
                <div className="registro-salud-info">
                  <strong>
                    {r.nombre ||
                      r.diagnostico ||
                      r.tipo ||
                      r.presion_arterial ||
                      "Registro de salud"}
                  </strong>
                  <span>
                    {r.fecha ||
                      r.fecha_aplicacion ||
                      r.fecha_inicio ||
                      (r.registrado_en
                        ? new Date(r.registrado_en).toLocaleDateString("es-PE")
                        : "")}
                  </span>
                  <p>
                    {pestana === "signos"
                      ? [
                          ["Peso", r.peso_kg && `${r.peso_kg} kg`],
                          ["Talla", r.talla_cm && `${r.talla_cm} cm`],
                          ["Presión", r.presion_arterial],
                          [
                            "Temperatura",
                            r.temperatura && `${r.temperatura} °C`,
                          ],
                          ["Glucosa", r.glucosa],
                          ["Saturación", r.saturacion && `${r.saturacion}%`],
                          ["Pulso", r.pulso],
                        ]
                          .filter(([, v]) => v)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")
                      : r.resultado_resumen ||
                        r.tratamiento ||
                        r.indicaciones ||
                        r.observaciones ||
                        ""}
                  </p>
                  <small>Registrado por: {r.autor_nombre}</small>
                </div>
                <div className="acciones-registro">
                  <button
                    onClick={() => {
                      setRegistroEditando(r);
                      setFormularioAbierto(true);
                    }}
                  >
                    Ver
                  </button>
                  {(rolActual === "administrador" ||
                    r.autor_id === usuarioActual) && (
                    <button
                      className="eliminar-registro"
                      onClick={() => eliminarRegistro(r)}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="estado-vacio">
              <p>Sin registros todavía.</p>
            </div>
          )}
        </section>
      )}
      {formularioAbierto && (
        <div className="velo">
          <section
            className="modal modal-ficha"
            role="dialog"
            aria-modal="true"
            aria-label={
              pestana === "perfil"
                ? "Editar perfil de salud"
                : "Registro de salud"
            }
          >
            <div className="modal-cabecera">
              <div>
                <div className="etiqueta">SALUD</div>
                <h2>
                  {pestana === "perfil"
                    ? "Editar perfil de salud"
                    : registroEditando
                      ? "Ver y editar registro"
                      : "Nuevo registro"}
                </h2>
              </div>
              <button
                className="boton-icono"
                onClick={() => {
                  setRegistroEditando(null);
                  setFormularioAbierto(false);
                }}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            {pestana === "perfil" ? (
              <form
                className="formulario-salud"
                onSubmit={(e) => guardarSalud(e, "perfil")}
              >
                <div className="campos">
                  <label>
                    <span>Tipo de sangre</span>
                    <select
                      name="tipo_sangre"
                      defaultValue={perfil.tipo_sangre ?? ""}
                    >
                      <option value="">Selecciona</option>
                      {[
                        "O+",
                        "O-",
                        "A+",
                        "A-",
                        "B+",
                        "B-",
                        "AB+",
                        "AB-",
                        "No conoce",
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  {[
                    ["seguro_medico", "Seguro médico"],
                    ["alergias", "Alergias"],
                    ["enfermedades_relevantes", "Enfermedades relevantes"],
                    ["medicacion_habitual", "Medicación habitual"],
                    ["medico_referencia", "Médico de referencia"],
                  ].map(([campo, etiqueta]) => (
                    <label key={campo}>
                      <span>{etiqueta}</span>
                      <input name={campo} defaultValue={perfil[campo] ?? ""} />
                    </label>
                  ))}
                </div>
                {avisoSalud && (
                  <p
                    className={
                      avisoSalud.startsWith("✓") ? "exito-modal" : "error-modal"
                    }
                  >
                    {avisoSalud}
                  </p>
                )}
                <div className="modal-acciones">
                  <button
                    type="button"
                    className="secundario"
                    onClick={() => setFormularioAbierto(false)}
                  >
                    Cerrar
                  </button>
                  <button className="primario">Guardar</button>
                </div>
              </form>
            ) : (
              <form
                className="formulario-salud"
                onSubmit={(e) => guardarSalud(e, pestana)}
              >
                <div className="campos">
                  {CAMPOS_SALUD[pestana].map(([campo, etiqueta, tipo]) => {
                    const obligatorios: Record<string, string[]> = {
                      historial: ["fecha", "diagnostico", "tratamiento"],
                      medicamentos: ["nombre"],
                      vacunas: ["nombre", "fecha_aplicacion"],
                      examenes: ["nombre", "fecha"],
                      signos: ["registrado_en"],
                    };
                    const requerido =
                      obligatorios[pestana]?.includes(campo) ?? false;
                    const existente =
                      campo === "frecuencia_horas"
                        ? String(registroEditando?.frecuencia ?? "").match(/\d+/)?.[0]
                        : registroEditando?.[campo];
                    return (
                      <label
                        key={campo}
                        className={tipo === "textarea" ? "ancho" : ""}
                      >
                        <span>
                          {etiqueta}
                          {requerido && (
                            <>
                              {" "}
                              <b className="obligatorio">*</b>
                            </>
                          )}
                        </span>
                        {tipo === "textarea" ? (
                          <textarea
                            name={campo}
                            rows={4}
                            required={requerido}
                            defaultValue={existente ?? ""}
                          />
                        ) : tipo === "unidad" ? (
                          <select
                            name={campo}
                            defaultValue="semanas"
                            required={requerido}
                          >
                            <option value="semanas">Semanas</option>
                            <option value="meses">Meses</option>
                          </select>
                        ) : (
                          <input
                            name={campo}
                            type={
                              tipo === "date" || tipo === "number"
                                ? tipo
                                : "text"
                            }
                            list={
                              tipo === "sugerencia"
                                ? "tipos-atencion"
                                : undefined
                            }
                            step={tipo === "number" ? "0.01" : undefined}
                            defaultValue={
                              existente ??
                              (tipo === "date" &&
                              !["fecha_fin", "proxima_fecha", "proximo_control"].includes(campo)
                                ? new Date().toISOString().slice(0, 10)
                                : undefined)
                            }
                            required={requerido}
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
                {pestana === "historial" && (
                  <fieldset className="medicamentos-tratamiento">
                    <legend>Medicamentos del tratamiento</legend>
                    <div className="tabla-medicamentos">
                      <div className="tabla-medicamentos-cabecera">
                        <span>Medicamento</span>
                        <span>Dosis</span>
                        <span>Frecuencia</span>
                        <span>Indicaciones</span>
                        <span />
                      </div>
                      {medicamentosTratamiento.map((m, i) => (
                        <div className="tabla-medicamentos-fila" key={i}>
                          <input
                            value={m.nombre}
                            placeholder="Nombre"
                            onChange={(e) =>
                              setMedicamentosTratamiento(
                                medicamentosTratamiento.map((x, n) =>
                                  n === i
                                    ? { ...x, nombre: e.target.value }
                                    : x,
                                ),
                              )
                            }
                          />
                          <input
                            value={m.dosis}
                            placeholder="Dosis"
                            onChange={(e) =>
                              setMedicamentosTratamiento(
                                medicamentosTratamiento.map((x, n) =>
                                  n === i ? { ...x, dosis: e.target.value } : x,
                                ),
                              )
                            }
                          />
                          <input
                            value={m.frecuencia}
                            placeholder="Cada 8 horas"
                            onChange={(e) =>
                              setMedicamentosTratamiento(
                                medicamentosTratamiento.map((x, n) =>
                                  n === i
                                    ? { ...x, frecuencia: e.target.value }
                                    : x,
                                ),
                              )
                            }
                          />
                          <input
                            value={m.indicaciones}
                            placeholder="Indicaciones"
                            onChange={(e) =>
                              setMedicamentosTratamiento(
                                medicamentosTratamiento.map((x, n) =>
                                  n === i
                                    ? { ...x, indicaciones: e.target.value }
                                    : x,
                                ),
                              )
                            }
                          />
                          {medicamentosTratamiento.length > 1 && (
                            <button
                              type="button"
                              className="quitar"
                              onClick={() =>
                                setMedicamentosTratamiento(
                                  medicamentosTratamiento.filter(
                                    (_, n) => n !== i,
                                  ),
                                )
                              }
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="secundario agregar-medicamento"
                      onClick={() =>
                        setMedicamentosTratamiento([
                          ...medicamentosTratamiento,
                          {
                            nombre: "",
                            dosis: "",
                            frecuencia: "",
                            indicaciones: "",
                          },
                        ])
                      }
                    >
                      ＋ Agregar medicamento
                    </button>
                  </fieldset>
                )}
                <datalist id="tipos-atencion">
                  {Array.from(
                    new Set(
                      datosSalud.flatMap((p) =>
                        (p.tb_historial_medico ?? [])
                          .map((r: Record<string, string>) => r.tipo)
                          .filter(Boolean),
                      ),
                    ).values(),
                  ).map((x) => (
                    <option key={String(x)} value={String(x)} />
                  ))}
                </datalist>
                {avisoSalud && (
                  <p
                    className={
                      avisoSalud.startsWith("✓") ? "exito-modal" : "error-modal"
                    }
                  >
                    {avisoSalud}
                  </p>
                )}
                <div className="modal-acciones">
                  <button
                    type="button"
                    className="secundario"
                    onClick={() => setFormularioAbierto(false)}
                  >
                    Cerrar
                  </button>
                  <button className="primario">Guardar registro</button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function claveProducto(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:x\s*\d+)?\s*(?:kg|g|mg|l|ml|unidades?|und|u)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function GraficoPrecios({ registros }: { registros: Registro[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [verPrecio, setVerPrecio] = useState(true);
  const [verValor, setVerValor] = useState(true);
  const [tooltip, setTooltip] = useState<{ x:number; texto:string } | null>(null);
  const ordenados = [...registros].filter((x) => x.fecha).sort((a, b) =>
    String(a.fecha).localeCompare(String(b.fecha)),
  );
  useEffect(() => {
    const elemento = canvas.current;
    if (!elemento) return;
    const ctx = elemento.getContext("2d");
    if (!ctx) return;
    const ancho = elemento.clientWidth || 620;
    const alto = 190;
    elemento.width = ancho;
    elemento.height = alto;
    ctx.clearRect(0, 0, ancho, alto);
    const series = [
      ...(verPrecio ? ordenados.map((x) => Number(x.precio)) : []),
      ...(verValor ? ordenados.map((x) => Number(x.valor)) : []),
    ].filter(Number.isFinite);
    if (!series.length) return;
    const maximo = Math.max(...series, 1);
    const dibujar = (valores: number[], color: string) => {
      const puntos = valores.map((valor, i) => ({
        x: 34 + (i * (ancho - 54)) / Math.max(valores.length - 1, 1),
        y: 15 + (1 - valor / maximo) * 135,
      }));
      ctx.beginPath();
      puntos.forEach((punto, i) => {
        if (i === 0) ctx.moveTo(punto.x, punto.y);
        else {
          const anterior = puntos[i - 1];
          const medio = (anterior.x + punto.x) / 2;
          ctx.bezierCurveTo(medio, anterior.y, medio, punto.y, punto.x, punto.y);
        }
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    };
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(34, 10);
    ctx.lineTo(34, 152);
    ctx.lineTo(ancho - 12, 152);
    ctx.stroke();
    if (verPrecio) dibujar(ordenados.map((x) => Number(x.precio)), "#ca8a04");
    if (verValor) dibujar(ordenados.map((x) => Number(x.valor)), "#2563eb");
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Roboto";
    ordenados.forEach((registro, i) => {
      const x = 34 + (i * (ancho - 54)) / Math.max(ordenados.length - 1, 1);
      ctx.fillText(
        new Date(String(registro.fecha)).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" }),
        Math.max(4, x - 13),
        174,
      );
    });
  }, [ordenados, verPrecio, verValor]);
  return (
    <div className="grafico-precios">
      <div className="leyenda-grafico">
        <button className={verPrecio ? "activo" : ""} onClick={() => setVerPrecio(!verPrecio)}>Precio</button>
        <button className={verValor ? "activo valor" : ""} onClick={() => setVerValor(!verValor)}>Valor</button>
      </div>
      <canvas
        ref={canvas}
        aria-label="Historial de precio y valor por fecha"
        onPointerMove={(e) => {
          if (!ordenados.length) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const indice = Math.max(0, Math.min(ordenados.length - 1, Math.round(((e.clientX - rect.left - 34) / Math.max(rect.width - 54, 1)) * Math.max(ordenados.length - 1, 1))));
          const r = ordenados[indice];
          setTooltip({
            x: e.clientX - rect.left,
            texto: `${new Date(String(r.fecha)).toLocaleDateString("es-PE")} · Precio S/${Number(r.precio).toFixed(2)} · Valor S/${Number(r.valor).toFixed(3)}`,
          });
        }}
        onPointerLeave={() => setTooltip(null)}
      />
      {tooltip && <span className="tooltip-grafico" style={{ left: tooltip.x }}>{tooltip.texto}</span>}
    </div>
  );
}

function VistaProductos({ precios }: { precios: Registro[] }) {
  const grupos = Array.from(
    precios.reduce((mapa, precio) => {
      const clave = claveProducto(precio.titulo);
      mapa.set(clave, [...(mapa.get(clave) ?? []), precio]);
      return mapa;
    }, new Map<string, Registro[]>()),
  );
  if (!grupos.length)
    return <section className="tarjeta estado-vacio"><h2>Sin productos</h2><p>Agrega precios para comparar tiendas e historial.</p></section>;
  return (
    <div className="productos-agrupados">
      {grupos.map(([clave, lista]) => {
        const preciosValidos = lista.map((x) => Number(x.precio)).filter(Number.isFinite);
        const valoresValidos = lista.map((x) => Number(x.valor)).filter(Number.isFinite);
        const mejor = [...lista].sort((a, b) => Number(a.valor) - Number(b.valor))[0];
        return (
          <section className="tarjeta producto-comparado" key={clave}>
            <div className="producto-cabecera">
              <div><span className="etiqueta">PRODUCTO</span><h2>{lista[0].titulo}</h2></div>
              <div className="promedios-producto">
                <span>Precio promedio <b>S/{(preciosValidos.reduce((a, b) => a + b, 0) / preciosValidos.length).toFixed(2)}</b></span>
                <span>Valor promedio <b>S/{(valoresValidos.reduce((a, b) => a + b, 0) / valoresValidos.length).toFixed(3)}</b></span>
                <span>Mejor tienda <b>{mejor?.tienda}</b></span>
              </div>
            </div>
            <div className="tabla-producto">
              <div><b>Tienda</b><b>Presentación</b><b>Precio</b><b>Valor</b></div>
              {lista.map((x, i) => <div key={`${x.tienda}-${x.fecha}-${i}`}>
                <span>{x.tienda}</span><span>{x.presentacion}</span>
                <span>S/{Number(x.precio).toFixed(2)}</span><span>S/{Number(x.valor).toFixed(3)}</span>
              </div>)}
            </div>
            <h3>Historial de precios</h3>
            <GraficoPrecios registros={lista} />
          </section>
        );
      })}
    </div>
  );
}

function VistaDocumentosModulo({
  titulo,
  registros,
  onAdd,
  onReload,
}: {
  titulo: string;
  registros: Registro[];
  onAdd: () => void;
  onReload: () => void;
}) {
  const [pestana, setPestana] = useState("Todos");
  const [usuario, setUsuario] = useState("Todos");
  const [preview, setPreview] = useState<Registro | null>(null);
  const [editando, setEditando] = useState<Registro | null>(null);
  const autores = Array.from(new Set(registros.map((x) => x.autor).filter(Boolean)));
  const visibles = usuario === "Todos" ? registros : registros.filter((x) => x.autor === usuario);
  async function guardarEdicion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editando) return;
    const valores = Object.fromEntries(new FormData(e.currentTarget));
    await fetch(`/api/modulos?modulo=${encodeURIComponent(titulo)}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editando, ...valores }),
    });
    setEditando(null);
    onReload();
  }
  return (
    <>
      <TituloPagina
        etiqueta="GESTIÓN FAMILIAR"
        titulo={titulo}
        descripcion={titulo === "Educación" ? "Estudios, cursos, certificados y documentos académicos." : "Pólizas, coberturas, vencimientos y documentos."}
        onAdd={onAdd}
        textoBoton="Nuevo registro"
      />
      <section className="pestanas">
        {["Todos", "Documentos"].map((x) => <button key={x} className={pestana === x ? "seleccionada" : ""} onClick={() => setPestana(x)}>{x}</button>)}
      </section>
      {pestana === "Todos" && (
        <>
          <div className="filtro-usuario">
            <label>Usuario
              <select value={usuario} onChange={(e) => setUsuario(e.target.value)}>
                <option>Todos</option>
                {autores.map((x) => <option key={x}>{x}</option>)}
              </select>
            </label>
          </div>
          <section className="tarjeta tabla">
            <div className="tabla-cabecera"><span>Registro</span><span>Institución / aseguradora</span><span>Usuario</span><span>Acciones</span></div>
            {visibles.map((r) => <div className="tabla-fila" key={`${r.id}-${r.tabla ?? ""}`}>
              <span><strong>{r.titulo}</strong><small>{r.meta}</small></span>
              <span>{r.detalle}</span><span>{r.autor}</span>
              <span className="acciones-tabla">
                {r.url && <button onClick={() => setPreview(r)}>Ver</button>}
                {r.propio && <button onClick={() => setEditando(r)}>Editar</button>}
              </span>
            </div>)}
          </section>
        </>
      )}
      {pestana === "Documentos" && (
        <section className="grilla-documentos">
          {registros.filter((x) => x.url).map((r) => (
            <article className="tarjeta documento-preview" key={`${r.id}-${r.tabla ?? ""}`}>
              {r.url?.toLowerCase().includes(".pdf") ? (
                <iframe src={`${r.url}#page=1&toolbar=0`} title={r.titulo} />
              ) : <img src={r.url} alt="" />}
              <div><strong>{r.titulo}</strong><small>{r.autor}</small><button onClick={() => setPreview(r)}>Ver</button></div>
            </article>
          ))}
        </section>
      )}
      {preview && <div className="velo" onMouseDown={(e) => e.target === e.currentTarget && setPreview(null)}>
        <section className="modal visor-documento">
          <div className="modal-cabecera"><h2>{preview.titulo}</h2><button className="boton-icono" onClick={() => setPreview(null)}>×</button></div>
          {preview.url?.toLowerCase().includes(".pdf") ? <iframe src={preview.url} title={preview.titulo} /> : <img src={preview.url} alt={preview.titulo} />}
        </section>
      </div>}
      {editando && <div className="velo">
        <section className="modal modal-corta">
          <div className="modal-cabecera"><h2>Editar registro</h2><button className="boton-icono" onClick={() => setEditando(null)}>×</button></div>
          <form onSubmit={guardarEdicion}><div className="campos">
            <Campo nombre="titulo" etiqueta="Título" valorInicial={editando.titulo} obligatorio ancho />
            <Campo nombre={titulo === "Educación" ? "institucion" : "aseguradora"} valorInicial={titulo === "Educación" ? editando.detalle : editando.aseguradora} etiqueta={titulo === "Educación" ? "Institución" : "Aseguradora"} obligatorio ancho />
            {titulo === "Seguros" && <><Campo nombre="numero_poliza" valorInicial={editando.numero_poliza} etiqueta="Número de póliza" /><Campo nombre="cobertura" valorInicial={editando.cobertura} etiqueta="Cobertura" /></>}
          </div><div className="modal-acciones"><button type="button" className="secundario" onClick={() => setEditando(null)}>Cancelar</button><button className="primario">Guardar</button></div></form>
        </section>
      </div>}
    </>
  );
}

type FilaFinanza = { fecha: string; categoria: string; descripcion: string; monto: string; observaciones: string };
const categoriasIngresoIniciales = ["Sueldo", "Venta", "Bonificación", "Otros ingresos"];
const categoriasEgresoIniciales = ["Alimentación", "Salud", "Educación", "Servicios", "Transporte", "Otros egresos"];

function GraficoResumenFinanzas({ registros }: { registros: Registro[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [tooltip,setTooltip]=useState<{x:number;texto:string}|null>(null);
  const ingresos = Array(12).fill(0), egresos = Array(12).fill(0);
  registros.forEach((r) => { const m = new Date(`${r.fecha}T00:00:00`).getMonth(); (r.tipo === "ingreso" ? ingresos : egresos)[m] += Number(r.monto); });
  const ahorro = ingresos.map((x, i) => x - egresos[i]);
  const max = Math.max(1, ...ingresos, ...egresos, ...ahorro.map(Math.abs));
  const indices = Array.from({ length: 12 }, (_, i) => i);
  const nombresMes = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  useEffect(() => {
    const c = canvas.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const w = c.clientWidth || 600, h = 220; c.width = w; c.height = h; ctx.clearRect(0, 0, w, h);
    const izquierda=64, derecha=14, anchoUtil=w-izquierda-derecha;
    ctx.strokeStyle = "#94a3b8"; ctx.beginPath(); ctx.moveTo(izquierda, 12); ctx.lineTo(izquierda, 180); ctx.lineTo(w - derecha, 180); ctx.stroke();
    ctx.fillStyle="#64748b";ctx.font="9px Roboto";
    [0,.25,.5,.75,1].forEach((p)=>{const y=180-p*150;ctx.fillText(`S/${Math.round(max*p)}`,2,y+3);});
    {
      const categorias = Array.from(new Set(registros.map((r) => `${r.tipo}:${r.categoria || "Sin categoría"}`)));
      const coloresIngreso = ["#1d4ed8","#2563eb","#60a5fa","#93c5fd","#bfdbfe"];
      const coloresEgreso = ["#c2410c","#ea580c","#f97316","#fb923c","#fdba74"];
      const anchoGrupo = Math.max(18, anchoUtil / 12 * .6);
      indices.forEach((mes, i) => { const x = izquierda + i * anchoUtil / 11 - anchoGrupo / 2; ["ingreso","gasto"].forEach((tipoMovimiento, lado) => { let base=0; const lista=categorias.filter((c)=>c.startsWith(`${tipoMovimiento}:`)); lista.forEach((categoria, n) => { const monto=registros.filter((r)=>r.tipo===tipoMovimiento&&new Date(`${r.fecha}T00:00:00`).getMonth()===mes&&`${r.tipo}:${r.categoria || "Sin categoría"}`===categoria).reduce((s,r)=>s+Number(r.monto),0); const alto=monto/max*150; const bx=x+lado*(anchoGrupo/2+3), by=180-base-alto, bw=anchoGrupo/2; ctx.fillStyle=(tipoMovimiento==="ingreso"?coloresIngreso:coloresEgreso)[n%5]; ctx.beginPath(); ctx.roundRect(bx,by,bw,alto,Math.min(5,bw/2,alto/2)); ctx.fill(); base+=alto; }); }); });
    }
    ctx.fillStyle = "#64748b"; ctx.font = "9px Roboto"; indices.forEach((mes, i) => ctx.fillText(nombresMes[mes], izquierda - 6 + i * anchoUtil / 11, 202));
  }, [registros]);
  return <div className="envoltura-grafico"><canvas
    ref={canvas}
    className="canvas-finanzas"
    aria-label="Ingresos versus egresos por mes"
    onPointerMove={(e)=>{const rect=e.currentTarget.getBoundingClientRect();const posicion=Math.max(0,Math.min(11,Math.round(((e.clientX-rect.left-64)/Math.max(rect.width-78,1))*11)));const i=indices[posicion];setTooltip({x:e.clientX-rect.left,texto:`${nombresMes[i]} · Ingresos S/${ingresos[i].toFixed(2)} · Egresos S/${egresos[i].toFixed(2)}`});}}
    onPointerLeave={()=>setTooltip(null)}
  />{tooltip&&<span className="tooltip-grafico" style={{left:tooltip.x}}>{tooltip.texto}</span>}</div>;
}

function VistaFinanzas({ registros, onAdd, onReload, accionRapida, onAccionUsada }: { registros: Registro[]; onAdd: () => void; onReload: () => void; accionRapida: string | null; onAccionUsada: () => void }) {
  const [pestana, setPestana] = useState("Resumen");
  const anios = Array.from(new Set(registros.map((x) => String(x.fecha ?? "").slice(0, 4)).filter(Boolean)));
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [categoriasIngreso, setCategoriasIngreso] = useState(categoriasIngresoIniciales);
  const [categoriasEgreso, setCategoriasEgreso] = useState(categoriasEgresoIniciales);
  const [filas, setFilas] = useState<FilaFinanza[]>([{ fecha: "", categoria: "", descripcion: "", monto: "", observaciones: "" }]);
  const [tooltipPastel,setTooltipPastel]=useState("");
  const [editando,setEditando]=useState<Registro|null>(null);
  useEffect(() => { if (accionRapida === "ingreso" || accionRapida === "egreso") { setPestana(accionRapida === "ingreso" ? "Ingresos" : "Egresos"); onAccionUsada(); } }, [accionRapida, onAccionUsada]);
  const filtrados = registros.filter((x) => String(x.fecha).startsWith(anio));
  const gastosCategoria = Array.from(
    filtrados
      .filter((x) => x.tipo === "gasto")
      .reduce((mapa, x) => mapa.set(x.categoria || "Sin categoría", (mapa.get(x.categoria || "Sin categoría") ?? 0) + Number(x.monto)), new Map<string, number>()),
  );
  const totalGastos = gastosCategoria.reduce((suma, [, monto]) => suma + monto, 0);
  const coloresPastel = ["#15803d", "#22c55e", "#86efac", "#f59e0b", "#3b82f6", "#db2777"];
  let acumuladoPastel = 0;
  const fondoPastel = totalGastos
    ? `conic-gradient(${gastosCategoria.map(([, monto], i) => {
        const inicio = acumuladoPastel;
        acumuladoPastel += (monto / totalGastos) * 100;
        return `${coloresPastel[i % coloresPastel.length]} ${inicio}% ${acumuladoPastel}%`;
      }).join(",")})`
    : "conic-gradient(var(--line) 0 100%)";
  const tipo = pestana === "Ingresos" ? "ingreso" : "gasto";
  const categorias = tipo === "ingreso" ? categoriasIngreso : categoriasEgreso;
  async function guardarFilas() {
    for (const fila of filas.filter((x) => x.categoria && x.descripcion && x.monto)) {
      const f = new FormData(); Object.entries({ ...fila, tipo }).forEach(([k, v]) => f.set(k, v));
      await fetch("/api/modulos?modulo=Finanzas", { method: "POST", body: f });
    }
    setFilas([{ fecha: "", categoria: "", descripcion: "", monto: "", observaciones: "" }]); onReload();
  }
  async function renombrarCategoria(tipoCategoria:"ingreso"|"gasto", anterior:string, nueva:string) {
    const respuesta=await fetch("/api/modulos?modulo=Finanzas",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({accion:"renombrar_categoria",tipo:tipoCategoria,anterior,nueva})});
    if(respuesta.ok) onReload();
  }
  return <>
    <TituloPagina etiqueta="GESTIÓN FAMILIAR" titulo="Finanzas" descripcion="Ingresos, egresos, ahorro y categorías familiares." onAdd={onAdd} textoBoton="Nuevo registro" />
    <section className="pestanas">{["Resumen","Ingresos","Egresos","Categorías"].map((x) => <button key={x} className={pestana === x ? "seleccionada" : ""} onClick={() => setPestana(x)}>{x}</button>)}</section>
    {pestana === "Resumen" && <>
      <div className="filtro-anio"><label>Año <select value={anio} onChange={(e) => setAnio(e.target.value)}>{[...new Set([String(new Date().getFullYear()), ...anios])].map((x) => <option key={x}>{x}</option>)}</select></label></div>
      <section className="tarjeta grafico-finanza"><h2>Ingresos vs. egresos</h2><GraficoResumenFinanzas registros={filtrados} /><div className="tabla-apoyo resumen-mensual"><div><b>Mes</b>{["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map(m=><b key={m}>{m}</b>)}</div><div className="resumen-ingresos"><b>Ingresos</b>{Array.from({length:12},(_,i)=><span key={i}>+ S/{filtrados.filter(r=>r.tipo==="ingreso"&&new Date(`${r.fecha}T00:00:00`).getMonth()===i).reduce((s,r)=>s+Number(r.monto),0).toFixed(0)}</span>)}</div><div className="resumen-egresos"><b>Egresos</b>{Array.from({length:12},(_,i)=><span key={i}>- S/{filtrados.filter(r=>r.tipo==="gasto"&&new Date(`${r.fecha}T00:00:00`).getMonth()===i).reduce((s,r)=>s+Number(r.monto),0).toFixed(0)}</span>)}</div><div><b>Total</b>{Array.from({length:12},(_,i)=>{const ingreso=filtrados.filter(r=>r.tipo==="ingreso"&&new Date(`${r.fecha}T00:00:00`).getMonth()===i).reduce((s,r)=>s+Number(r.monto),0),egreso=filtrados.filter(r=>r.tipo==="gasto"&&new Date(`${r.fecha}T00:00:00`).getMonth()===i).reduce((s,r)=>s+Number(r.monto),0);return <span key={i}>S/{(ingreso-egreso).toFixed(0)}</span>})}</div></div><div className="leyenda-categorias"><strong>5 principales</strong>{["ingreso","gasto"].map(tipoLeyenda=><div key={tipoLeyenda}><small>{tipoLeyenda==="ingreso"?"Ingresos":"Egresos"}</small>{Array.from(filtrados.filter(r=>r.tipo===tipoLeyenda).reduce((m,r)=>m.set(r.categoria||"Sin categoría",(m.get(r.categoria||"Sin categoría")??0)+Number(r.monto)),new Map<string,number>())).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([categoria,monto])=><span key={categoria}>{categoria} · S/{monto.toFixed(0)}</span>)}</div>)}</div></section>
      <section className="tarjeta grafico-finanza"><h2>Distribución por categoría por mes</h2><div className="tabla-apoyo resumen-mensual"><div><b>Categorías</b>{["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map(m=><b key={m}>{m}</b>)}</div>{gastosCategoria.map(([categoria])=><div key={categoria}><b>{categoria}</b>{Array.from({length:12},(_,i)=>{const monto=filtrados.filter(r=>r.tipo==="gasto"&&r.categoria===categoria&&new Date(`${r.fecha}T00:00:00`).getMonth()===i).reduce((s,r)=>s+Number(r.monto),0);const totalMes=filtrados.filter(r=>r.tipo==="gasto"&&new Date(`${r.fecha}T00:00:00`).getMonth()===i).reduce((s,r)=>s+Number(r.monto),0);return <span key={i}>S/{monto.toFixed(0)}<small>{totalMes?(monto/totalMes*100).toFixed(0):0}%</small></span>})}</div>)}</div></section>
    </>}
    {(pestana === "Ingresos" || pestana === "Egresos") && <>
      <div className="acciones-editor"><button className="secundario" onClick={() => setFilas([...filas, { fecha:"",categoria:"",descripcion:"",monto:"",observaciones:"" }])}>+ Agregar fila</button><button className="primario" onClick={guardarFilas}>Guardar registro</button></div>
      <div className="tarjeta tabla-editor-finanzas"><div className="fila-finanza cabecera"><b>Fecha</b><b>Categoría</b><b>Detalle</b><b>Importe</b><b>Observación</b><b>Usuario</b></div>
        {filas.map((f, i) => <div className="fila-finanza" key={i}>
          <input type="date" value={f.fecha} onChange={(e) => setFilas(filas.map((x,n)=>n===i?{...x,fecha:e.target.value}:x))} />
          <select value={f.categoria} onChange={(e) => setFilas(filas.map((x,n)=>n===i?{...x,categoria:e.target.value,fecha:x.fecha||new Date().toLocaleDateString("sv-SE")}:x))}><option value="">Selecciona</option>{categorias.map((x)=><option key={x}>{x}</option>)}</select>
          <input value={f.descripcion} onChange={(e)=>setFilas(filas.map((x,n)=>n===i?{...x,descripcion:e.target.value}:x))}/><input type="number" step="0.01" value={f.monto} onChange={(e)=>setFilas(filas.map((x,n)=>n===i?{...x,monto:e.target.value}:x))}/><input value={f.observaciones} onChange={(e)=>setFilas(filas.map((x,n)=>n===i?{...x,observaciones:e.target.value}:x))}/><span>Usuario actual</span>
        </div>)}
        {registros.filter((x)=>x.tipo===tipo).map((r)=><div className={`fila-finanza guardada ${r.tipo==="ingreso"?"movimiento-ingreso":"movimiento-egreso"}`} key={r.id}><span>{new Date(`${r.fecha}T00:00:00`).toLocaleDateString("es-PE")}</span><span>{r.categoria}</span><span>{r.descripcion}</span><span>{r.tipo==="ingreso"?"+":"-"} S/{Number(r.monto).toFixed(2)}</span><span>{r.observaciones}</span><span>{r.usuario} {(r.propio || true) && <button className="secundario" onClick={()=>setEditando(r)}>Editar</button>}</span></div>)}
      </div>
    </>}
    {pestana === "Categorías" && <div className="grilla-categorias"><ListaCategorias titulo="Ingresos" categorias={Array.from(new Set([...categoriasIngreso,...registros.filter(x=>x.tipo==="ingreso").map(x=>x.categoria).filter(Boolean)]))} setCategorias={setCategoriasIngreso} tipo="ingreso" onRenombrar={renombrarCategoria}/><ListaCategorias titulo="Egresos" categorias={Array.from(new Set([...categoriasEgreso,...registros.filter(x=>x.tipo==="gasto").map(x=>x.categoria).filter(Boolean)]))} setCategorias={setCategoriasEgreso} tipo="gasto" onRenombrar={renombrarCategoria}/></div>}
    {editando&&<div className="velo"><section className="modal modal-corta"><div className="modal-cabecera"><h2>Editar registro</h2><button className="boton-icono" onClick={()=>setEditando(null)}>×</button></div><form onSubmit={async(e)=>{e.preventDefault();const r=await fetch("/api/modulos?modulo=Finanzas",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:editando.id,...Object.fromEntries(new FormData(e.currentTarget))})});if(r.ok){setEditando(null);onReload();}}}><div className="campos"><Campo nombre="fecha" etiqueta="Fecha" tipo="date" valorInicial={editando.fecha} obligatorio/><Campo nombre="categoria" etiqueta="Categoría" valorInicial={editando.categoria} obligatorio/><Campo nombre="descripcion" etiqueta="Detalle" valorInicial={editando.descripcion} obligatorio/><Campo nombre="monto" etiqueta="Importe" tipo="number" valorInicial={String(editando.monto)} obligatorio/><Campo nombre="observaciones" etiqueta="Observación" valorInicial={editando.observaciones} ancho/></div><div className="modal-acciones"><button type="button" className="secundario" onClick={()=>setEditando(null)}>Cancelar</button><button type="button" className="secundario" onClick={async()=>{if(confirm("¿Eliminar este registro?")){const r=await fetch("/api/modulos?modulo=Finanzas",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:editando.id})});if(r.ok){setEditando(null);onReload();}}}}>Eliminar</button><button className="primario">Guardar</button></div></form></section></div>}
  </>;
}

function ListaCategorias({ titulo, categorias, setCategorias, tipo, onRenombrar }: { titulo:string; categorias:string[]; setCategorias:(x:string[])=>void; tipo:"ingreso"|"gasto"; onRenombrar:(tipo:"ingreso"|"gasto",anterior:string,nueva:string)=>void }) {
  const [nueva,setNueva]=useState("");
  return <section className="tarjeta lista-categorias"><h2>{titulo}</h2>{categorias.map((x)=><div key={x}>{x}<button onClick={()=>{const nuevaCategoria=prompt("Nuevo nombre de categoría",x)?.trim();if(nuevaCategoria&&nuevaCategoria!==x){setCategorias(categorias.map(c=>c===x?nuevaCategoria:c));onRenombrar(tipo,x,nuevaCategoria);}}}>Editar</button></div>)}<form onSubmit={(e)=>{e.preventDefault();if(nueva){setCategorias([...categorias,nueva]);setNueva("");}}}><input value={nueva} onChange={(e)=>setNueva(e.target.value)} placeholder="Nueva categoría"/><button className="secundario">Agregar</button></form></section>;
}

function VistaProyectosEventos({ registros, onAdd, onReload }: { registros:Registro[]; onAdd:()=>void; onReload:()=>void }) {
  const [editando,setEditando]=useState<Registro|null>(null);
  const [participando,setParticipando]=useState<Registro|null>(null);
  async function actualizar(cuerpo:Record<string,unknown>) {
    const respuesta=await fetch("/api/modulos?modulo=Proyectos%20y%20eventos",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(cuerpo)});
    if(respuesta.ok){setEditando(null);onReload();}
  }
  async function eliminar(id:string) {
    if (!confirm("¿Eliminar este proyecto o evento?")) return;
    const respuesta=await fetch("/api/modulos?modulo=Proyectos%20y%20eventos",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    if(respuesta.ok) onReload();
  }
  async function aportar(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); if(!participando)return;
    const form=new FormData(e.currentTarget); form.set("accion","participar"); form.set("proyecto_id",participando.id);
    const respuesta=await fetch("/api/modulos?modulo=Proyectos%20y%20eventos",{method:"POST",body:form});
    if(respuesta.ok){setParticipando(null);onReload();}
  }
  return <>
    <TituloPagina etiqueta="PLANIFICACIÓN FAMILIAR" titulo="Proyectos y eventos" descripcion="Organiza actividades, metas financieras y compromisos familiares." onAdd={onAdd} textoBoton="＋ Nuevo registro"/>
    <div className="grilla-proyectos">{registros.map((r)=>{
      const meta=Number(r.presupuesto)||0;
      const comprometido=(r.compromisos??[]).reduce((s:number,x:Record<string,any>)=>s+Number(x.monto_comprometido||0),0);
      const abonado=(r.compromisos??[]).reduce((s:number,x:Record<string,any>)=>s+Number(x.monto_abonado||0),0);
      const porcentaje=meta?Math.min(100,abonado/meta*100):0;
      return <article className="tarjeta proyecto-card" key={r.id}>
        <div className="proyecto-arriba"><div><span className="etiqueta">{r.tipo||"EVENTO"}</span><h2>{r.titulo}</h2><p>{r.fecha_inicio?new Date(r.fecha_inicio).toLocaleString("es-PE"):"Sin inicio"} · {r.autor}</p></div><b className="insignia">{r.estado}</b></div>
        {r.descripcion&&<p>{r.descripcion}</p>}
        <div className="meta-proyecto"><div><span>Meta financiera</span><b>S/{meta.toFixed(2)}</b></div><div><span>Comprometido</span><b>S/{comprometido.toFixed(2)}</b></div><div><span>Abonado</span><b>S/{abonado.toFixed(2)}</b></div></div>
        <div className="barra-meta"><i style={{width:`${porcentaje}%`}}/></div>
        <div className="compromisos-proyecto">{(r.compromisos??[]).map((x:Record<string,any>)=><div key={x.id}><strong>{x.usuario}</strong><span>{x.actividad||x.comentario||`Aporte S/${Number(x.monto_comprometido).toFixed(2)}`}</span></div>)}</div>
        <div className="ficha-acciones"><button className="secundario" onClick={()=>setParticipando(r)}>Sumarme / aportar</button>{r.propio&&<><button className="secundario" onClick={()=>setEditando(r)}>Editar</button>{r.estado!=="Cerrado"&&<button className="primario" onClick={()=>actualizar({id:r.id,cerrar:true})}>Cerrar proyecto</button>}<button className="secundario" onClick={()=>eliminar(r.id)}>Eliminar</button></>}</div>
      </article>;
    })}</div>
    {!registros.length&&<section className="tarjeta estado-vacio"><h2>Sin proyectos o eventos</h2><p>Crea el primero para organizarlo con la familia.</p></section>}
    {editando&&<div className="velo"><section className="modal modal-corta"><div className="modal-cabecera"><h2>Editar proyecto o evento</h2><button className="boton-icono" onClick={()=>setEditando(null)}>×</button></div><form onSubmit={(e)=>{e.preventDefault();actualizar({id:editando.id,...Object.fromEntries(new FormData(e.currentTarget))});}}><div className="campos"><Campo nombre="titulo" etiqueta="Título" valorInicial={editando.titulo} obligatorio ancho/><CampoSelect nombre="tipo" etiqueta="Evento" opciones={["Proyecto","Evento","Actividad"]} valorInicial={editando.tipo} obligatorio/><Campo nombre="fecha_inicio" etiqueta="Inicio" tipo="datetime-local" valorInicial={String(editando.fecha_inicio??"").slice(0,16)}/><Campo nombre="lugar" etiqueta="Lugar" valorInicial={editando.lugar}/><Campo nombre="presupuesto" etiqueta="Meta financiera" tipo="number" valorInicial={String(editando.presupuesto||"")}/><Campo nombre="descripcion" etiqueta="Descripción" valorInicial={editando.descripcion} ancho/></div><div className="modal-acciones"><button type="button" className="secundario" onClick={()=>setEditando(null)}>Cancelar</button><button className="primario">Guardar</button></div></form></section></div>}
    {participando&&<div className="velo"><section className="modal modal-corta"><div className="modal-cabecera"><div><span className="etiqueta">PARTICIPAR</span><h2>{participando.titulo}</h2></div><button className="boton-icono" onClick={()=>setParticipando(null)}>×</button></div><form onSubmit={aportar}><div className="campos"><Campo nombre="monto" etiqueta="Monto comprometido" tipo="number"/><Campo nombre="abonado" etiqueta="Monto abonado" tipo="number"/><Campo nombre="actividad" etiqueta="Actividad que realizaré" ancho/><Campo nombre="comentario" etiqueta="Comentario" ancho/></div><div className="modal-acciones"><button type="button" className="secundario" onClick={()=>setParticipando(null)}>Cancelar</button><button className="primario">Confirmar participación</button></div></form></section></div>}
  </>;
}

function VistaMascotas({registros,onAdd,onReload}:{registros:Registro[];onAdd:()=>void;onReload:()=>void}) {
  const [pestana,setPestana]=useState("Registro");
  const [editando,setEditando]=useState<Registro|null>(null);
  const [veterinario,setVeterinario]=useState<Registro|null>(null);
  const [preview,setPreview]=useState<Registro|null>(null);
  const edad=(fecha?:string)=>{if(!fecha)return"Edad sin registrar";const meses=Math.max(0,Math.floor((Date.now()-new Date(`${fecha}T00:00:00`).getTime())/2629800000));return meses>=12?`${Math.floor(meses/12)} años`:`${meses} meses`;};
  async function editar(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!editando)return;await fetch("/api/modulos?modulo=Mascotas",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:editando.id,...Object.fromEntries(new FormData(e.currentTarget))})});setEditando(null);onReload();}
  async function guardarVet(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!veterinario)return;const f=new FormData(e.currentTarget);f.set("accion","veterinario");f.set("mascota_id",veterinario.id);await fetch("/api/modulos?modulo=Mascotas",{method:"POST",body:f});setVeterinario(null);onReload();}
  const documentos=registros.flatMap((m)=>(m.historial??[]).filter((h:Registro)=>h.url).map((h:Registro)=>({...h,titulo:`${m.nombre} · ${h.tipo||"Documento"}`})));
  return <>
    <TituloPagina etiqueta="FAMILIA Y MASCOTAS" titulo="Mascotas" descripcion="Fichas, controles veterinarios, vacunas y documentos." onAdd={onAdd} textoBoton="＋ Nueva mascota"/>
    <section className="pestanas">{["Registro","Veterinario","Documentos"].map((x)=><button key={x} className={pestana===x?"seleccionada":""} onClick={()=>setPestana(x)}>{x}</button>)}</section>
    {pestana==="Registro"&&<div className="grilla-mascotas">{registros.map((m)=>{
      const proximos=(m.historial??[]).filter((h:Registro)=>h.proximo_control&&new Date(`${h.proximo_control}T00:00:00`)>=new Date()).sort((a:Registro,b:Registro)=>String(a.proximo_control).localeCompare(String(b.proximo_control)));
      return <article className="tarjeta mascota-card" key={m.id}><div className="avatar-mascota"><PawPrint size={24}/></div><span className="etiqueta">{m.especie||"MASCOTA"}</span><h2>{m.nombre}</h2><p>{m.raza||"Sin raza"} · {edad(m.fecha_nacimiento)}</p><dl><div><dt>Sexo</dt><dd>{m.sexo||"Sin registrar"}</dd></div><div><dt>Peso</dt><dd>{m.peso_kg?`${m.peso_kg} kg`:"Sin registrar"}</dd></div><div><dt>Próxima vacuna/control</dt><dd>{proximos[0]?.proximo_control?new Date(`${proximos[0].proximo_control}T00:00:00`).toLocaleDateString("es-PE"):"Sin programar"}</dd></div></dl><div className="ficha-acciones"><button className="secundario" onClick={()=>setEditando(m)}>Editar</button><button className="primario" onClick={()=>setVeterinario(m)}>Registro veterinario</button></div></article>;
    })}</div>}
    {pestana==="Veterinario"&&<div className="registros-veterinarios">{registros.flatMap((m)=>(m.historial??[]).map((h:Registro)=>({...h,mascota:m.nombre}))).sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))).map((h,i)=><article className="tarjeta" key={`${h.id}-${i}`}><div><span className="etiqueta">{h.tipo||"ATENCIÓN"}</span><h2>{h.mascota}</h2><p>{new Date(`${h.fecha}T00:00:00`).toLocaleDateString("es-PE")} · {h.clinica||"Sin clínica"}</p></div><div><strong>{h.diagnostico||"Sin diagnóstico"}</strong><span>{h.tratamiento||h.veterinario||""}</span></div></article>)}</div>}
    {pestana==="Documentos"&&<section className="grilla-documentos">{documentos.map((d,i)=><article className="tarjeta documento-preview" key={`${d.id}-${i}`}>{d.url?.toLowerCase().includes(".pdf")?<iframe src={`${d.url}#page=1&toolbar=0`} title={d.titulo}/>:<img src={d.url} alt=""/>}<div><strong>{d.titulo}</strong><button onClick={()=>setPreview(d)}>Ver</button></div></article>)}</section>}
    {editando&&<div className="velo"><section className="modal modal-corta"><div className="modal-cabecera"><h2>Editar mascota</h2><button className="boton-icono" onClick={()=>setEditando(null)}>×</button></div><form onSubmit={editar}><div className="campos"><Campo name="nombre" etiqueta="Nombre" valorInicial={editando.nombre} obligatorio/><Campo nombre="especie" etiqueta="Especie" valorInicial={editando.especie} obligatorio/><Campo nombre="raza" etiqueta="Raza" valorInicial={editando.raza}/><CampoSelect nombre="sexo" etiqueta="Sexo" opciones={["Macho","Hembra","No registrado"]} valorInicial={editando.sexo}/><Campo nombre="fecha_nacimiento" etiqueta="Fecha de nacimiento" tipo="date" valorInicial={editando.fecha_nacimiento}/><Campo nombre="peso_kg" etiqueta="Peso (kg)" tipo="number" valorInicial={String(editando.peso_kg||"")}/><Campo nombre="observaciones" etiqueta="Observaciones" valorInicial={editando.observaciones} ancho/></div><div className="modal-acciones"><button type="button" className="secundario" onClick={()=>setEditando(null)}>Cancelar</button><button type="button" className="secundario" onClick={async()=>{if(confirm("¿Eliminar esta mascota?")){const r=await fetch("/api/modulos?modulo=Mascotas",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:editando.id})});if(r.ok){setEditando(null);onReload();}}}}>Eliminar mascota</button><button className="primario">Guardar</button></div></form></section></div>}
    {veterinario&&<div className="velo"><section className="modal"><div className="modal-cabecera"><div><span className="etiqueta">VETERINARIO</span><h2>{veterinario.nombre}</h2></div><button className="boton-icono" onClick={()=>setVeterinario(null)}>×</button></div><form onSubmit={guardarVet}><div className="campos"><Campo nombre="fecha" etiqueta="Fecha" tipo="date" obligatorio/><CampoSelect nombre="tipo" etiqueta="Tipo" opciones={["Consulta","Vacuna","Examen","Tratamiento","Control"]} obligatorio/><Campo nombre="clinica" etiqueta="Clínica"/><Campo nombre="veterinario" etiqueta="Veterinario"/><Campo nombre="diagnostico" etiqueta="Diagnóstico" ancho/><Campo nombre="tratamiento" etiqueta="Tratamiento" ancho/><Campo nombre="proximo_control" etiqueta="Próxima vacuna/control" tipo="date"/><Campo nombre="archivo" etiqueta="Documento" tipo="file"/></div><div className="modal-acciones"><button type="button" className="secundario" onClick={()=>setVeterinario(null)}>Cancelar</button><button className="primario">Guardar</button></div></form></section></div>}
    {preview&&<div className="velo"><section className="modal visor-documento"><div className="modal-cabecera"><h2>{preview.titulo}</h2><button className="boton-icono" onClick={()=>setPreview(null)}>×</button></div>{preview.url?.toLowerCase().includes(".pdf")?<iframe src={preview.url} title={preview.titulo}/>:<img src={preview.url} alt={preview.titulo}/>}</section></div>}
  </>;
}

function VistaArchivosHistoricos({registros,onAdd}:{registros:Registro[];onAdd:()=>void}) {
  const [preview,setPreview]=useState<Registro|null>(null);
  return <><TituloPagina etiqueta="MEMORIA FAMILIAR" titulo="Archivos históricos" descripcion="Fotografías y documentos compartidos con toda la familia." onAdd={onAdd} textoBoton="＋ Subir archivo"/>
    <section className="grilla-documentos">{registros.map((r,i)=><article className="tarjeta documento-preview" key={`${r.titulo}-${i}`}>{r.url?.toLowerCase().includes(".pdf")?<iframe src={`${r.url}#page=1&toolbar=0`} title={r.titulo}/>:<img src={r.url} alt=""/>}<div><strong>{r.titulo}</strong><small>{r.detalle}</small><button onClick={()=>setPreview(r)}>Ver</button></div></article>)}</section>
    {!registros.length&&<section className="tarjeta estado-vacio"><h2>Sin archivos</h2><p>Sube una fotografía o documento para compartirlo.</p></section>}
    {preview&&<div className="velo"><section className="modal visor-documento"><div className="modal-cabecera"><h2>{preview.titulo}</h2><button className="boton-icono" onClick={()=>setPreview(null)}>×</button></div>{preview.url?.toLowerCase().includes(".pdf")?<iframe src={preview.url} title={preview.titulo}/>:<img src={preview.url} alt={preview.titulo}/>}</section></div>}</>;
}

function VistaModulo({
  titulo,
  registros,
  onAdd,
  onReload,
}: {
  titulo: string;
  registros: Registro[];
  onAdd: () => void;
  onReload?: () => void;
}) {
  const [pestanaActiva, setPestanaActiva] = useState("Todos");
  const [busquedaModulo, setBusquedaModulo] = useState("");
  const [categoriaModulo, setCategoriaModulo] = useState("Ninguno");
  const [precioEditando,setPrecioEditando]=useState<Registro|null>(null);
  const [categoriaEditando,setCategoriaEditando]=useState("");
  const categoriasModulo = Array.from(
    new Set(registros.map((registro) => registro.estado).filter(Boolean)),
  ) as string[];
  const registrosVisibles =
    titulo === "Precios"
      ? registros.filter(
          (registro) =>
            registro.titulo.toLowerCase().includes(busquedaModulo.toLowerCase()) &&
            (categoriaModulo === "Ninguno" || registro.estado === categoriaModulo),
        )
      : registros;
  useEffect(() => {
    setPestanaActiva(
      titulo === "Finanzas" ? "Resumen" : titulo === "Precios" ? "Registros" : "Todos",
    );
  }, [titulo]);
  const registrosPestana =
    titulo === "Finanzas" && pestanaActiva === "Ingresos"
      ? registrosVisibles.filter((x) => x.detalle.toLowerCase().startsWith("ingreso"))
      : titulo === "Finanzas" && pestanaActiva === "Gastos"
        ? registrosVisibles.filter((x) => x.detalle.toLowerCase().startsWith("gasto"))
        : registrosVisibles;
  const descripciones: Record<string, string> = {
    Salud:
      "Historial médico, medicamentos, vacunas, exámenes y signos vitales.",
    Finanzas: "Ingresos, gastos y reportes para cuidar la economía familiar.",
    Precios: "Compara tiendas y consulta el historial de precios por producto.",
    Educación: "Estudios, cursos, certificados y documentos académicos.",
    Seguros: "Pólizas, coberturas, vencimientos y contactos de asistencia.",
    "Proyectos y eventos":
      "Itinerarios, participantes, reservas, presupuestos y fechas.",
    Mascotas: "Información e historial veterinario de cada mascota.",
    "Archivos históricos": "Documentos, fotografías y recuerdos de la familia.",
  };
  return (
    <>
      <TituloPagina
        etiqueta="GESTIÓN FAMILIAR"
        titulo={titulo}
        descripcion={descripciones[titulo]}
        onAdd={titulo === "Precios" ? undefined : onAdd}
        textoBoton={titulo === "Precios" ? "Agregar precio" : "Nuevo registro"}
      />
      <section className="pestanas">
        {(titulo === "Salud"
          ? [
              "Resumen",
              "Historial médico",
              "Medicamentos",
              "Vacunas",
              "Exámenes",
              "Signos",
            ]
          : titulo === "Finanzas"
            ? ["Resumen", "Ingresos", "Gastos", "Reportes"]
            : titulo === "Precios"
              ? ["Registros", "Producto", "Categorías"]
              : ["Todos", "Próximos", "Documentos"]
        ).map((x) => (
          <button
            className={pestanaActiva === x ? "seleccionada" : ""}
            key={x}
            onClick={() => setPestanaActiva(x)}
          >
            {x}
          </button>
        ))}
      </section>
      {titulo === "Precios" && (
        <section className="comparador tarjeta">
          <div className="buscador grande">
            ⌕
            <input
              placeholder="Buscar producto…"
              value={busquedaModulo}
              onChange={(e) => setBusquedaModulo(e.target.value)}
            />
          </div>
          <select
            aria-label="Filtrar por categoría"
            value={categoriaModulo}
            onChange={(e) => setCategoriaModulo(e.target.value)}
          >
            <option>Ninguno</option>
            {categoriasModulo.map((categoria) => (
              <option key={categoria}>{categoria}</option>
            ))}
          </select>
        </section>
      )}
      {titulo === "Precios" && pestanaActiva === "Producto" && (
        <VistaProductos precios={registrosVisibles} />
      )}
      {titulo === "Precios" && pestanaActiva === "Categorías" && (
        <section className="grilla-categorias-precio">
          {categoriasModulo.map((categoria) => (
            <article className="tarjeta" key={categoria}>
              <span className="etiqueta">CATEGORÍA</span>
              <h2>{categoria}</h2>
              <strong>{registros.filter((r) => r.estado === categoria).length}</strong>
              <small>precios registrados</small>
              <button className="secundario" onClick={() => setCategoriaEditando(categoria)}>Editar</button>
            </article>
          ))}
        </section>
      )}
      {titulo === "Precios" && pestanaActiva === "Registros" && (
        <section className="tarjeta tabla-precios-registros">
          <div className="cabecera-registros-precio">
            <span>Registros de precios</span>
            <button className="primario" onClick={onAdd}>＋</button>
          </div>
          <div className="fila-registro-precio cabecera"><b>Fecha</b><b>Categoría</b><b>Producto</b><b>Prest.</b><b>Price</b><b>Valor</b><b>Tienda</b></div>
          {registrosVisibles.map((r, i) => <div className="fila-registro-precio" key={`${r.titulo}-${r.fecha}-${i}`}>
            <span className="fecha-precio">{r.fecha ? new Date(r.fecha).toLocaleDateString("es-PE", { day:"2-digit", month:"2-digit" }) : "—"}<small>{r.estado}</small></span>
            <span>{r.estado}</span><strong>{r.titulo}</strong><span>{r.presentacion}</span>
            <span>S/{Number(r.precio).toFixed(2)}</span><span>S/{Number(r.valor).toFixed(3)}</span><span className="tienda-precio">{r.tienda}<button onClick={()=>setPrecioEditando(r)}>Editar</button></span>
          </div>)}
        </section>
      )}
      {precioEditando&&<div className="velo"><section className="modal modal-corta"><div className="modal-cabecera"><div><span className="etiqueta">EDITAR REGISTRO</span><h2>{precioEditando.titulo}</h2></div><button className="boton-icono" onClick={()=>setPrecioEditando(null)}>×</button></div><form onSubmit={async(e)=>{e.preventDefault();const valores=Object.fromEntries(new FormData(e.currentTarget));const respuesta=await fetch("/api/precios",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:precioEditando.id,...valores})});if(respuesta.ok){setPrecioEditando(null);onReload?.();}}}><div className="campos"><Campo nombre="fecha" etiqueta="Fecha" tipo="date" valorInicial={String(precioEditando.fecha??"").slice(0,10)} obligatorio/><Campo nombre="tienda" etiqueta="Tienda" valorInicial={precioEditando.tienda} obligatorio/></div><div className="modal-acciones"><button type="button" className="secundario" onClick={()=>setPrecioEditando(null)}>Cancelar</button><button type="button" className="secundario" onClick={async()=>{if(confirm("¿Eliminar este registro?")){const r=await fetch("/api/precios",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:precioEditando.id})});if(r.ok){setPrecioEditando(null);onReload?.();}}}}>Eliminar</button><button className="primario">Guardar</button></div></form></section></div>}
      {categoriaEditando&&<div className="velo"><section className="modal modal-corta"><div className="modal-cabecera"><h2>Editar categoría</h2><button className="boton-icono" onClick={()=>setCategoriaEditando("")}>×</button></div><form onSubmit={async(e)=>{e.preventDefault();const categoria_nueva=String(new FormData(e.currentTarget).get("categoria")||"");const r=await fetch("/api/precios",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({accion:"categoria",categoria_actual:categoriaEditando,categoria_nueva})});if(r.ok){setCategoriaEditando("");onReload?.();}}}><Campo nombre="categoria" etiqueta="Categoría" valorInicial={categoriaEditando} obligatorio ancho/><div className="modal-acciones"><button type="button" className="secundario" onClick={()=>setCategoriaEditando("")}>Cancelar</button><button className="primario">Guardar</button></div></form></section></div>}
      {titulo !== "Precios" && (pestanaActiva === "Todos" || pestanaActiva === "Resumen" || pestanaActiva === "Ingresos" || pestanaActiva === "Gastos") && registrosPestana.length ? (
        <section className="tarjeta tabla">
          <div className="tabla-cabecera">
            <span>{titulo === "Precios" ? "Descripción de producto" : "Registro"}</span>
            <span>{titulo === "Precios" ? "Información" : "Detalle"}</span>
            <span>{titulo === "Precios" ? "Valor" : "Información"}</span>
            <span>{titulo === "Precios" ? "Categoría" : "Estado"}</span>
          </div>
          {registrosPestana.map((r, indice) => (
            <button
              className="tabla-fila"
              key={`${r.titulo}-${r.detalle}-${indice}`}
              onClick={() => r.url && window.open(r.url, "_blank", "noopener,noreferrer")}
            >
              <span>
                <i className="punto" /> <strong>{r.titulo}</strong>
              </span>
              <span>{r.detalle}</span>
              <span>{r.meta}</span>
              <span>
                <b className={titulo === "Precios" ? "" : "insignia"}>
                  {r.url ? "Descargar" : r.estado}
                </b>
                {titulo === "Precios" ? "" : " ›"}
              </span>
            </button>
          ))}
        </section>
      ) : titulo !== "Precios" ? (
        <section className="tarjeta estado-vacio">
          <h2>
            {pestanaActiva === "Todos"
              ? "Sin registros"
              : pestanaActiva === "Próximos"
                ? "Sin registros próximos"
                : "Sin documentos"}
          </h2>
          <p>
            {pestanaActiva === "Todos"
              ? "Los datos que agregues aparecerán aquí."
              : `Los elementos de ${pestanaActiva.toLowerCase()} aparecerán aquí.`}
          </p>
        </section>
      ) : null}
    </>
  );
}

type UsuarioConfig = {
  id: string;
  usuario_id: string | null;
  nombre_completo: string;
  codigo: string;
  activo: boolean;
  rol: "administrador" | "integrante";
  requiere_asistencia: boolean;
};
type AccesoConfig = {
  id: string;
  nombre: string;
  codigo: string | null;
  exitoso: boolean;
  direccion_ip: string | null;
  dispositivo: string | null;
  navegador: string | null;
  creado_en: string;
};
function VistaConfiguracion({ onChanged }: { onChanged: () => void }) {
  const [usuarios, setUsuarios] = useState<UsuarioConfig[]>([]);
  const [accesos, setAccesos] = useState<AccesoConfig[]>([]);
  const [guardado, setGuardado] = useState("");
  const [error, setError] = useState("");
  async function cargarConfiguracion() {
    const respuesta = await fetch("/api/configuracion");
    const json = await respuesta.json();
    setUsuarios(json.integrantes ?? []);
    setAccesos(json.accesos ?? []);
  }
  useEffect(() => {
    cargarConfiguracion();
  }, []);
  async function guardarUsuario(usuario: UsuarioConfig, restablecer = false) {
    const respuesta = await fetch("/api/configuracion", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...usuario, restablecer }),
    });
    const json = await respuesta.json();
    if (!respuesta.ok) {
      setError(json.error ?? "No se pudo guardar");
      return;
    }
    setError("");
    setGuardado(usuario.id);
    window.setTimeout(() => setGuardado(""), 1800);
    await cargarConfiguracion();
    onChanged();
  }
  return (
    <>
      <TituloPagina
        etiqueta="SOLO ADMINISTRADOR"
        titulo="Configuración"
        descripcion="Edita el nombre y código de acceso de los integrantes."
        textoBoton=""
      />
      {error && <p className="error-config">{error}</p>}
      <section className="tarjeta configuracion-lista">
        {usuarios.map((u, i) => (
          <form
            key={u.id}
            onSubmit={(e) => {
              e.preventDefault();
              guardarUsuario(u);
            }}
          >
            <span className="avatar">
              {u.nombre_completo
                .split(" ")
                .slice(0, 2)
                .map((x) => x[0])
                .join("")}
            </span>
            <label>
              <span>
                Nombre completo <b className="obligatorio">*</b>
              </span>
              <input
                required
                value={u.nombre_completo}
                onChange={(e) =>
                  setUsuarios(
                    usuarios.map((x, n) =>
                      n === i ? { ...x, nombre_completo: e.target.value } : x,
                    ),
                  )
                }
              />
            </label>
            <label>
              <span>
                {u.usuario_id ? "Código de acceso" : "Asignar código de acceso"}
                {u.usuario_id && (
                  <>
                    {" "}
                    <b className="obligatorio">*</b>
                  </>
                )}
              </span>
              <input
                required={Boolean(u.usuario_id)}
                inputMode="numeric"
                maxLength={8}
                value={u.codigo}
                placeholder="8 dígitos"
                onChange={(e) =>
                  setUsuarios(
                    usuarios.map((x, n) =>
                      n === i
                        ? { ...x, codigo: e.target.value.replace(/\D/g, "") }
                        : x,
                    ),
                  )
                }
              />
            </label>
            <label>
              <span>
                Rol <b className="obligatorio">*</b>
              </span>
              <select
                required
                value={u.rol ?? "integrante"}
                onChange={(e) =>
                  setUsuarios(
                    usuarios.map((x, n) =>
                      n === i
                        ? {
                            ...x,
                            rol: e.target.value as
                              | "administrador"
                              | "integrante",
                          }
                        : x,
                    ),
                  )
                }
              >
                <option value="integrante">Integrante</option>
                <option value="administrador">Administrador</option>
              </select>
            </label>
            <label className="check-asistencia">
              <span>Asistencia</span>
              <span>
                <input
                  type="checkbox"
                  checked={u.requiere_asistencia}
                  onChange={(e) =>
                    setUsuarios(
                      usuarios.map((x, n) =>
                        n === i
                          ? { ...x, requiere_asistencia: e.target.checked }
                          : x,
                      ),
                    )
                  }
                />{" "}
                Requiere asistencia
              </span>
            </label>
            <div className="guardar-config">
              <button className="primario">Guardar</button>
              {u.usuario_id && (
                <button
                  type="button"
                  className="restablecer"
                  onClick={() => guardarUsuario(u, true)}
                >
                  Restablecer contraseña
                </button>
              )}
              {guardado === u.id && <small>✓ Guardado</small>}
            </div>
          </form>
        ))}
      </section>
      <section className="separada">
        <div className="cabecera-seccion">
          <div>
            <h2>Historial de accesos</h2>
            <p>Ingresos e intentos desde computadoras y móviles.</p>
          </div>
        </div>
        <div className="tarjeta tabla tabla-accesos">
          <div className="tabla-cabecera">
            <span>Usuario</span><span>Dispositivo</span><span>Fecha e IP</span><span>Resultado</span>
          </div>
          {accesos.length ? accesos.map((acceso) => (
            <div className="tabla-fila" key={acceso.id}>
              <span><strong>{acceso.nombre}</strong><small>{acceso.codigo ?? "Código inválido"}</small></span>
              <span>{acceso.dispositivo ?? "No identificado"}</span>
              <span>{new Date(acceso.creado_en).toLocaleString("es-PE")}<small>{acceso.direccion_ip ?? "IP no disponible"}</small></span>
              <span><b className="insignia">{acceso.exitoso ? "Ingreso correcto" : "Intento fallido"}</b></span>
            </div>
          )) : <div className="estado-vacio"><p>Aún no hay accesos registrados.</p></div>}
        </div>
      </section>
    </>
  );
}

function TituloPagina({
  etiqueta,
  titulo,
  descripcion,
  onAdd,
  textoBoton,
}: {
  etiqueta: string;
  titulo: string;
  descripcion: string;
  onAdd?: () => void;
  textoBoton: string;
}) {
  return (
    <section className="titulo-pagina">
      <div>
        <div className="etiqueta">{etiqueta}</div>
        <h1>{titulo}</h1>
        <p>{descripcion}</p>
      </div>
      {onAdd && (
        <button className="primario" onClick={onAdd}>
          ＋ {textoBoton}
        </button>
      )}
    </section>
  );
}

function ModalNuevoIntegrante({
  onClose,
  onSaved,
  esAdministrador,
}: {
  onClose: () => void;
  onSaved: () => void;
  esAdministrador: boolean;
}) {
  const [error, setError] = useState("");
  async function crear(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const valores = Object.fromEntries(new FormData(e.currentTarget));
    const respuesta = await fetch("/api/datos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(valores),
    });
    const json = await respuesta.json();
    if (!respuesta.ok)
      return setError(json.error ?? "No se pudo crear el integrante");
    onSaved();
  }
  return (
    <div
      className="velo"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="modal modal-corta"
        role="dialog"
        aria-modal="true"
        aria-label="Nuevo integrante"
      >
        <div className="modal-cabecera">
          <div>
            <div className="etiqueta">NUEVO INTEGRANTE</div>
            <h2>Agregar a la familia</h2>
          </div>
          <button className="boton-icono" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <form onSubmit={crear}>
          <div className="campos">
            <label className="ancho">
              <span>
                Nombre completo <b className="obligatorio">*</b>
              </span>
              <input
                name="nombre_completo"
                required
                autoFocus
                placeholder="Nombres y apellidos"
              />
            </label>
            {!esAdministrador && (
              <label className="ancho">
                <span>
                  Parentesco contigo <b className="obligatorio">*</b>
                </span>
                <select name="parentesco" required defaultValue="">
                  <option value="" disabled>
                    Selecciona una relación
                  </option>
                  {RELACIONES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {error && <p className="error">{error}</p>}
          <div className="modal-acciones">
            <button type="button" className="secundario" onClick={onClose}>
              Cancelar
            </button>
            <button className="primario">Crear integrante</button>
          </div>
        </form>
      </section>
    </div>
  );
}

const seccionesFicha = [
  [
    "Datos personales",
    [
      ["nombre", "Nombre completo"],
      ["dni", "DNI"],
      ["fecha_nacimiento", "Fecha de nacimiento", "date"],
      ["lugar_nacimiento", "Lugar de nacimiento"],
    ],
  ],
  [
    "Información laboral",
    [
      ["empresa", "Empresa"],
      ["cargo", "Cargo"],
      ["direccion_trabajo", "Dirección de trabajo"],
      ["telefono_laboral", "Teléfono laboral"],
    ],
  ],
  [
    "Salud",
    [
      ["tipo_sangre", "Tipo de sangre"],
      ["seguro_medico", "Seguro médico"],
      ["alergias", "Alergias"],
      ["enfermedades_relevantes", "Enfermedades relevantes"],
      ["medicacion_habitual", "Medicación habitual"],
      ["medico_referencia", "Médico de referencia"],
    ],
  ],
  ["Observaciones generales", [["observaciones", "Observaciones generales"]]],
] as const;

const RELACIONES = [
  "Madre",
  "Padre",
  "Hija",
  "Hijo",
  "Hermana",
  "Hermano",
  "Esposa",
  "Esposo",
  "Pareja",
  "Abuela",
  "Abuelo",
  "Nieta",
  "Nieto",
  "Tía",
  "Tío",
  "Prima",
  "Primo",
  "Sobrina",
  "Sobrino",
  "Tutora",
  "Tutor",
  "Amiga",
  "Amigo",
  "Otro",
];
const ESTADOS_CIVILES = [
  "Soltero/a",
  "Casado/a",
  "Conviviente",
  "Separado/a",
  "Divorciado/a",
  "Viudo/a",
  "No especificado",
];

function fechaActualizacion(valor?: string) {
  return valor
    ? new Intl.DateTimeFormat("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(valor))
    : "Sin actualización";
}

function ModalFicha({
  integrante,
  puedeEditar,
  onClose,
  onSaved,
  soloSalud = false,
}: {
  integrante: Integrante;
  puedeEditar: boolean;
  onClose: () => void;
  onSaved: () => void;
  soloSalud?: boolean;
}) {
  const [error, setError] = useState("");
  const [adjuntos, setAdjuntos] = useState<Registro[]>([]);
  async function cargarAdjuntos() {
    const respuesta = await fetch(`/api/modulos?modulo=Adjuntos%20integrante&integrante_id=${integrante.id}`);
    if (respuesta.ok) setAdjuntos((await respuesta.json()).registros ?? []);
  }
  useEffect(() => { cargarAdjuntos(); }, [integrante.id]);
  async function subirAdjunto(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;
    const form = new FormData(); form.set("archivo", archivo); form.set("titulo", archivo.name); form.set("integrante_id", integrante.id);
    const respuesta = await fetch("/api/modulos?modulo=Adjuntos%20integrante", { method: "POST", body: form });
    if (!respuesta.ok) setError((await respuesta.json()).error ?? "No se pudo adjuntar el archivo");
    else { evento.target.value = ""; await cargarAdjuntos(); }
  }
  const [contactos, setContactos] = useState(
    integrante.contactos.length
      ? integrante.contactos
      : [{ nombre: "", relacion: "", telefono: "" }],
  );
  const [fechasImportantes, setFechasImportantes] = useState(
    integrante.fechas.length
      ? integrante.fechas
      : [{ titulo: "", tipo: "completa" as const, valor: "" }],
  );
  const [cuentas, setCuentas] = useState(
    integrante.cuentas.length
      ? integrante.cuentas
      : [{ banco_principal: "", tipo_cuenta: "", observaciones: "" }],
  );
  const [telefonos, setTelefonos] = useState(
    integrante.telefono?.split("\n").filter(Boolean).length
      ? integrante.telefono.split("\n").filter(Boolean)
      : [""],
  );
  const [correos, setCorreos] = useState(
    integrante.correo_electronico?.split("\n").filter(Boolean).length
      ? integrante.correo_electronico.split("\n").filter(Boolean)
      : [""],
  );
  async function guardarFicha(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!puedeEditar) return;
    const valores = Object.fromEntries(new FormData(e.currentTarget));
    const respuesta = await fetch("/api/datos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: integrante.id,
        modo_salud: soloSalud,
        ...valores,
        telefono: telefonos.filter(Boolean).join("\n"),
        correo_electronico: correos.filter(Boolean).join("\n"),
        contactos,
        fechas: fechasImportantes,
        cuentas,
      }),
    });
    const json = await respuesta.json();
    if (!respuesta.ok)
      return setError(json.error ?? "No se pudo guardar la ficha");
    onSaved();
  }
  return (
    <div
      className="velo"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className={`modal modal-ficha ${soloSalud ? "solo-salud" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha de ${integrante.nombre}`}
      >
        <div className="modal-cabecera">
          <div>
            <div className="etiqueta">
              {puedeEditar ? "FICHA EDITABLE" : "SOLO LECTURA"}
            </div>
            <h2>{integrante.nombre}</h2>
            <p>
              {integrante.edad} · {integrante.lugar}
            </p>
          </div>
          <button className="boton-icono" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <form onSubmit={guardarFicha}>
          {seccionesFicha.map(([titulo, campos]) => (
            <fieldset
              key={titulo}
              disabled={soloSalud && titulo !== "Salud"}
            >
              <legend>{titulo}</legend>
              <div className="campos">
                {campos.map(([nombre, etiqueta, tipo]) => (
                  <label key={nombre}>
                    <span>
                      {etiqueta}
                      {nombre === "nombre" && (
                        <>
                          {" "}
                          <b className="obligatorio">*</b>
                        </>
                      )}
                    </span>
                    {nombre === "tipo_sangre" ? (
                      <select
                        name={nombre}
                        defaultValue={integrante.tipo_sangre ?? ""}
                        disabled={!puedeEditar}
                      >
                        <option value="">Selecciona</option>
                        {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "No conoce"].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        name={nombre}
                        required={nombre === "nombre"}
                        type={tipo ?? "text"}
                        defaultValue={String(
                          integrante[nombre as keyof Integrante] ?? "",
                        )}
                        disabled={!puedeEditar}
                      />
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <fieldset>
            <legend>Contacto y estado civil</legend>
            <div className="campos">
              <label>
                <span>Estado civil</span>
                <select
                  name="estado_civil"
                  defaultValue={integrante.estado_civil}
                  disabled={!puedeEditar}
                >
                  <option value="">Selecciona</option>
                  {ESTADOS_CIVILES.map((e) => (
                    <option key={e}>{e}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="listas-contacto">
              <div>
                <div className="subtitulo-lista">
                  <small>
                    Teléfonos · Actualizado:{" "}
                    {fechaActualizacion(integrante.actualizado_en)}
                  </small>
                  {puedeEditar && (
                    <button
                      type="button"
                      className="secundario"
                      onClick={() => setTelefonos([...telefonos, ""])}
                    >
                      ＋ Agregar
                    </button>
                  )}
                </div>
                {telefonos.map((t, i) => (
                  <div className="linea-contacto" key={i}>
                    <input
                      type="tel"
                      value={t}
                      disabled={!puedeEditar}
                      placeholder="Número de teléfono"
                      onChange={(e) =>
                        setTelefonos(
                          telefonos.map((x, n) =>
                            n === i ? e.target.value : x,
                          ),
                        )
                      }
                    />
                    {puedeEditar && telefonos.length > 1 && (
                      <button
                        type="button"
                        className="quitar"
                        onClick={() =>
                          setTelefonos(telefonos.filter((_, n) => n !== i))
                        }
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <div className="subtitulo-lista">
                  <small>Correos electrónicos</small>
                  {puedeEditar && (
                    <button
                      type="button"
                      className="secundario"
                      onClick={() => setCorreos([...correos, ""])}
                    >
                      ＋ Agregar
                    </button>
                  )}
                </div>
                {correos.map((c, i) => (
                  <div className="linea-contacto" key={i}>
                    <input
                      type="email"
                      value={c}
                      disabled={!puedeEditar}
                      placeholder="correo@ejemplo.com"
                      onChange={(e) =>
                        setCorreos(
                          correos.map((x, n) => (n === i ? e.target.value : x)),
                        )
                      }
                    />
                    {puedeEditar && correos.length > 1 && (
                      <button
                        type="button"
                        className="quitar"
                        onClick={() =>
                          setCorreos(correos.filter((_, n) => n !== i))
                        }
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </fieldset>
          <fieldset>
            <legend>Domicilio actual</legend>
            <div className="campos">
              <label>
                <span>Departamento</span>
                <input
                  name="departamento"
                  defaultValue={integrante.departamento}
                  disabled={!puedeEditar}
                />
              </label>
              <label>
                <span>Provincia</span>
                <input
                  name="provincia"
                  defaultValue={integrante.provincia}
                  disabled={!puedeEditar}
                />
              </label>
              <label>
                <span>Distrito</span>
                <input
                  name="distrito"
                  defaultValue={integrante.distrito}
                  disabled={!puedeEditar}
                />
              </label>
              <label>
                <span>Dirección</span>
                <input
                  name="direccion_actual"
                  defaultValue={integrante.direccion_actual}
                  disabled={!puedeEditar}
                />
              </label>
            </div>
            {integrante.direccion_actual && (
              <a
                className="enlace-mapas"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([integrante.direccion_actual, integrante.distrito, integrante.provincia, integrante.departamento].filter(Boolean).join(", "))}`}
                target="_blank"
                rel="noreferrer"
              >
                Ver ubicación en Google Maps ↗
              </a>
            )}
          </fieldset>
          <ListaEditable
            titulo="Información financiera"
            actualizado={integrante.actualizado_en}
            puedeEditar={puedeEditar}
            onAdd={() =>
              setCuentas([
                ...cuentas,
                { banco_principal: "", tipo_cuenta: "", observaciones: "" },
              ])
            }
          >
            {cuentas.map((c, i) => (
              <div className="registro-repetible" key={i}>
                <div className="campos">
                  <label>
                    <span>Banco principal</span>
                    <input
                      value={c.banco_principal}
                      disabled={!puedeEditar}
                      onChange={(e) =>
                        setCuentas(
                          cuentas.map((x, n) =>
                            n === i
                              ? { ...x, banco_principal: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    <span>Tipo de cuenta</span>
                    <input
                      value={c.tipo_cuenta}
                      disabled={!puedeEditar}
                      onChange={(e) =>
                        setCuentas(
                          cuentas.map((x, n) =>
                            n === i ? { ...x, tipo_cuenta: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="ancho">
                    <span>Observaciones</span>
                    <input
                      value={c.observaciones}
                      disabled={!puedeEditar}
                      onChange={(e) =>
                        setCuentas(
                          cuentas.map((x, n) =>
                            n === i
                              ? { ...x, observaciones: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
                {puedeEditar && cuentas.length > 1 && (
                  <button
                    type="button"
                    className="quitar"
                    onClick={() =>
                      setCuentas(cuentas.filter((_, n) => n !== i))
                    }
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          </ListaEditable>
          <ListaEditable
            titulo="Contactos de emergencia"
            actualizado={integrante.actualizado_en}
            puedeEditar={puedeEditar}
            onAdd={() =>
              setContactos([
                ...contactos,
                { nombre: "", relacion: "", telefono: "" },
              ])
            }
          >
            {contactos.map((c, i) => (
              <div className="registro-repetible" key={i}>
                <div className="campos tres">
                  <label>
                    <span>Nombre</span>
                    <input
                      value={c.nombre}
                      disabled={!puedeEditar}
                      onChange={(e) =>
                        setContactos(
                          contactos.map((x, n) =>
                            n === i ? { ...x, nombre: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    <span>Relación</span>
                    <select
                      value={c.relacion}
                      disabled={!puedeEditar}
                      onChange={(e) =>
                        setContactos(
                          contactos.map((x, n) =>
                            n === i ? { ...x, relacion: e.target.value } : x,
                          ),
                        )
                      }
                    >
                      <option value="">Selecciona</option>
                      {RELACIONES.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Teléfono</span>
                    <input
                      value={c.telefono}
                      disabled={!puedeEditar}
                      onChange={(e) =>
                        setContactos(
                          contactos.map((x, n) =>
                            n === i ? { ...x, telefono: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
                {puedeEditar && contactos.length > 1 && (
                  <button
                    type="button"
                    className="quitar"
                    onClick={() =>
                      setContactos(contactos.filter((_, n) => n !== i))
                    }
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          </ListaEditable>
          <ListaEditable
            titulo="Fechas importantes"
            actualizado={integrante.actualizado_en}
            puedeEditar={puedeEditar}
            onAdd={() =>
              setFechasImportantes([
                ...fechasImportantes,
                { titulo: "", tipo: "completa", valor: "" },
              ])
            }
          >
            <div className="tabla-fechas">
              <div className="tabla-fechas-cabecera">
                <span>Descripción</span>
                <span>Tipo</span>
                <span>Fecha o regla</span>
                <span />
              </div>
              {fechasImportantes.map((f, i) => (
                <div className="tabla-fechas-fila" key={i}>
                  <input
                    aria-label="Descripción"
                    value={f.titulo}
                    disabled={!puedeEditar}
                    onChange={(e) =>
                      setFechasImportantes(
                        fechasImportantes.map((x, n) =>
                          n === i ? { ...x, titulo: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <select
                    aria-label="Tipo de fecha"
                    value={f.tipo}
                    disabled={!puedeEditar}
                    onChange={(e) =>
                      setFechasImportantes(
                        fechasImportantes.map((x, n) =>
                          n === i
                            ? {
                                ...x,
                                tipo: e.target.value as
                                  | "completa"
                                  | "anual"
                                  | "regla",
                                valor: "",
                              }
                            : x,
                        ),
                      )
                    }
                  >
                    <option value="completa">Fecha completa</option>
                    <option value="anual">Día y mes</option>
                    <option value="regla">Regla anual</option>
                  </select>
                  <input
                    aria-label="Fecha o regla"
                    type={f.tipo === "completa" ? "date" : "text"}
                    placeholder={
                      f.tipo === "anual"
                        ? "Ej. 15/06"
                        : f.tipo === "regla"
                          ? "Ej. tercer domingo de junio"
                          : ""
                    }
                    value={f.valor}
                    disabled={!puedeEditar}
                    onChange={(e) =>
                      setFechasImportantes(
                        fechasImportantes.map((x, n) =>
                          n === i ? { ...x, valor: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  {puedeEditar && fechasImportantes.length > 1 ? (
                    <button
                      type="button"
                      className="quitar"
                      onClick={() =>
                        setFechasImportantes(
                          fechasImportantes.filter((_, n) => n !== i),
                        )
                      }
                    >
                      Eliminar
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>
          </ListaEditable>
          {!soloSalud && <fieldset>
            <legend>Archivos adjuntos</legend>
            {puedeEditar && <label className="secundario" style={{ display: "inline-block", cursor: "pointer" }}>＋ Adjuntar archivo<input type="file" accept="image/*,.pdf,.doc,.docx" hidden onChange={subirAdjunto} /></label>}
            <div className="lista-adjuntos">{adjuntos.map((archivo) => <a key={archivo.id} href={archivo.url} target="_blank" rel="noreferrer">{archivo.titulo} ↗</a>)}{!adjuntos.length && <small>Sin archivos adjuntos.</small>}</div>
          </fieldset>}
          {error && <p className="error">{error}</p>}
          <div className="modal-acciones">
            {!soloSalud && <button type="button" className="secundario" onClick={onClose}>{puedeEditar ? "Cancelar" : "Cerrar"}</button>}
            {puedeEditar && (
              <button className="primario">{soloSalud ? "← Volver y guardar" : "Guardar cambios"}</button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

function ListaEditable({
  titulo,
  actualizado,
  puedeEditar,
  onAdd,
  children,
}: {
  titulo: string;
  actualizado?: string;
  puedeEditar: boolean;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend>{titulo}</legend>
      <div className="subtitulo-lista">
        <small>Actualizado: {fechaActualizacion(actualizado)}</small>
        {puedeEditar && (
          <button type="button" className="secundario" onClick={onAdd}>
            ＋ Agregar
          </button>
        )}
      </div>
      {children}
    </fieldset>
  );
}

function Campo({
  nombre,
  name,
  etiqueta,
  tipo = "text",
  obligatorio = false,
  ancho = false,
  valorInicial,
}: {
  nombre?: string;
  name?: string;
  etiqueta: string;
  tipo?: string;
  obligatorio?: boolean;
  ancho?: boolean;
  valorInicial?: string;
}) {
  return (
    <label className={ancho ? "ancho" : ""}>
      <span>
        {etiqueta} {obligatorio && <b className="obligatorio">*</b>}
      </span>
      <input
        name={nombre ?? name}
        type={tipo}
        required={obligatorio}
        step={tipo === "number" ? "0.01" : undefined}
        defaultValue={valorInicial ?? (tipo === "date" && (nombre ?? name) === "fecha" ? new Date().toLocaleDateString("sv-SE") : undefined)}
        accept={tipo === "file" ? "image/*,.pdf,.doc,.docx" : undefined}
      />
    </label>
  );
}

function CampoSelect({
  nombre,
  etiqueta,
  opciones,
  obligatorio = false,
  valorInicial,
}: {
  nombre: string;
  etiqueta: string;
  opciones: string[];
  obligatorio?: boolean;
  valorInicial?: string;
}) {
  return (
    <label>
      <span>
        {etiqueta} {obligatorio && <b className="obligatorio">*</b>}
      </span>
      <select name={nombre} required={obligatorio} defaultValue={valorInicial}>
        {opciones.map((opcion) => <option key={opcion}>{opcion}</option>)}
      </select>
    </label>
  );
}

type FilaPrecio = { categoria:string; descripcion:string; presentacion:string; precio:string };
function ModalPrecios({ onClose, onSaved }: { onClose:()=>void; onSaved:()=>void }) {
  const nuevaFila = (): FilaPrecio => ({ categoria:"", descripcion:"", presentacion:"", precio:"" });
  const [filas,setFilas]=useState<FilaPrecio[]>([nuevaFila()]);
  const [fecha,setFecha]=useState(new Date().toLocaleDateString("sv-SE"));
  const [tienda,setTienda]=useState("");
  const [error,setError]=useState("");
  async function guardarPrecios() {
    for (const fila of filas) {
      if (!fecha || !tienda || !fila.categoria || !fila.descripcion || !fila.presentacion || !fila.precio) {
        setError("Completa todos los campos obligatorios"); return;
      }
      const respuesta=await fetch("/api/precios",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...fila,fecha,tienda})});
      if(!respuesta.ok){const json=await respuesta.json();setError(json.error??"No se pudo guardar");return;}
    }
    onSaved();
  }
  const cambiar=(i:number,campo:keyof FilaPrecio,valor:string)=>setFilas(filas.map((x,n)=>n===i?{...x,[campo]:valor}:x));
  return <div className="velo"><section className="modal modal-precios">
    <div className="modal-cabecera"><div><div className="etiqueta">NUEVO REGISTRO · PRECIOS</div><h2>Agregar precios</h2></div><button className="boton-icono" onClick={onClose}>×</button></div>
    <div className="editor-precios">
      <div className="datos-comunes-precio">
        <label className="fecha-icono-precio" title="Fecha del registro"><CalendarDays size={19}/><input type="date" aria-label="Fecha del registro" value={fecha} onChange={(e)=>setFecha(e.target.value)}/></label>
        <label><span>Tienda <b className="obligatorio">*</b></span><input value={tienda} onChange={(e)=>setTienda(e.target.value)} placeholder="Tienda para todo el registro"/></label>
      </div>
      <div className="acciones-editor"><button className="secundario" onClick={()=>setFilas([...filas,nuevaFila()])}>+ Agregar fila</button><button className="primario" onClick={guardarPrecios}>Guardar registro</button></div>
      <div className="tabla-filas-precio"><div className="fila-precio cabecera"><b>Categoría</b><b>Producto</b><b>Presentación</b><b>Precio</b></div>
      {filas.map((f,i)=><div className="fila-precio" key={i}>
        <input value={f.categoria} onChange={(e)=>cambiar(i,"categoria",e.target.value)}/><input value={f.descripcion} onChange={(e)=>cambiar(i,"descripcion",e.target.value)}/><input type="number" min="0.0001" step="any" value={f.presentacion} onChange={(e)=>cambiar(i,"presentacion",e.target.value)}/><input type="number" step="0.01" value={f.precio} onChange={(e)=>cambiar(i,"precio",e.target.value)}/>
      </div>)}</div>
      {error&&<p className="error-modal">{error}</p>}
    </div>
  </section></div>;
}

function ModalHistorialRapido({ integranteId, onClose, onSaved }: { integranteId: string; onClose: () => void; onSaved: () => void }) {
  return <div className="velo"><section className="modal modal-corta"><div className="modal-cabecera"><div><span className="etiqueta">HISTORIAL MÉDICO</span><h2>Nuevo registro</h2></div><button className="boton-icono" onClick={onClose}>×</button></div><form onSubmit={async(e)=>{e.preventDefault();const valores=Object.fromEntries(new FormData(e.currentTarget));const r=await fetch("/api/salud",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({integrante_id:integranteId,seccion:"historial",...valores})});if(r.ok)onSaved();}}><div className="campos"><Campo nombre="fecha" etiqueta="Fecha" tipo="date" obligatorio/><Campo nombre="diagnostico" etiqueta="Diagnóstico" obligatorio ancho/><Campo nombre="tratamiento" etiqueta="Tratamiento" ancho/><Campo nombre="observaciones" etiqueta="Observaciones" ancho/></div><div className="modal-acciones"><button type="button" className="secundario" onClick={onClose}>Cancelar</button><button className="primario">Guardar</button></div></form></section></div>;
}

function Modal({
  titulo,
  seccion,
  categoriasFinanzas = [],
  onClose,
  onSave,
}: {
  titulo: string;
  seccion: string;
  categoriasFinanzas?: string[];
  onClose: () => void;
  onSave: (e: FormEvent<HTMLFormElement>) => void;
}) {
  const [tipoFinanza, setTipoFinanza] = useState(titulo.toLowerCase().includes("egreso") ? "gasto" : "ingreso");
  const categoriasBase = tipoFinanza === "ingreso" ? categoriasIngresoIniciales : categoriasEgresoIniciales;
  const categorias = Array.from(new Set([...categoriasBase, ...categoriasFinanzas]));
  return (
    <div
      className="velo"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
      >
        <div className="modal-cabecera">
          <div>
            <div className="etiqueta">NUEVO REGISTRO</div>
            <h2>{titulo}</h2>
          </div>
          <button className="boton-icono" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <form onSubmit={onSave}>
          <div className="campos">
            {seccion === "Precios" && (
              <div className="fila-categoria-fecha">
                <label>
                  <span>
                    Categoría <b className="obligatorio">*</b>
                  </span>
                  <input name="categoria" required placeholder="Ej. Desodorante gel" />
                </label>
                <label className="fecha-icono-precio" title="Modificar fecha">
                  <CalendarDays size={19} aria-hidden="true" />
                  <input
                    name="fecha"
                    required
                    type="date"
                    aria-label="Fecha del precio"
                    defaultValue={new Date().toLocaleDateString("sv-SE")}
                  />
                </label>
              </div>
            )}
            {seccion === "Precios" && <label className="ancho">
              <span>
                Descripción del producto{" "}
                <b className="obligatorio">*</b>
              </span>
              <input
                name="descripcion"
                required
                placeholder="Ej. Aceite vegetal"
              />
            </label>}
            {seccion === "Precios" && (
              <>
                <label>
                  <span>
                    Presentación <b className="obligatorio">*</b>
                  </span>
                  <input
                    name="presentacion"
                    required
                    placeholder="Ej. Botella 1 L"
                  />
                  <small>El primer valor numérico se usa para el cálculo.</small>
                </label>
                <label>
                  <span>
                    Precio (S/) <b className="obligatorio">*</b>
                  </span>
                  <input
                    name="precio"
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                  />
                </label>
                <label className="ancho">
                  <span>
                    Tienda <b className="obligatorio">*</b>
                  </span>
                  <input name="tienda" required placeholder="Nombre de la tienda" />
                </label>
              </>
            )}
            {seccion === "Finanzas" && <>
              <label><span>Tipo <b className="obligatorio">*</b></span><select name="tipo" value={tipoFinanza} onChange={(e)=>setTipoFinanza(e.target.value)}><option value="ingreso">Ingreso</option><option value="gasto">Egreso</option></select></label>
              <Campo nombre="fecha" etiqueta="Fecha" tipo="date" obligatorio />
              <Campo nombre="descripcion" etiqueta="Descripción" obligatorio ancho />
              <label><span>Categoría <b className="obligatorio">*</b></span><select name="categoria" required><option value="">Selecciona</option>{categorias.map((categoria)=><option key={categoria}>{categoria}</option>)}</select></label>
              <Campo nombre="monto" etiqueta="Monto (S/)" tipo="number" obligatorio />
              <Campo nombre="observaciones" etiqueta="Observaciones" ancho />
            </>}
            {seccion === "Educación" && <>
              <Campo nombre="titulo" etiqueta="Título del documento" obligatorio ancho />
              <Campo nombre="institucion" etiqueta="Institución" obligatorio />
              <CampoSelect nombre="categoria" etiqueta="Categoría" opciones={["Estudios", "Cursos", "Certificados", "Documentos académicos"]} obligatorio />
              <Campo nombre="archivo" etiqueta="Archivo" tipo="file" obligatorio ancho />
            </>}
            {seccion === "Seguros" && <>
              <Campo nombre="tipo" etiqueta="Tipo de seguro" obligatorio />
              <Campo nombre="aseguradora" etiqueta="Aseguradora" obligatorio />
              <Campo nombre="numero_poliza" etiqueta="Número de póliza" obligatorio />
              <Campo nombre="contacto" etiqueta="Contacto" />
              <Campo nombre="fecha_inicio" etiqueta="Inicio de vigencia" tipo="date" />
              <Campo nombre="fecha_fin" etiqueta="Fin de vigencia" tipo="date" />
              <Campo nombre="telefono" etiqueta="Teléfono" />
              <Campo nombre="cobertura" etiqueta="Cobertura" ancho />
              <Campo nombre="archivo" etiqueta="Documento de la póliza" tipo="file" ancho />
            </>}
            {seccion === "Proyectos y eventos" && <>
              <Campo nombre="titulo" etiqueta="Título" obligatorio ancho />
              <CampoSelect nombre="tipo" etiqueta="Evento" opciones={["Proyecto", "Evento", "Actividad"]} obligatorio />
              <Campo nombre="lugar" etiqueta="Lugar" />
              <Campo nombre="fecha_inicio" etiqueta="Inicio" tipo="datetime-local" />
              <Campo nombre="presupuesto" etiqueta="Meta o presupuesto (S/)" tipo="number" />
              <Campo nombre="descripcion" etiqueta="Descripción" ancho />
            </>}
            {seccion === "Mascotas" && <>
              <Campo nombre="nombre" etiqueta="Nombre" obligatorio />
              <Campo nombre="especie" etiqueta="Especie" obligatorio />
              <Campo nombre="raza" etiqueta="Raza" />
              <CampoSelect nombre="sexo" etiqueta="Sexo" opciones={["Macho", "Hembra", "No registrado"]} />
              <Campo nombre="fecha_nacimiento" etiqueta="Fecha de nacimiento" tipo="date" />
              <Campo nombre="observaciones" etiqueta="Observaciones" ancho />
            </>}
            {seccion === "Archivos históricos" && <>
              <Campo nombre="titulo" etiqueta="Título" obligatorio ancho />
              <Campo nombre="descripcion" etiqueta="Descripción de la foto" ancho />
              <Campo nombre="archivo" etiqueta="Fotografía" tipo="file" obligatorio ancho />
            </>}
          </div>
          <div className="modal-acciones">
            <button type="button" className="secundario" onClick={onClose}>
              Cancelar
            </button>
            <button className="primario">Guardar registro</button>
          </div>
        </form>
      </section>
    </div>
  );
}
