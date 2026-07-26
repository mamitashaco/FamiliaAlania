"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Registro = { titulo: string; detalle: string; meta: string; estado?: string };
type Integrante = {
  id: string; usuarioId: string | null; iniciales: string; nombre: string; rol: string; edad: string; lugar: string; codigo: string;
  actualizado_en?: string;
  dni?: string; fecha_nacimiento?: string; lugar_nacimiento?: string; estado_civil?: string; telefono?: string;
  correo_electronico?: string; departamento?: string; provincia?: string; distrito?: string; direccion_actual?: string;
  observaciones?: string; empresa?: string; cargo?: string; direccion_trabajo?: string; telefono_laboral?: string;
  tipo_sangre?: string; seguro_medico?: string; alergias?: string; enfermedades_relevantes?: string;
  medicacion_habitual?: string; medico_referencia?: string;
  cuentas: Array<{ banco_principal: string; tipo_cuenta: string; observaciones: string }>;
  contactos: Array<{ nombre: string; relacion: string; telefono: string }>;
  fechas: Array<{ titulo: string; tipo: "completa" | "anual" | "regla"; valor: string }>;
};

const navegacion = [
  ["Inicio", "⌂"], ["Integrantes", "◎"], ["Salud", "♡"], ["Finanzas", "▥"],
  ["Precios", "⌕"], ["Educación", "▤"], ["Seguros", "◇"], ["Viajes y eventos", "✦"],
  ["Mascotas", "♧"], ["Archivos históricos", "□"],
];

const integrantes: Integrante[] = [];

const datos: Record<string, Registro[]> = {};

function Icono({ children }: { children: React.ReactNode }) {
  return <span className="icono" aria-hidden="true">{children}</span>;
}

function siguienteDiaMes(dia: number, mes: number) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  let fecha = new Date(hoy.getFullYear(), mes - 1, dia);
  if (fecha < hoy) fecha = new Date(hoy.getFullYear() + 1, mes - 1, dia);
  return fecha;
}

function fechaPorRegla(regla: string) {
  const texto = regla.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const dias = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const mes = meses.findIndex((m) => texto.includes(m));
  const diaSemana = dias.findIndex((d) => texto.includes(d));
  const orden = texto.match(/(1|primer|primero)/) ? 1 : texto.match(/(2|segundo)/) ? 2 : texto.match(/(3|tercer|tercero)/) ? 3 : texto.match(/(4|cuarto)/) ? 4 : 0;
  if (mes < 0 || diaSemana < 0 || !orden) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const calcular = (anio: number) => {
    const primero = new Date(anio, mes, 1);
    const dia = 1 + ((diaSemana - primero.getDay() + 7) % 7) + (orden - 1) * 7;
    return new Date(anio, mes, dia);
  };
  const este = calcular(hoy.getFullYear());
  return este >= hoy ? este : calcular(hoy.getFullYear() + 1);
}

function calcularProximasFechas(personas: Integrante[]) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const limite = new Date(hoy); limite.setDate(limite.getDate() + 45);
  const eventos: Array<{ titulo: string; detalle: string; fecha: Date }> = [];
  personas.forEach((p) => {
    if (p.fecha_nacimiento) {
      const [, mes, dia] = p.fecha_nacimiento.split("-").map(Number);
      eventos.push({ titulo: `Cumpleaños de ${p.nombre.split(" ")[0]}`, detalle: p.nombre, fecha: siguienteDiaMes(dia, mes) });
    }
    p.fechas.forEach((f) => {
      let fecha: Date | null = null;
      if (f.tipo === "completa") fecha = new Date(`${f.valor}T00:00:00`);
      if (f.tipo === "anual") { const [dia, mes] = f.valor.split("/").map(Number); fecha = siguienteDiaMes(dia, mes); }
      if (f.tipo === "regla") fecha = fechaPorRegla(f.valor);
      if (fecha && !Number.isNaN(fecha.getTime())) eventos.push({ titulo: f.titulo, detalle: f.tipo === "regla" ? f.valor : p.nombre, fecha });
    });
  });
  return eventos.filter((e) => e.fecha >= hoy && e.fecha <= limite).sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
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
  const [aviso, setAviso] = useState("");
  const [integrantesBd, setIntegrantesBd] = useState<Integrante[]>([]);
  const [usuarioId, setUsuarioId] = useState("");
  const [rolSesion, setRolSesion] = useState<"administrador" | "integrante">("integrante");
  const [ficha, setFicha] = useState<Integrante | null>(null);

  async function cargarDatos() {
    const respuesta = await fetch("/api/datos");
    if (!respuesta.ok) return;
    const json = await respuesta.json();
    setUsuarioId(json.usuarioId);
    setRolSesion(json.rol);
    setIntegrantesBd((json.integrantes ?? []).map((p: Record<string, any>) => {
      const partes = p.nombre_completo.split(" ");
      const laboral = p.tb_informacion_laboral?.[0] ?? {};
      const salud = p.tb_salud_perfil?.[0] ?? {};
      return {
        id: p.id,
        usuarioId: p.usuario_id,
        iniciales: `${partes[0]?.[0] ?? ""}${partes[1]?.[0] ?? ""}`.toUpperCase(),
        nombre: p.nombre_completo,
        rol: p.usuario_id ? "Integrante" : "Familiar",
        edad: p.edad == null ? "Edad sin registrar" : `${p.edad} años`,
        lugar: p.departamento ?? "Perú",
        codigo: p.usuario_id ? "Usuario vinculado" : "Sin acceso",
        actualizado_en: p.actualizado_en ?? p.creado_en, dni: p.dni ?? "", fecha_nacimiento: p.fecha_nacimiento ?? "", lugar_nacimiento: p.lugar_nacimiento ?? "",
        estado_civil: p.estado_civil ?? "", telefono: p.telefono ?? "", correo_electronico: p.correo_electronico ?? "",
        departamento: p.departamento ?? "", provincia: p.provincia ?? "", distrito: p.distrito ?? "",
        direccion_actual: p.direccion_actual ?? "", observaciones: p.observaciones ?? "",
        empresa: laboral.empresa ?? "", cargo: laboral.cargo ?? "", direccion_trabajo: laboral.direccion_trabajo ?? "",
        telefono_laboral: laboral.telefono_laboral ?? "", tipo_sangre: salud.tipo_sangre ?? "",
        seguro_medico: salud.seguro_medico ?? "", alergias: salud.alergias ?? "",
        enfermedades_relevantes: salud.enfermedades_relevantes ?? "", medicacion_habitual: salud.medicacion_habitual ?? "",
        medico_referencia: salud.medico_referencia ?? "",
        cuentas: (p.tb_cuentas_financieras ?? []).map((x: Record<string, string>) => ({ banco_principal: x.banco_principal ?? "", tipo_cuenta: x.tipo_cuenta ?? "", observaciones: x.observaciones ?? "" })),
        contactos: (p.tb_contactos_emergencia ?? []).map((x: Record<string, string>) => ({ nombre: x.nombre ?? "", relacion: x.relacion ?? "", telefono: x.telefono ?? "" })),
        fechas: (p.tb_fechas_importantes ?? []).map((x: Record<string, string>) => {
          const tipo = x.tipo?.startsWith("regla:") ? "regla" : x.tipo === "anual" ? "anual" : "completa";
          const valor = tipo === "regla" ? x.tipo.slice(6) : tipo === "anual" ? `${x.fecha?.slice(8, 10)}/${x.fecha?.slice(5, 7)}` : x.fecha ?? "";
          return { titulo: x.titulo ?? "", tipo, valor };
        }),
      };
    }));
  }

  useEffect(() => {
    fetch("/api/sesion").then((r) => r.json()).then((r) => {
      if (r.autenticado) {
        setSesion(true);
        cargarDatos();
      }
    }).catch(() => undefined);
  }, []);

  const integrantesVisibles = integrantesBd;

  const personasFiltradas = useMemo(
    () => integrantesVisibles.filter((p) => p.nombre.toLowerCase().includes(buscar.toLowerCase())),
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
  }

  async function cerrarSesion() {
    await fetch("/api/sesion", { method: "DELETE" });
    setSesion(false);
    setIntegrantesBd([]);
    setUsuarioId("");
  }

  function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setModal(null);
    setAviso("Registro guardado correctamente");
    window.setTimeout(() => setAviso(""), 2600);
  }

  if (!sesion) return (
    <main className={`acceso ${oscuro ? "dark" : ""}`}>
      <button className="boton-icono tema-flotante" onClick={() => setOscuro(!oscuro)} aria-label="Cambiar tema">{oscuro ? "☀" : "☾"}</button>
      <section className="tarjeta-acceso">
        <div className="marca">FA</div>
        <div className="etiqueta">ESPACIO FAMILIAR PRIVADO</div>
        <h1>Familia Alania</h1>
        <p>Información, cuidado y recuerdos de nuestra familia en un solo lugar.</p>
        <form onSubmit={ingresar}>
          <label htmlFor="codigo">Código de acceso</label>
          <input id="codigo" inputMode="numeric" maxLength={8} placeholder="8 dígitos" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))} />
          <label htmlFor="clave">Contraseña</label>
          <input id="clave" type="password" placeholder="Tu contraseña" value={clave} onChange={(e) => setClave(e.target.value)} />
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primario" type="submit">Ingresar <span>→</span></button>
        </form>
        <p className="ayuda">La contraseña inicial es tu mismo código. Al entrar por primera vez te pediremos cambiarla.</p>
      </section>
      <p className="privacidad">Información protegida · Uso exclusivo de la familia</p>
    </main>
  );

  return (
    <div className={`aplicacion ${oscuro ? "dark" : ""}`}>
      <main className="contenido">
        <header className="barra">
          <div className="marca-nav" title="Familia Alania">FA</div>
          <nav className="nav-superior" aria-label="Navegación principal">
            {[...navegacion, ...(rolSesion === "administrador" ? [["Configuración", "⚙"]] : [])].map(([nombre]) => (
              <button key={nombre} className={seccion === nombre ? "activo" : ""} onClick={() => setSeccion(nombre)}>
                {nombre}{nombre === "Salud" && <b>2</b>}
              </button>
            ))}
          </nav>
          <div className="acciones">
            <div className="buscar-global">⌕ <span>Buscar...</span><kbd>⌘ K</kbd></div>
            <button className="boton-icono notificacion" aria-label="Notificaciones">♢<b>3</b></button>
            <button className="boton-icono" onClick={() => setOscuro(!oscuro)} aria-label="Cambiar tema">{oscuro ? "☀" : "☾"}</button>
            <button className="avatar avatar-boton" onClick={cerrarSesion} title="Cerrar sesión">RA</button>
          </div>
        </header>

        <div className="pagina">
          {seccion === "Inicio" ? <Inicio personas={integrantesVisibles} onNavigate={setSeccion} onAdd={() => setModal("Agregar registro")}
            nombre={integrantesVisibles.find((p) => p.usuarioId === usuarioId)?.nombre.split(" ")[0] ?? "Integrante"} /> :
            seccion === "Integrantes" ? (
              <VistaIntegrantes buscar={buscar} setBuscar={setBuscar} personas={personasFiltradas}
                esAdministrador={rolSesion === "administrador"} usuarioId={usuarioId}
                onAdd={() => setModal("Nuevo integrante")} onOpen={setFicha} />
            ) : seccion === "Configuración" ? <VistaConfiguracion onChanged={cargarDatos} /> : (
              <VistaModulo titulo={seccion} registros={datos[seccion] ?? []} onAdd={() => setModal(`Nuevo registro · ${seccion}`)} />
            )}
        </div>
      </main>

      {aviso && <div className="toast" role="status">✓ {aviso}</div>}
      {modal === "Nuevo integrante" && <ModalNuevoIntegrante esAdministrador={rolSesion === "administrador"} onClose={() => setModal(null)} onSaved={async () => {
        setModal(null); await cargarDatos(); setAviso("Integrante creado correctamente"); window.setTimeout(() => setAviso(""), 2600);
      }} />}
      {modal && modal !== "Nuevo integrante" && <Modal titulo={modal} seccion={seccion} onClose={() => setModal(null)} onSave={guardar} />}
      {ficha && <ModalFicha integrante={ficha} puedeEditar={rolSesion === "administrador" || ficha.usuarioId === usuarioId}
        onClose={() => setFicha(null)} onSaved={async () => {
          setFicha(null); await cargarDatos(); setAviso("Ficha actualizada correctamente"); window.setTimeout(() => setAviso(""), 2600);
        }} />}
    </div>
  );
}

function Inicio({ personas, onNavigate, onAdd, nombre }: { personas: typeof integrantes; onNavigate: (s: string) => void; onAdd: () => void; nombre: string }) {
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const proximas = calcularProximasFechas(personas);
  return <>
    <section className="bienvenida">
      <div><div className="etiqueta">ESPACIO FAMILIAR</div><h1>{saludo}, {nombre}</h1><p>Información familiar centralizada y protegida.</p></div>
      <button className="primario" onClick={onAdd}>＋ Agregar registro</button>
    </section>
    <section className="metricas">
      <article><span>Integrantes registrados</span><strong>{personas.length}</strong><small>Datos obtenidos de Supabase</small></article>
      <article><span>Próximas fechas</span><strong>{proximas.length}</strong><small>En los siguientes 45 días</small></article>
    </section>
    <div className="grilla-inicio una-columna">
      {proximas.length > 0 && <section><div className="cabecera-seccion"><div><h2>Próximas fechas</h2><p>Cumpleaños y fechas familiares</p></div></div><div className="tarjeta lista-fechas">{proximas.map((f) => <article key={`${f.titulo}-${f.fecha.toISOString()}`}><div className="fecha"><strong>{f.fecha.getDate()}</strong><span>{f.fecha.toLocaleDateString("es-PE", { month: "short" }).toUpperCase()}</span></div><div><h3>{f.titulo}</h3><p>{f.detalle}</p></div></article>)}</div></section>}
      <section>
        <div className="cabecera-seccion"><div><h2>Integrantes</h2><p>{personas.length} miembros registrados</p></div><button onClick={() => onNavigate("Integrantes")}>Ver todos →</button></div>
        <div className="tarjeta lista-personas">{personas.slice(0, 3).map((p) => <button key={p.nombre} onClick={() => onNavigate("Integrantes")}><span className="avatar">{p.iniciales}</span><span><strong>{p.nombre}</strong><small>{p.edad} · {p.lugar}</small></span><i>›</i></button>)}</div>
      </section>
    </div>
  </>;
}

function VistaIntegrantes({ buscar, setBuscar, personas, onAdd, onOpen, esAdministrador, usuarioId }: {
  buscar: string; setBuscar: (s: string) => void; personas: Integrante[]; onAdd: () => void;
  onOpen: (p: Integrante) => void; esAdministrador: boolean; usuarioId: string;
}) {
  return <>
    <TituloPagina etiqueta="FAMILIA" titulo="Integrantes" descripcion="Perfiles, contactos y datos importantes de cada miembro."
      onAdd={onAdd} textoBoton="Agregar integrante +" />
    <div className="herramientas"><div className="buscador">⌕<input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por nombre" /></div><button className="secundario">Todos los roles⌄</button></div>
    <section className="grilla-personas">{personas.map((p) => {
      const puedeEditar = esAdministrador || p.usuarioId === usuarioId;
      const direccion = [p.direccion_actual, p.distrito, p.provincia, p.departamento].filter(Boolean).join(", ") || "Sin registrar";
      const fechaCercana = calcularProximasFechas([p])[0];
      return <article className="tarjeta ficha" key={p.id}><div className="ficha-arriba"><span className="avatar grande">{p.iniciales}</span></div><h2>{p.nombre}</h2><p>{p.edad} · {p.lugar}</p><dl><div><dt>DNI</dt><dd>{p.dni || "Sin registrar"}</dd></div><div><dt>Dirección</dt><dd className="dato-largo">{direccion}</dd></div><div><dt>Próxima fecha</dt><dd>{fechaCercana ? `${fechaCercana.titulo} · ${fechaCercana.fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}` : "Sin fechas próximas"}</dd></div></dl><div className="ficha-acciones"><button className="secundario" onClick={() => onOpen(p)}>{puedeEditar ? "Ver y editar ficha" : "Ver ficha"}</button></div></article>;
    })}</section>
  </>;
}

function VistaModulo({ titulo, registros, onAdd }: { titulo: string; registros: Registro[]; onAdd: () => void }) {
  const descripciones: Record<string, string> = {
    Salud: "Historial médico, medicamentos, vacunas, exámenes y signos vitales.",
    Finanzas: "Ingresos, gastos y reportes para cuidar la economía familiar.",
    Precios: "Compara tiendas y consulta el historial de precios por producto.",
    Educación: "Estudios, cursos, certificados y documentos académicos.",
    Seguros: "Pólizas, coberturas, vencimientos y contactos de asistencia.",
    "Viajes y eventos": "Itinerarios, participantes, reservas, presupuestos y fechas.",
    Mascotas: "Información e historial veterinario de cada mascota.",
    "Archivos históricos": "Documentos, fotografías y recuerdos de la familia.",
  };
  return <>
    <TituloPagina etiqueta="GESTIÓN FAMILIAR" titulo={titulo} descripcion={descripciones[titulo]} onAdd={onAdd} textoBoton={titulo === "Precios" ? "Agregar precio" : "Nuevo registro"} />
    <section className="pestanas">{(titulo === "Salud" ? ["Resumen", "Historial médico", "Medicamentos", "Vacunas", "Exámenes", "Signos"] : titulo === "Finanzas" ? ["Resumen", "Ingresos", "Gastos", "Reportes"] : ["Todos", "Próximos", "Documentos"]).map((x, i) => <button className={i === 0 ? "seleccionada" : ""} key={x}>{x}</button>)}</section>
    {titulo === "Precios" && <section className="comparador tarjeta"><div><span className="etiqueta">COMPARADOR</span><h2>Encuentra el mejor precio</h2><p>Busca un producto y compara el último precio registrado en cada tienda.</p></div><div className="buscador grande">⌕<input placeholder="Ej. aceite vegetal, arroz, leche…" /></div></section>}
    {registros.length ? <section className="tarjeta tabla"><div className="tabla-cabecera"><span>Registro</span><span>Detalle</span><span>Información</span><span>Estado</span></div>{registros.map((r) => <button className="tabla-fila" key={r.titulo}><span><i className="punto" /> <strong>{r.titulo}</strong></span><span>{r.detalle}</span><span>{r.meta}</span><span><b className="insignia">{r.estado}</b> ›</span></button>)}</section> : <section className="tarjeta estado-vacio"><h2>Sin registros</h2><p>Los datos que agregues aparecerán aquí.</p></section>}
  </>;
}

type UsuarioConfig = { id: string; usuario_id: string | null; nombre_completo: string; codigo: string; activo: boolean; rol: "administrador" | "integrante" };
function VistaConfiguracion({ onChanged }: { onChanged: () => void }) {
  const [usuarios, setUsuarios] = useState<UsuarioConfig[]>([]);
  const [guardado, setGuardado] = useState("");
  const [error, setError] = useState("");
  async function cargarConfiguracion() {
    const respuesta = await fetch("/api/configuracion");
    const json = await respuesta.json();
    setUsuarios(json.integrantes ?? []);
  }
  useEffect(() => { cargarConfiguracion(); }, []);
  async function guardarUsuario(usuario: UsuarioConfig, restablecer = false) {
    const respuesta = await fetch("/api/configuracion", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...usuario, restablecer }) });
    const json = await respuesta.json();
    if (!respuesta.ok) { setError(json.error ?? "No se pudo guardar"); return; }
    setError(""); setGuardado(usuario.id); window.setTimeout(() => setGuardado(""), 1800); await cargarConfiguracion(); onChanged();
  }
  return <>
    <TituloPagina etiqueta="SOLO ADMINISTRADOR" titulo="Configuración" descripcion="Edita el nombre y código de acceso de los integrantes." textoBoton="" />
    {error && <p className="error-config">{error}</p>}
    <section className="tarjeta configuracion-lista">{usuarios.map((u, i) => <form key={u.id} onSubmit={(e) => { e.preventDefault(); guardarUsuario(u); }}>
      <span className="avatar">{u.nombre_completo.split(" ").slice(0, 2).map((x) => x[0]).join("")}</span>
      <label><span>Nombre completo</span><input value={u.nombre_completo} onChange={(e) => setUsuarios(usuarios.map((x, n) => n === i ? { ...x, nombre_completo: e.target.value } : x))} /></label>
      <label><span>{u.usuario_id ? "Código de acceso" : "Asignar código de acceso"}</span><input inputMode="numeric" maxLength={8} value={u.codigo} placeholder="8 dígitos" onChange={(e) => setUsuarios(usuarios.map((x, n) => n === i ? { ...x, codigo: e.target.value.replace(/\D/g, "") } : x))} /></label>
      <label><span>Rol</span><select value={u.rol ?? "integrante"} onChange={(e) => setUsuarios(usuarios.map((x, n) => n === i ? { ...x, rol: e.target.value as "administrador" | "integrante" } : x))}><option value="integrante">Integrante</option><option value="administrador">Administrador</option></select></label>
      <div className="guardar-config"><button className="primario">Guardar</button>{u.usuario_id && <button type="button" className="restablecer" onClick={() => guardarUsuario(u, true)}>Restablecer contraseña</button>}{guardado === u.id && <small>✓ Guardado</small>}</div>
    </form>)}</section>
  </>;
}

function TituloPagina({ etiqueta, titulo, descripcion, onAdd, textoBoton }: { etiqueta: string; titulo: string; descripcion: string; onAdd?: () => void; textoBoton: string }) {
  return <section className="titulo-pagina"><div><div className="etiqueta">{etiqueta}</div><h1>{titulo}</h1><p>{descripcion}</p></div>{onAdd && <button className="primario" onClick={onAdd}>＋ {textoBoton}</button>}</section>;
}

function ModalNuevoIntegrante({ onClose, onSaved, esAdministrador }: { onClose: () => void; onSaved: () => void; esAdministrador: boolean }) {
  const [error, setError] = useState("");
  async function crear(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const valores = Object.fromEntries(new FormData(e.currentTarget));
    const respuesta = await fetch("/api/datos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(valores) });
    const json = await respuesta.json();
    if (!respuesta.ok) return setError(json.error ?? "No se pudo crear el integrante");
    onSaved();
  }
  return <div className="velo" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="modal modal-corta" role="dialog" aria-modal="true" aria-label="Nuevo integrante">
    <div className="modal-cabecera"><div><div className="etiqueta">NUEVO INTEGRANTE</div><h2>Agregar a la familia</h2></div><button className="boton-icono" onClick={onClose} aria-label="Cerrar">×</button></div>
    <form onSubmit={crear}><div className="campos">
      <label className="ancho"><span>Nombre completo</span><input name="nombre_completo" required autoFocus placeholder="Nombres y apellidos" /></label>
      {!esAdministrador && <label className="ancho"><span>Parentesco contigo</span><select name="parentesco" required defaultValue=""><option value="" disabled>Selecciona una relación</option>{RELACIONES.map((r) => <option key={r}>{r}</option>)}</select></label>}
    </div>{error && <p className="error">{error}</p>}<div className="modal-acciones"><button type="button" className="secundario" onClick={onClose}>Cancelar</button><button className="primario">Crear integrante</button></div></form>
  </section></div>;
}

const seccionesFicha = [
  ["Datos personales", [["nombre", "Nombre completo"], ["dni", "DNI"], ["fecha_nacimiento", "Fecha de nacimiento", "date"], ["lugar_nacimiento", "Lugar de nacimiento"]]],
  ["Información laboral", [["empresa", "Empresa"], ["cargo", "Cargo"], ["direccion_trabajo", "Dirección de trabajo"], ["telefono_laboral", "Teléfono laboral"]]],
  ["Salud", [["tipo_sangre", "Tipo de sangre"], ["seguro_medico", "Seguro médico"], ["alergias", "Alergias"], ["enfermedades_relevantes", "Enfermedades relevantes"], ["medicacion_habitual", "Medicación habitual"], ["medico_referencia", "Médico de referencia"]]],
  ["Observaciones generales", [["observaciones", "Observaciones generales"]]],
] as const;

const RELACIONES = ["Madre", "Padre", "Hija", "Hijo", "Hermana", "Hermano", "Esposa", "Esposo", "Pareja", "Abuela", "Abuelo", "Nieta", "Nieto", "Tía", "Tío", "Prima", "Primo", "Sobrina", "Sobrino", "Tutora", "Tutor", "Amiga", "Amigo", "Otro"];
const ESTADOS_CIVILES = ["Soltero/a", "Casado/a", "Conviviente", "Separado/a", "Divorciado/a", "Viudo/a", "No especificado"];

function fechaActualizacion(valor?: string) {
  return valor ? new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(valor)) : "Sin actualización";
}

function ModalFicha({ integrante, puedeEditar, onClose, onSaved }: { integrante: Integrante; puedeEditar: boolean; onClose: () => void; onSaved: () => void }) {
  const [error, setError] = useState("");
  const [contactos, setContactos] = useState(integrante.contactos.length ? integrante.contactos : [{ nombre: "", relacion: "", telefono: "" }]);
  const [fechasImportantes, setFechasImportantes] = useState(integrante.fechas.length ? integrante.fechas : [{ titulo: "", tipo: "completa" as const, valor: "" }]);
  const [cuentas, setCuentas] = useState(integrante.cuentas.length ? integrante.cuentas : [{ banco_principal: "", tipo_cuenta: "", observaciones: "" }]);
  const [telefonos, setTelefonos] = useState(integrante.telefono?.split("\n").filter(Boolean).length ? integrante.telefono.split("\n").filter(Boolean) : [""]);
  const [correos, setCorreos] = useState(integrante.correo_electronico?.split("\n").filter(Boolean).length ? integrante.correo_electronico.split("\n").filter(Boolean) : [""]);
  async function guardarFicha(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!puedeEditar) return;
    const valores = Object.fromEntries(new FormData(e.currentTarget));
    const respuesta = await fetch("/api/datos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: integrante.id, ...valores, telefono: telefonos.filter(Boolean).join("\n"), correo_electronico: correos.filter(Boolean).join("\n"), contactos, fechas: fechasImportantes, cuentas }) });
    const json = await respuesta.json();
    if (!respuesta.ok) return setError(json.error ?? "No se pudo guardar la ficha");
    onSaved();
  }
  return <div className="velo" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="modal modal-ficha" role="dialog" aria-modal="true" aria-label={`Ficha de ${integrante.nombre}`}>
    <div className="modal-cabecera"><div><div className="etiqueta">{puedeEditar ? "FICHA EDITABLE" : "SOLO LECTURA"}</div><h2>{integrante.nombre}</h2><p>{integrante.edad} · {integrante.lugar}</p></div><button className="boton-icono" onClick={onClose} aria-label="Cerrar">×</button></div>
    <form onSubmit={guardarFicha}>{seccionesFicha.map(([titulo, campos]) => <fieldset key={titulo}><legend>{titulo}</legend><div className="campos">{campos.map(([nombre, etiqueta, tipo]) =>
      <label key={nombre}><span>{etiqueta}</span><input name={nombre} type={tipo ?? "text"} defaultValue={String(integrante[nombre as keyof Integrante] ?? "")} disabled={!puedeEditar} /></label>
    )}</div></fieldset>)}
      <fieldset><legend>Contacto y estado civil</legend><div className="campos"><label><span>Estado civil</span><select name="estado_civil" defaultValue={integrante.estado_civil} disabled={!puedeEditar}><option value="">Selecciona</option>{ESTADOS_CIVILES.map((e) => <option key={e}>{e}</option>)}</select></label></div>
        <div className="listas-contacto"><div><div className="subtitulo-lista"><small>Teléfonos · Actualizado: {fechaActualizacion(integrante.actualizado_en)}</small>{puedeEditar && <button type="button" className="secundario" onClick={() => setTelefonos([...telefonos, ""])}>＋ Agregar</button>}</div>{telefonos.map((t, i) => <div className="linea-contacto" key={i}><input type="tel" value={t} disabled={!puedeEditar} placeholder="Número de teléfono" onChange={(e) => setTelefonos(telefonos.map((x, n) => n === i ? e.target.value : x))} />{puedeEditar && telefonos.length > 1 && <button type="button" className="quitar" onClick={() => setTelefonos(telefonos.filter((_, n) => n !== i))}>Eliminar</button>}</div>)}</div>
        <div><div className="subtitulo-lista"><small>Correos electrónicos</small>{puedeEditar && <button type="button" className="secundario" onClick={() => setCorreos([...correos, ""])}>＋ Agregar</button>}</div>{correos.map((c, i) => <div className="linea-contacto" key={i}><input type="email" value={c} disabled={!puedeEditar} placeholder="correo@ejemplo.com" onChange={(e) => setCorreos(correos.map((x, n) => n === i ? e.target.value : x))} />{puedeEditar && correos.length > 1 && <button type="button" className="quitar" onClick={() => setCorreos(correos.filter((_, n) => n !== i))}>Eliminar</button>}</div>)}</div></div>
      </fieldset>
      <fieldset><legend>Domicilio actual</legend><div className="campos"><label><span>Departamento</span><input name="departamento" defaultValue={integrante.departamento} disabled={!puedeEditar} /></label><label><span>Provincia</span><input name="provincia" defaultValue={integrante.provincia} disabled={!puedeEditar} /></label><label><span>Distrito</span><input name="distrito" defaultValue={integrante.distrito} disabled={!puedeEditar} /></label><label><span>Dirección</span><input name="direccion_actual" defaultValue={integrante.direccion_actual} disabled={!puedeEditar} /></label></div>{integrante.direccion_actual && <a className="enlace-mapas" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([integrante.direccion_actual, integrante.distrito, integrante.provincia, integrante.departamento].filter(Boolean).join(", "))}`} target="_blank" rel="noreferrer">Ver ubicación en Google Maps ↗</a>}</fieldset>
      <ListaEditable titulo="Información financiera" actualizado={integrante.actualizado_en} puedeEditar={puedeEditar} onAdd={() => setCuentas([...cuentas, { banco_principal: "", tipo_cuenta: "", observaciones: "" }])}>
        {cuentas.map((c, i) => <div className="registro-repetible" key={i}><div className="campos"><label><span>Banco principal</span><input value={c.banco_principal} disabled={!puedeEditar} onChange={(e) => setCuentas(cuentas.map((x, n) => n === i ? { ...x, banco_principal: e.target.value } : x))} /></label><label><span>Tipo de cuenta</span><input value={c.tipo_cuenta} disabled={!puedeEditar} onChange={(e) => setCuentas(cuentas.map((x, n) => n === i ? { ...x, tipo_cuenta: e.target.value } : x))} /></label><label className="ancho"><span>Observaciones</span><input value={c.observaciones} disabled={!puedeEditar} onChange={(e) => setCuentas(cuentas.map((x, n) => n === i ? { ...x, observaciones: e.target.value } : x))} /></label></div>{puedeEditar && cuentas.length > 1 && <button type="button" className="quitar" onClick={() => setCuentas(cuentas.filter((_, n) => n !== i))}>Eliminar</button>}</div>)}
      </ListaEditable>
      <ListaEditable titulo="Contactos de emergencia" actualizado={integrante.actualizado_en} puedeEditar={puedeEditar} onAdd={() => setContactos([...contactos, { nombre: "", relacion: "", telefono: "" }])}>
        {contactos.map((c, i) => <div className="registro-repetible" key={i}><div className="campos tres"><label><span>Nombre</span><input value={c.nombre} disabled={!puedeEditar} onChange={(e) => setContactos(contactos.map((x, n) => n === i ? { ...x, nombre: e.target.value } : x))} /></label><label><span>Relación</span><select value={c.relacion} disabled={!puedeEditar} onChange={(e) => setContactos(contactos.map((x, n) => n === i ? { ...x, relacion: e.target.value } : x))}><option value="">Selecciona</option>{RELACIONES.map((r) => <option key={r}>{r}</option>)}</select></label><label><span>Teléfono</span><input value={c.telefono} disabled={!puedeEditar} onChange={(e) => setContactos(contactos.map((x, n) => n === i ? { ...x, telefono: e.target.value } : x))} /></label></div>{puedeEditar && contactos.length > 1 && <button type="button" className="quitar" onClick={() => setContactos(contactos.filter((_, n) => n !== i))}>Eliminar</button>}</div>)}
      </ListaEditable>
      <ListaEditable titulo="Fechas importantes" actualizado={integrante.actualizado_en} puedeEditar={puedeEditar} onAdd={() => setFechasImportantes([...fechasImportantes, { titulo: "", tipo: "completa", valor: "" }])}>
        <div className="tabla-fechas"><div className="tabla-fechas-cabecera"><span>Descripción</span><span>Tipo</span><span>Fecha o regla</span><span /></div>
        {fechasImportantes.map((f, i) => <div className="tabla-fechas-fila" key={i}><input aria-label="Descripción" value={f.titulo} disabled={!puedeEditar} onChange={(e) => setFechasImportantes(fechasImportantes.map((x, n) => n === i ? { ...x, titulo: e.target.value } : x))} /><select aria-label="Tipo de fecha" value={f.tipo} disabled={!puedeEditar} onChange={(e) => setFechasImportantes(fechasImportantes.map((x, n) => n === i ? { ...x, tipo: e.target.value as "completa" | "anual" | "regla", valor: "" } : x))}><option value="completa">Fecha completa</option><option value="anual">Día y mes</option><option value="regla">Regla anual</option></select><input aria-label="Fecha o regla" type={f.tipo === "completa" ? "date" : "text"} placeholder={f.tipo === "anual" ? "Ej. 15/06" : f.tipo === "regla" ? "Ej. tercer domingo de junio" : ""} value={f.valor} disabled={!puedeEditar} onChange={(e) => setFechasImportantes(fechasImportantes.map((x, n) => n === i ? { ...x, valor: e.target.value } : x))} />{puedeEditar && fechasImportantes.length > 1 ? <button type="button" className="quitar" onClick={() => setFechasImportantes(fechasImportantes.filter((_, n) => n !== i))}>Eliminar</button> : <span />}</div>)}</div>
      </ListaEditable>
      {error && <p className="error">{error}</p>}<div className="modal-acciones"><button type="button" className="secundario" onClick={onClose}>{puedeEditar ? "Cancelar" : "Cerrar"}</button>{puedeEditar && <button className="primario">Guardar cambios</button>}</div></form>
  </section></div>;
}

function ListaEditable({ titulo, actualizado, puedeEditar, onAdd, children }: { titulo: string; actualizado?: string; puedeEditar: boolean; onAdd: () => void; children: React.ReactNode }) {
  return <fieldset><legend>{titulo}</legend><div className="subtitulo-lista"><small>Actualizado: {fechaActualizacion(actualizado)}</small>{puedeEditar && <button type="button" className="secundario" onClick={onAdd}>＋ Agregar</button>}</div>{children}</fieldset>;
}

function Modal({ titulo, seccion, onClose, onSave }: { titulo: string; seccion: string; onClose: () => void; onSave: (e: FormEvent<HTMLFormElement>) => void }) {
  return <div className="velo" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-label={titulo}><div className="modal-cabecera"><div><div className="etiqueta">NUEVO REGISTRO</div><h2>{titulo}</h2></div><button className="boton-icono" onClick={onClose} aria-label="Cerrar">×</button></div><form onSubmit={onSave}>
    <div className="campos">
      <label><span>{seccion === "Precios" ? "Descripción del producto" : "Título"}</span><input required placeholder={seccion === "Precios" ? "Ej. Aceite vegetal" : "Nombre del registro"} /></label>
      <label><span>{seccion === "Precios" ? "Categoría" : "Fecha"}</span><input required type={seccion === "Precios" ? "text" : "date"} /></label>
      {seccion === "Precios" && <><label><span>Precio (S/)</span><input required type="number" step="0.01" placeholder="0.00" /></label><label><span>Presentación</span><input placeholder="Ej. Botella 1 L" /></label><label><span>Costo unitario</span><input type="number" step="0.01" placeholder="0.00" /></label><label><span>Tienda</span><input required placeholder="Nombre de la tienda" /></label></>}
      {seccion !== "Precios" && <label className="ancho"><span>Descripción u observaciones</span><textarea rows={4} placeholder="Agrega información útil para la familia" /></label>}
    </div><div className="modal-acciones"><button type="button" className="secundario" onClick={onClose}>Cancelar</button><button className="primario">Guardar registro</button></div>
  </form></section></div>;
}
