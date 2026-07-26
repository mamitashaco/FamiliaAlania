"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Registro = { titulo: string; detalle: string; meta: string; estado?: string };

const navegacion = [
  ["Inicio", "⌂"], ["Integrantes", "◎"], ["Salud", "♡"], ["Finanzas", "▥"],
  ["Precios", "⌕"], ["Educación", "▤"], ["Seguros", "◇"], ["Viajes y eventos", "✦"],
  ["Mascotas", "♧"], ["Archivos históricos", "□"],
];

const integrantes = [
  { iniciales: "RA", nombre: "Rosa Elena Alania Quispe", rol: "Administradora", edad: "68 años", lugar: "Lima", codigo: "•••• 1024" },
  { iniciales: "CA", nombre: "Carlos Alberto Alania Soto", rol: "Integrante", edad: "70 años", lugar: "Lima", codigo: "•••• 2086" },
  { iniciales: "MA", nombre: "María Fernanda Alania", rol: "Integrante", edad: "42 años", lugar: "Arequipa", codigo: "•••• 3142" },
  { iniciales: "JA", nombre: "Jorge Luis Alania", rol: "Integrante", edad: "39 años", lugar: "Cusco", codigo: "•••• 4098" },
  { iniciales: "LA", nombre: "Lucía Alania Vargas", rol: "Integrante", edad: "16 años", lugar: "Lima", codigo: "•••• 5184" },
  { iniciales: "DA", nombre: "Diego Alania Vargas", rol: "Integrante", edad: "12 años", lugar: "Lima", codigo: "•••• 6210" },
];

const datos: Record<string, Registro[]> = {
  Salud: [
    { titulo: "Control cardiológico", detalle: "Carlos Alania · Clínica San Felipe", meta: "03 ago 2026", estado: "Próximo" },
    { titulo: "Losartán 50 mg", detalle: "1 tableta cada 24 horas", meta: "Renovar en 6 días", estado: "Atención" },
    { titulo: "Vacuna influenza", detalle: "Rosa Alania · Dosis anual", meta: "Aplicada 18 jun 2026", estado: "Al día" },
    { titulo: "Hemograma completo", detalle: "Rosa Alania · Laboratorio Roe", meta: "12 jul 2026", estado: "Normal" },
    { titulo: "Presión arterial", detalle: "Carlos · 128/82 mmHg · Pulso 72", meta: "Hoy, 08:30", estado: "Estable" },
  ],
  Finanzas: [
    { titulo: "Ingresos familiares", detalle: "Julio 2026", meta: "S/ 7,850.00", estado: "+4.2%" },
    { titulo: "Gastos del mes", detalle: "Hogar, salud y alimentación", meta: "S/ 4,280.00", estado: "54.5%" },
    { titulo: "Balance disponible", detalle: "Actualizado hoy", meta: "S/ 3,570.00", estado: "Positivo" },
    { titulo: "Compra de supermercado", detalle: "Alimentación · Plaza Vea", meta: "− S/ 286.40", estado: "Hoy" },
    { titulo: "Pago de electricidad", detalle: "Servicios · Luz del Sur", meta: "− S/ 164.80", estado: "Pagado" },
  ],
  Precios: [
    { titulo: "Aceite vegetal 1 L", detalle: "Plaza Vea · Botella", meta: "S/ 9.90", estado: "Mejor precio" },
    { titulo: "Leche evaporada 400 g", detalle: "Tottus · Lata", meta: "S/ 4.20", estado: "−6%" },
    { titulo: "Arroz extra 5 kg", detalle: "Metro · Bolsa", meta: "S/ 22.90", estado: "Estable" },
    { titulo: "Detergente 2.6 kg", detalle: "Makro · Bolsa", meta: "S/ 27.50", estado: "−12%" },
    { titulo: "Papel higiénico 24 und.", detalle: "Tottus · Paquete", meta: "S/ 21.90", estado: "Mejor precio" },
  ],
  Educación: [
    { titulo: "Certificado de Excel avanzado", detalle: "María · Universidad del Pacífico", meta: "PDF · 1.8 MB", estado: "Verificado" },
    { titulo: "Título profesional", detalle: "Jorge · Universidad Nacional", meta: "Imagen · 2.4 MB", estado: "Archivo" },
    { titulo: "Curso de inglés B2", detalle: "Lucía · ICPNA", meta: "PDF · 920 KB", estado: "En curso" },
    { titulo: "Constancia de matrícula", detalle: "Diego · Colegio San Marcos", meta: "PDF · 640 KB", estado: "2026" },
  ],
  Seguros: [
    { titulo: "Seguro de salud familiar", detalle: "Rímac · Póliza 0089214", meta: "Vence 18 dic 2026", estado: "Vigente" },
    { titulo: "Seguro vehicular", detalle: "Pacífico · Toyota Corolla", meta: "Vence 04 oct 2026", estado: "Por renovar" },
    { titulo: "Seguro del hogar", detalle: "Mapfre · Casa familiar Surco", meta: "Vence 22 feb 2027", estado: "Vigente" },
    { titulo: "SOAT", detalle: "La Positiva · Placa BKT-582", meta: "Vence 09 nov 2026", estado: "Vigente" },
  ],
  "Viajes y eventos": [
    { titulo: "Reunión familiar 2026", detalle: "Cieneguilla · 12 participantes", meta: "16 ago · 12:00", estado: "Confirmado" },
    { titulo: "Viaje a Arequipa", detalle: "4 integrantes · 5 días", meta: "02–07 sep", estado: "Planificando" },
    { titulo: "Aniversario de Rosa y Carlos", detalle: "Cena familiar · Miraflores", meta: "28 ago · 20:00", estado: "Reservado" },
    { titulo: "Paseo a Lunahuaná", detalle: "6 integrantes · Presupuesto S/ 1,200", meta: "10–11 oct", estado: "Propuesta" },
  ],
  Mascotas: [
    { titulo: "Luna", detalle: "Golden retriever · 5 años", meta: "Vacuna: 12 ago", estado: "Control pendiente" },
    { titulo: "Milo", detalle: "Gato mestizo · 3 años", meta: "Último control: 02 jul", estado: "Saludable" },
    { titulo: "Desparasitación de Luna", detalle: "PetSalud · Dra. Valeria Ríos", meta: "15 jun 2026", estado: "Completado" },
    { titulo: "Control dental de Milo", detalle: "Veterinaria San Borja", meta: "26 ago 2026", estado: "Programado" },
  ],
  "Archivos históricos": [
    { titulo: "Álbum familiar 1984", detalle: "36 fotografías digitalizadas", meta: "Actualizado 14 jul", estado: "Fotos" },
    { titulo: "Partida de matrimonio", detalle: "Rosa y Carlos Alania", meta: "PDF · 840 KB", estado: "Documento" },
    { titulo: "Fotografías de Huancayo 1998", detalle: "18 imágenes restauradas", meta: "Actualizado 05 jul", estado: "Fotos" },
    { titulo: "Árbol genealógico Alania", detalle: "Cinco generaciones documentadas", meta: "PDF · 3.2 MB", estado: "Historia" },
  ],
};

const fechas = [
  { dia: "24", mes: "JUL", titulo: "Cumpleaños de Rosa", detalle: "En 4 días · 68 años" },
  { dia: "03", mes: "AGO", titulo: "Control cardiológico", detalle: "Carlos · Clínica San Felipe" },
  { dia: "12", mes: "AGO", titulo: "Vacuna anual de Luna", detalle: "Veterinaria PetSalud" },
  { dia: "16", mes: "AGO", titulo: "Reunión familiar", detalle: "Cieneguilla · 12:00" },
];

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
  const [integrantesBd, setIntegrantesBd] = useState<typeof integrantes>([]);

  async function cargarDatos() {
    const respuesta = await fetch("/api/datos");
    if (!respuesta.ok) return;
    const json = await respuesta.json();
    setIntegrantesBd((json.integrantes ?? []).map((p: {
      nombre_completo: string; edad: number | null; departamento: string | null; usuario_id: string | null;
    }) => {
      const partes = p.nombre_completo.split(" ");
      return {
        iniciales: `${partes[0]?.[0] ?? ""}${partes[1]?.[0] ?? ""}`.toUpperCase(),
        nombre: p.nombre_completo,
        rol: p.usuario_id ? "Integrante" : "Familiar",
        edad: p.edad == null ? "Edad sin registrar" : `${p.edad} años`,
        lugar: p.departamento ?? "Perú",
        codigo: p.usuario_id ? "Usuario vinculado" : "Sin acceso",
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

  const integrantesVisibles = integrantesBd.length ? integrantesBd : integrantes;

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
            {navegacion.map(([nombre]) => (
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
          <div className="aviso-demo"><span>DATOS DE DEMOSTRACIÓN</span><p>Explora libremente. La información mostrada es ficticia y sirve para evaluar el diseño.</p></div>
          {seccion === "Inicio" ? <Inicio personas={integrantesVisibles} onNavigate={setSeccion} onAdd={() => setModal("Agregar registro")} /> :
            seccion === "Integrantes" ? (
              <VistaIntegrantes buscar={buscar} setBuscar={setBuscar} personas={personasFiltradas} onAdd={() => setModal("Nuevo integrante")} />
            ) : (
              <VistaModulo titulo={seccion} registros={datos[seccion] ?? []} onAdd={() => setModal(`Nuevo registro · ${seccion}`)} />
            )}
        </div>
      </main>

      {aviso && <div className="toast" role="status">✓ {aviso}</div>}
      {modal && <Modal titulo={modal} seccion={seccion} onClose={() => setModal(null)} onSave={guardar} />}
    </div>
  );
}

function Inicio({ personas, onNavigate, onAdd }: { personas: typeof integrantes; onNavigate: (s: string) => void; onAdd: () => void }) {
  const resumen = [
    ["♡", "Salud", "3 próximas citas", "2 medicamentos por renovar"],
    ["▥", "Finanzas", "S/ 3,570", "Balance disponible de julio"],
    ["⌕", "Precios", "24 productos", "5 bajaron de precio"],
    ["♧", "Mascotas", "Luna y Milo", "1 vacuna pendiente"],
  ];
  return <>
    <section className="bienvenida">
      <div><div className="etiqueta">JUEVES, 23 DE JULIO</div><h1>Buenos días, Rosa</h1><p>Esto es lo importante para tu familia esta semana.</p></div>
      <button className="primario" onClick={onAdd}>＋ Agregar registro</button>
    </section>
    <section className="metricas">
      <article><span>Próximas fechas</span><strong>8</strong><small>En los siguientes 30 días</small></article>
      <article><span>Gastos de julio</span><strong>S/ 4,280</strong><small>12% menos que junio</small></article>
      <article><span>Ahorro en precios</span><strong>S/ 186</strong><small>Comparando 24 productos</small></article>
    </section>
    <div className="grilla-inicio">
      <section>
        <div className="cabecera-seccion"><div><h2>Próximas fechas</h2><p>Eventos y recordatorios familiares</p></div><button onClick={() => onNavigate("Viajes y eventos")}>Ver calendario →</button></div>
        <div className="tarjeta lista-fechas">{fechas.map((f) => <article key={f.titulo}><div className="fecha"><strong>{f.dia}</strong><span>{f.mes}</span></div><div><h3>{f.titulo}</h3><p>{f.detalle}</p></div><button>›</button></article>)}</div>
      </section>
      <section>
        <div className="cabecera-seccion"><div><h2>Integrantes</h2><p>{personas.length} miembros registrados</p></div><button onClick={() => onNavigate("Integrantes")}>Ver todos →</button></div>
        <div className="tarjeta lista-personas">{personas.slice(0, 3).map((p) => <button key={p.nombre} onClick={() => onNavigate("Integrantes")}><span className="avatar">{p.iniciales}</span><span><strong>{p.nombre}</strong><small>{p.edad} · {p.lugar}</small></span><i>›</i></button>)}</div>
      </section>
    </div>
    <div className="cabecera-seccion separada"><div><h2>Vista general</h2><p>Acceso a la información esencial</p></div></div>
    <section className="modulos">{resumen.map(([icono, titulo, dato, nota]) => <button className="tarjeta modulo" key={titulo} onClick={() => onNavigate(titulo)}><Icono>{icono}</Icono><span className="flecha">↗</span><h3>{titulo}</h3><strong>{dato}</strong><small>{nota}</small></button>)}</section>
  </>;
}

function VistaIntegrantes({ buscar, setBuscar, personas, onAdd }: { buscar: string; setBuscar: (s: string) => void; personas: typeof integrantes; onAdd: () => void }) {
  return <>
    <TituloPagina etiqueta="FAMILIA" titulo="Integrantes" descripcion="Perfiles, contactos y datos importantes de cada miembro." onAdd={onAdd} textoBoton="Nuevo integrante" />
    <div className="herramientas"><div className="buscador">⌕<input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por nombre" /></div><button className="secundario">Todos los roles⌄</button></div>
    <section className="grilla-personas">{personas.map((p, i) => <article className="tarjeta ficha" key={p.nombre}><div className="ficha-arriba"><span className="avatar grande">{p.iniciales}</span><span className="insignia">{p.rol}</span></div><h2>{p.nombre}</h2><p>{p.edad} · {p.lugar}</p><dl><div><dt>Código</dt><dd>{p.codigo}</dd></div><div><dt>Estado</dt><dd>Activo</dd></div></dl><div className="ficha-acciones"><button className="secundario">Ver ficha</button><button className="boton-icono" aria-label="Más opciones">•••</button></div>{i === 0 && <span className="propio">Tu perfil · Puedes editar</span>}</article>)}</section>
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
    <section className="tarjeta tabla"><div className="tabla-cabecera"><span>Registro</span><span>Detalle</span><span>Información</span><span>Estado</span></div>{registros.map((r) => <button className="tabla-fila" key={r.titulo}><span><i className="punto" /> <strong>{r.titulo}</strong></span><span>{r.detalle}</span><span>{r.meta}</span><span><b className="insignia">{r.estado}</b> ›</span></button>)}</section>
  </>;
}

function TituloPagina({ etiqueta, titulo, descripcion, onAdd, textoBoton }: { etiqueta: string; titulo: string; descripcion: string; onAdd: () => void; textoBoton: string }) {
  return <section className="titulo-pagina"><div><div className="etiqueta">{etiqueta}</div><h1>{titulo}</h1><p>{descripcion}</p></div><button className="primario" onClick={onAdd}>＋ {textoBoton}</button></section>;
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
