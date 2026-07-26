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
  fechas: Array<{ titulo: string; fecha: string }>;
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
        fechas: (p.tb_fechas_importantes ?? []).map((x: Record<string, string>) => ({ titulo: x.titulo ?? "", fecha: x.fecha ?? "" })),
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
          {seccion === "Inicio" ? <Inicio personas={integrantesVisibles} onNavigate={setSeccion} onAdd={() => setModal("Agregar registro")} /> :
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
      {modal === "Nuevo integrante" && <ModalNuevoIntegrante onClose={() => setModal(null)} onSaved={async () => {
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

function Inicio({ personas, onNavigate, onAdd }: { personas: typeof integrantes; onNavigate: (s: string) => void; onAdd: () => void }) {
  return <>
    <section className="bienvenida">
      <div><div className="etiqueta">ESPACIO FAMILIAR</div><h1>Familia Alania</h1><p>Información familiar centralizada y protegida.</p></div>
      <button className="primario" onClick={onAdd}>＋ Agregar registro</button>
    </section>
    <section className="metricas">
      <article><span>Integrantes registrados</span><strong>{personas.length}</strong><small>Datos obtenidos de Supabase</small></article>
    </section>
    <div className="grilla-inicio una-columna">
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
      onAdd={esAdministrador ? onAdd : undefined} textoBoton="Agregar integrante +" />
    <div className="herramientas"><div className="buscador">⌕<input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por nombre" /></div><button className="secundario">Todos los roles⌄</button></div>
    <section className="grilla-personas">{personas.map((p) => {
      const puedeEditar = esAdministrador || p.usuarioId === usuarioId;
      return <article className="tarjeta ficha" key={p.id}><div className="ficha-arriba"><span className="avatar grande">{p.iniciales}</span><span className="insignia">{p.rol}</span></div><h2>{p.nombre}</h2><p>{p.edad} · {p.lugar}</p><dl><div><dt>Código</dt><dd>{p.codigo}</dd></div><div><dt>Estado</dt><dd>Activo</dd></div></dl><div className="ficha-acciones"><button className="secundario" onClick={() => onOpen(p)}>{puedeEditar ? "Ver y editar ficha" : "Ver ficha"}</button></div></article>;
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

type UsuarioConfig = { id: string; usuario_id: string | null; nombre_completo: string; codigo: string; activo: boolean };
function VistaConfiguracion({ onChanged }: { onChanged: () => void }) {
  const [usuarios, setUsuarios] = useState<UsuarioConfig[]>([]);
  const [mensaje, setMensaje] = useState("");
  useEffect(() => { fetch("/api/configuracion").then((r) => r.json()).then((j) => setUsuarios(j.integrantes ?? [])); }, []);
  async function guardarUsuario(usuario: UsuarioConfig) {
    const respuesta = await fetch("/api/configuracion", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(usuario) });
    const json = await respuesta.json();
    setMensaje(respuesta.ok ? "Cambios guardados" : json.error ?? "No se pudo guardar");
    if (respuesta.ok) onChanged();
  }
  return <>
    <TituloPagina etiqueta="SOLO ADMINISTRADOR" titulo="Configuración" descripcion="Edita el nombre y código de acceso de los integrantes." textoBoton="" />
    {mensaje && <p className="mensaje-config">{mensaje}</p>}
    <section className="tarjeta configuracion-lista">{usuarios.map((u, i) => <form key={u.id} onSubmit={(e) => { e.preventDefault(); guardarUsuario(u); }}>
      <span className="avatar">{u.nombre_completo.split(" ").slice(0, 2).map((x) => x[0]).join("")}</span>
      <label><span>Nombre completo</span><input value={u.nombre_completo} onChange={(e) => setUsuarios(usuarios.map((x, n) => n === i ? { ...x, nombre_completo: e.target.value } : x))} /></label>
      <label><span>Código de acceso</span><input inputMode="numeric" maxLength={8} value={u.codigo} disabled={!u.usuario_id} placeholder={u.usuario_id ? "8 dígitos" : "Sin usuario vinculado"} onChange={(e) => setUsuarios(usuarios.map((x, n) => n === i ? { ...x, codigo: e.target.value.replace(/\D/g, "") } : x))} /></label>
      <button className="primario">Guardar</button>
    </form>)}</section>
  </>;
}

function TituloPagina({ etiqueta, titulo, descripcion, onAdd, textoBoton }: { etiqueta: string; titulo: string; descripcion: string; onAdd?: () => void; textoBoton: string }) {
  return <section className="titulo-pagina"><div><div className="etiqueta">{etiqueta}</div><h1>{titulo}</h1><p>{descripcion}</p></div>{onAdd && <button className="primario" onClick={onAdd}>＋ {textoBoton}</button>}</section>;
}

function ModalNuevoIntegrante({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
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
      <label className="ancho"><span>Parentesco contigo</span><select name="parentesco" required defaultValue=""><option value="" disabled>Selecciona una relación</option>{RELACIONES.map((r) => <option key={r}>{r}</option>)}</select></label>
    </div>{error && <p className="error">{error}</p>}<div className="modal-acciones"><button type="button" className="secundario" onClick={onClose}>Cancelar</button><button className="primario">Crear integrante</button></div></form>
  </section></div>;
}

const seccionesFicha = [
  ["Datos personales", [["nombre", "Nombre completo"], ["dni", "DNI"], ["fecha_nacimiento", "Fecha de nacimiento", "date"], ["lugar_nacimiento", "Lugar de nacimiento"], ["estado_civil", "Estado civil"], ["telefono", "Teléfono"], ["correo_electronico", "Correo electrónico", "email"], ["departamento", "Departamento"], ["provincia", "Provincia"], ["distrito", "Distrito"], ["direccion_actual", "Dirección actual"]]],
  ["Información laboral", [["empresa", "Empresa"], ["cargo", "Cargo"], ["direccion_trabajo", "Dirección de trabajo"], ["telefono_laboral", "Teléfono laboral"]]],
  ["Salud", [["tipo_sangre", "Tipo de sangre"], ["seguro_medico", "Seguro médico"], ["alergias", "Alergias"], ["enfermedades_relevantes", "Enfermedades relevantes"], ["medicacion_habitual", "Medicación habitual"], ["medico_referencia", "Médico de referencia"]]],
  ["Observaciones generales", [["observaciones", "Observaciones generales"]]],
] as const;

const RELACIONES = ["Madre", "Padre", "Hija", "Hijo", "Hermana", "Hermano", "Esposa", "Esposo", "Pareja", "Abuela", "Abuelo", "Nieta", "Nieto", "Tía", "Tío", "Prima", "Primo", "Sobrina", "Sobrino", "Tutora", "Tutor", "Amiga", "Amigo", "Otro"];

function fechaActualizacion(valor?: string) {
  return valor ? new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(valor)) : "Sin actualización";
}

function ModalFicha({ integrante, puedeEditar, onClose, onSaved }: { integrante: Integrante; puedeEditar: boolean; onClose: () => void; onSaved: () => void }) {
  const [error, setError] = useState("");
  const [contactos, setContactos] = useState(integrante.contactos.length ? integrante.contactos : [{ nombre: "", relacion: "", telefono: "" }]);
  const [fechasImportantes, setFechasImportantes] = useState(integrante.fechas.length ? integrante.fechas : [{ titulo: "", fecha: "" }]);
  const [cuentas, setCuentas] = useState(integrante.cuentas.length ? integrante.cuentas : [{ banco_principal: "", tipo_cuenta: "", observaciones: "" }]);
  async function guardarFicha(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!puedeEditar) return;
    const valores = Object.fromEntries(new FormData(e.currentTarget));
    const respuesta = await fetch("/api/datos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: integrante.id, ...valores, contactos, fechas: fechasImportantes, cuentas }) });
    const json = await respuesta.json();
    if (!respuesta.ok) return setError(json.error ?? "No se pudo guardar la ficha");
    onSaved();
  }
  return <div className="velo" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="modal modal-ficha" role="dialog" aria-modal="true" aria-label={`Ficha de ${integrante.nombre}`}>
    <div className="modal-cabecera"><div><div className="etiqueta">{puedeEditar ? "FICHA EDITABLE" : "SOLO LECTURA"}</div><h2>{integrante.nombre}</h2><p>{integrante.edad} · {integrante.lugar}</p></div><button className="boton-icono" onClick={onClose} aria-label="Cerrar">×</button></div>
    <form onSubmit={guardarFicha}>{seccionesFicha.map(([titulo, campos]) => <fieldset key={titulo}><legend>{titulo}</legend><div className="campos">{campos.map(([nombre, etiqueta, tipo]) =>
      <label key={nombre}><span>{etiqueta}{nombre === "telefono" && <small>Actualizado: {fechaActualizacion(integrante.actualizado_en)}</small>}</span><input name={nombre} type={tipo ?? "text"} defaultValue={String(integrante[nombre as keyof Integrante] ?? "")} disabled={!puedeEditar} /></label>
    )}</div></fieldset>)}
      <ListaEditable titulo="Información financiera" actualizado={integrante.actualizado_en} puedeEditar={puedeEditar} onAdd={() => setCuentas([...cuentas, { banco_principal: "", tipo_cuenta: "", observaciones: "" }])}>
        {cuentas.map((c, i) => <div className="registro-repetible" key={i}><div className="campos"><label><span>Banco principal</span><input value={c.banco_principal} disabled={!puedeEditar} onChange={(e) => setCuentas(cuentas.map((x, n) => n === i ? { ...x, banco_principal: e.target.value } : x))} /></label><label><span>Tipo de cuenta</span><input value={c.tipo_cuenta} disabled={!puedeEditar} onChange={(e) => setCuentas(cuentas.map((x, n) => n === i ? { ...x, tipo_cuenta: e.target.value } : x))} /></label><label className="ancho"><span>Observaciones</span><input value={c.observaciones} disabled={!puedeEditar} onChange={(e) => setCuentas(cuentas.map((x, n) => n === i ? { ...x, observaciones: e.target.value } : x))} /></label></div>{puedeEditar && cuentas.length > 1 && <button type="button" className="quitar" onClick={() => setCuentas(cuentas.filter((_, n) => n !== i))}>Eliminar</button>}</div>)}
      </ListaEditable>
      <ListaEditable titulo="Contactos de emergencia" actualizado={integrante.actualizado_en} puedeEditar={puedeEditar} onAdd={() => setContactos([...contactos, { nombre: "", relacion: "", telefono: "" }])}>
        {contactos.map((c, i) => <div className="registro-repetible" key={i}><div className="campos tres"><label><span>Nombre</span><input value={c.nombre} disabled={!puedeEditar} onChange={(e) => setContactos(contactos.map((x, n) => n === i ? { ...x, nombre: e.target.value } : x))} /></label><label><span>Relación</span><select value={c.relacion} disabled={!puedeEditar} onChange={(e) => setContactos(contactos.map((x, n) => n === i ? { ...x, relacion: e.target.value } : x))}><option value="">Selecciona</option>{RELACIONES.map((r) => <option key={r}>{r}</option>)}</select></label><label><span>Teléfono</span><input value={c.telefono} disabled={!puedeEditar} onChange={(e) => setContactos(contactos.map((x, n) => n === i ? { ...x, telefono: e.target.value } : x))} /></label></div>{puedeEditar && contactos.length > 1 && <button type="button" className="quitar" onClick={() => setContactos(contactos.filter((_, n) => n !== i))}>Eliminar</button>}</div>)}
      </ListaEditable>
      <ListaEditable titulo="Fechas importantes" actualizado={integrante.actualizado_en} puedeEditar={puedeEditar} onAdd={() => setFechasImportantes([...fechasImportantes, { titulo: "", fecha: "" }])}>
        {fechasImportantes.map((f, i) => <div className="registro-repetible" key={i}><div className="campos"><label><span>Descripción</span><input value={f.titulo} disabled={!puedeEditar} onChange={(e) => setFechasImportantes(fechasImportantes.map((x, n) => n === i ? { ...x, titulo: e.target.value } : x))} /></label><label><span>Fecha</span><input type="date" value={f.fecha} disabled={!puedeEditar} onChange={(e) => setFechasImportantes(fechasImportantes.map((x, n) => n === i ? { ...x, fecha: e.target.value } : x))} /></label></div>{puedeEditar && fechasImportantes.length > 1 && <button type="button" className="quitar" onClick={() => setFechasImportantes(fechasImportantes.filter((_, n) => n !== i))}>Eliminar</button>}</div>)}
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
