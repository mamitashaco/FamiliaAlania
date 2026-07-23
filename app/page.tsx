"use client";

import { FormEvent, useMemo, useState } from "react";

type Registro = { titulo: string; detalle: string; meta: string; estado?: string };

const navegacion = [
  ["Inicio", "⌂"], ["Integrantes", "◎"], ["Salud", "♡"], ["Finanzas", "▥"],
  ["Precios", "⌕"], ["Educación", "▤"], ["Seguros", "◇"], ["Viajes y eventos", "✦"],
  ["Mascotas", "♧"], ["Archivos históricos", "□"],
];

const integrantes = [
  { iniciales: "RA", nombre: "Rosa Alania", rol: "Administradora", edad: "68 años", lugar: "Lima", codigo: "•••• 1024" },
  { iniciales: "CA", nombre: "Carlos Alania", rol: "Integrante", edad: "70 años", lugar: "Lima", codigo: "•••• 2086" },
  { iniciales: "MA", nombre: "María Alania", rol: "Integrante", edad: "42 años", lugar: "Arequipa", codigo: "•••• 3142" },
  { iniciales: "JA", nombre: "Jorge Alania", rol: "Integrante", edad: "39 años", lugar: "Cusco", codigo: "•••• 4098" },
];

const datos: Record<string, Registro[]> = {
  Salud: [
    { titulo: "Control cardiológico", detalle: "Carlos Alania · Clínica San Felipe", meta: "03 ago 2026", estado: "Próximo" },
    { titulo: "Losartán 50 mg", detalle: "1 tableta cada 24 horas", meta: "Renovar en 6 días", estado: "Atención" },
    { titulo: "Vacuna influenza", detalle: "Rosa Alania · Dosis anual", meta: "Aplicada 18 jun 2026", estado: "Al día" },
  ],
  Finanzas: [
    { titulo: "Ingresos familiares", detalle: "Julio 2026", meta: "S/ 7,850.00", estado: "+4.2%" },
    { titulo: "Gastos del mes", detalle: "Hogar, salud y alimentación", meta: "S/ 4,280.00", estado: "54.5%" },
    { titulo: "Balance disponible", detalle: "Actualizado hoy", meta: "S/ 3,570.00", estado: "Positivo" },
  ],
  Precios: [
    { titulo: "Aceite vegetal 1 L", detalle: "Plaza Vea · Botella", meta: "S/ 9.90", estado: "Mejor precio" },
    { titulo: "Leche evaporada 400 g", detalle: "Tottus · Lata", meta: "S/ 4.20", estado: "−6%" },
    { titulo: "Arroz extra 5 kg", detalle: "Metro · Bolsa", meta: "S/ 22.90", estado: "Estable" },
  ],
  Educación: [
    { titulo: "Certificado de Excel avanzado", detalle: "María · Universidad del Pacífico", meta: "PDF · 1.8 MB", estado: "Verificado" },
    { titulo: "Título profesional", detalle: "Jorge · Universidad Nacional", meta: "Imagen · 2.4 MB", estado: "Archivo" },
  ],
  Seguros: [
    { titulo: "Seguro de salud familiar", detalle: "Rímac · Póliza 0089214", meta: "Vence 18 dic 2026", estado: "Vigente" },
    { titulo: "Seguro vehicular", detalle: "Pacífico · Toyota Corolla", meta: "Vence 04 oct 2026", estado: "Por renovar" },
  ],
  "Viajes y eventos": [
    { titulo: "Reunión familiar 2026", detalle: "Cieneguilla · 12 participantes", meta: "16 ago · 12:00", estado: "Confirmado" },
    { titulo: "Viaje a Arequipa", detalle: "4 integrantes · 5 días", meta: "02–07 sep", estado: "Planificando" },
  ],
  Mascotas: [
    { titulo: "Luna", detalle: "Golden retriever · 5 años", meta: "Vacuna: 12 ago", estado: "Control pendiente" },
    { titulo: "Milo", detalle: "Gato mestizo · 3 años", meta: "Último control: 02 jul", estado: "Saludable" },
  ],
  "Archivos históricos": [
    { titulo: "Álbum familiar 1984", detalle: "36 fotografías digitalizadas", meta: "Actualizado 14 jul", estado: "Fotos" },
    { titulo: "Partida de matrimonio", detalle: "Rosa y Carlos Alania", meta: "PDF · 840 KB", estado: "Documento" },
  ],
};

const fechas = [
  { dia: "24", mes: "JUL", titulo: "Cumpleaños de Rosa", detalle: "En 4 días · 68 años" },
  { dia: "03", mes: "AGO", titulo: "Control cardiológico", detalle: "Carlos · Clínica San Felipe" },
  { dia: "12", mes: "AGO", titulo: "Vacuna anual de Luna", detalle: "Veterinaria PetSalud" },
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

  const personasFiltradas = useMemo(
    () => integrantes.filter((p) => p.nombre.toLowerCase().includes(buscar.toLowerCase())),
    [buscar],
  );

  function ingresar(e: FormEvent) {
    e.preventDefault();
    if (codigo.length === 8 && clave.length >= 8) {
      setError("");
      setSesion(true);
    } else setError("Ingresa un código de 8 dígitos y una contraseña válida.");
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
      <aside className="sidebar">
        <div className="identidad"><div className="marca pequena">FA</div><div><strong>Familia Alania</strong><span>Nuestro espacio</span></div></div>
        <nav aria-label="Navegación principal">
          {navegacion.map(([nombre, icono]) => (
            <button key={nombre} className={seccion === nombre ? "activo" : ""} onClick={() => setSeccion(nombre)}>
              <Icono>{icono}</Icono><span>{nombre}</span>{nombre === "Salud" && <b>2</b>}
            </button>
          ))}
        </nav>
        <div className="usuario">
          <span className="avatar">RA</span><div><strong>Rosa Alania</strong><small>Administradora</small></div><button onClick={() => setSesion(false)} title="Cerrar sesión">↗</button>
        </div>
      </aside>

      <main className="contenido">
        <header className="barra">
          <div className="miga">Familia Alania <span>/</span> {seccion}</div>
          <div className="acciones">
            <button className="boton-icono" aria-label="Buscar">⌕</button>
            <button className="boton-icono notificacion" aria-label="Notificaciones">♢<b>3</b></button>
            <button className="secundario" onClick={() => setOscuro(!oscuro)}>{oscuro ? "☀ Claro" : "☾ Oscuro"}</button>
          </div>
        </header>

        <div className="pagina">
          {seccion === "Inicio" ? <Inicio onNavigate={setSeccion} onAdd={() => setModal("Agregar registro")} /> :
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

function Inicio({ onNavigate, onAdd }: { onNavigate: (s: string) => void; onAdd: () => void }) {
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
      <article><span>Próximas fechas</span><strong>6</strong><small>En los siguientes 30 días</small></article>
      <article><span>Gastos de julio</span><strong>S/ 4,280</strong><small>12% menos que junio</small></article>
      <article><span>Ahorro en precios</span><strong>S/ 186</strong><small>Comparando 24 productos</small></article>
    </section>
    <div className="grilla-inicio">
      <section>
        <div className="cabecera-seccion"><div><h2>Próximas fechas</h2><p>Eventos y recordatorios familiares</p></div><button onClick={() => onNavigate("Viajes y eventos")}>Ver calendario →</button></div>
        <div className="tarjeta lista-fechas">{fechas.map((f) => <article key={f.titulo}><div className="fecha"><strong>{f.dia}</strong><span>{f.mes}</span></div><div><h3>{f.titulo}</h3><p>{f.detalle}</p></div><button>›</button></article>)}</div>
      </section>
      <section>
        <div className="cabecera-seccion"><div><h2>Integrantes</h2><p>4 miembros registrados</p></div><button onClick={() => onNavigate("Integrantes")}>Ver todos →</button></div>
        <div className="tarjeta lista-personas">{integrantes.slice(0, 3).map((p) => <button key={p.nombre} onClick={() => onNavigate("Integrantes")}><span className="avatar">{p.iniciales}</span><span><strong>{p.nombre}</strong><small>{p.edad} · {p.lugar}</small></span><i>›</i></button>)}</div>
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
