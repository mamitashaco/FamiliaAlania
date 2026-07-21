"use client";

import { useMemo, useState } from "react";

const nav = [
  ["Inicio", "⌂"], ["Integrantes", "♙"], ["Salud", "♡"], ["Vivienda", "⌑"],
  ["Finanzas", "▥"], ["Precios", "⌕"], ["Educación", "▤"], ["Seguros", "◇"],
  ["Viajes y eventos", "✦"], ["Mascotas", "♧"], ["Archivo histórico", "□"],
];

const people = [
  { initials: "RA", name: "Rosa Alania", role: "Administradora", meta: "68 años · Lima", color: "#d7a76f" },
  { initials: "CA", name: "Carlos Alania", role: "Integrante", meta: "70 años · Lima", color: "#6f9b94" },
  { initials: "MA", name: "María Alania", role: "Integrante", meta: "42 años · Arequipa", color: "#9678a8" },
  { initials: "JA", name: "Jorge Alania", role: "Integrante", meta: "39 años · Cusco", color: "#6183a5" },
];

const events = [
  { day: "24", month: "JUL", title: "Cumpleaños de Rosa", detail: "En 4 días · 68 años", tone: "terracotta" },
  { day: "03", month: "AGO", title: "Control cardiológico", detail: "Carlos · Clínica San Felipe", tone: "sage" },
  { day: "12", month: "AGO", title: "Vacuna anual de Luna", detail: "Mascota · Veterinaria PetSalud", tone: "blue" },
];

const modules = [
  { icon: "♡", title: "Salud", detail: "3 próximas citas", note: "2 medicamentos por renovar", tone: "#b65f4a" },
  { icon: "▥", title: "Finanzas", detail: "Resumen de julio", note: "Gastos S/ 4,280", tone: "#537f72" },
  { icon: "⌕", title: "Precios", detail: "24 productos", note: "5 bajaron de precio", tone: "#516f8d" },
  { icon: "♧", title: "Mascotas", detail: "Luna y Milo", note: "1 vacuna pendiente", tone: "#816c55" },
];

export default function Home() {
  const [logged, setLogged] = useState(false);
  const [code, setCode] = useState("");
  const [active, setActive] = useState("Inicio");
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => people.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())), [search]);

  if (!logged) return (
    <main className={`login-page ${dark ? "dark" : ""}`}>
      <button className="theme-float" aria-label="Cambiar tema" onClick={() => setDark(!dark)}>{dark ? "☀" : "☾"}</button>
      <section className="login-card">
        <div className="brand-mark">FA</div>
        <p className="eyebrow">NUESTRO ESPACIO PRIVADO</p>
        <h1>Familia Alania</h1>
        <p className="login-copy">La historia, el cuidado y los recuerdos de nuestra familia, siempre cerca.</p>
        <form onSubmit={(e) => { e.preventDefault(); if (code.length === 8) setLogged(true); }}>
          <label htmlFor="codigo">Código familiar</label>
          <input id="codigo" inputMode="numeric" maxLength={8} placeholder="••••••••" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          <label htmlFor="password">Contraseña</label>
          <input id="password" type="password" placeholder="Tu contraseña" defaultValue="12345678" />
          <button className="primary" type="submit">Ingresar <span>→</span></button>
        </form>
        <p className="login-help">La contraseña inicial es tu código de 8 dígitos.</p>
      </section>
      <p className="privacy">⌾ Información protegida para uso exclusivo de la familia</p>
    </main>
  );

  return (
    <div className={`app-shell ${dark ? "dark" : ""}`}>
      <aside>
        <div className="brand"><div className="brand-mark small">FA</div><div><strong>Familia Alania</strong><span>Nuestro espacio</span></div></div>
        <nav>{nav.map(([label, icon]) => <button key={label} className={active === label ? "active" : ""} onClick={() => setActive(label)}><i>{icon}</i>{label}{label === "Salud" && <b>2</b>}</button>)}</nav>
        <div className="side-user"><div className="avatar">RA</div><div><strong>Rosa Alania</strong><span>Administradora</span></div><button aria-label="Más opciones">•••</button></div>
      </aside>
      <main className="content">
        <header>
          <button className="mobile-menu">☰</button>
          <div className="breadcrumbs">Familia Alania <span>/</span> {active}</div>
          <div className="header-actions"><button className="icon-btn">⌕</button><button className="icon-btn notify">♢<b>3</b></button><button className="theme-toggle" onClick={() => setDark(!dark)}>{dark ? "☀ Claro" : "☾ Oscuro"}</button></div>
        </header>
        <div className="page-body">
          <section className="welcome">
            <div><p className="eyebrow">LUNES, 20 DE JULIO</p><h1>Buenos días, Rosa <span>✦</span></h1><p>Aquí tienes un resumen de lo importante para tu familia.</p></div>
            <button className="primary add">＋ Agregar registro</button>
          </section>

          <section className="dashboard-grid">
            <div className="main-column">
              <div className="section-head"><div><h2>Próximas fechas</h2><p>Eventos y recordatorios familiares</p></div><button>Ver calendario →</button></div>
              <div className="event-list">{events.map((e) => <article className="event" key={e.title}><div className={`date ${e.tone}`}><strong>{e.day}</strong><span>{e.month}</span></div><div><h3>{e.title}</h3><p>{e.detail}</p></div><button aria-label="Ver detalle">›</button></article>)}</div>
              <div className="section-head modules-head"><div><h2>Vista general</h2><p>Información esencial de la familia</p></div></div>
              <div className="module-grid">{modules.map((m) => <article className="module" key={m.title}><div className="module-icon" style={{color:m.tone, background:`${m.tone}18`}}>{m.icon}</div><button>•••</button><h3>{m.title}</h3><p>{m.detail}</p><span>{m.note}</span><div className="progress"><i style={{width: m.title === "Finanzas" ? "72%" : "48%", background:m.tone}} /></div></article>)}</div>
            </div>
            <div className="side-column">
              <section className="family-card"><div className="section-head"><div><h2>Integrantes</h2><p>{people.length} miembros registrados</p></div><button className="round">＋</button></div><div className="search"><span>⌕</span><input placeholder="Buscar integrante" value={search} onChange={(e) => setSearch(e.target.value)} /></div>{filtered.map((p) => <button className="person" key={p.name}><span className="person-avatar" style={{background:p.color}}>{p.initials}</span><span><strong>{p.name}</strong><small>{p.meta}</small></span><i>›</i></button>)}<button className="all-members" onClick={() => setActive("Integrantes")}>Ver todos los integrantes →</button></section>
              <section className="alert-card"><div className="alert-icon">!</div><div><span>SALUD</span><h3>Medicamentos por renovar</h3><p>2 recetas vencen esta semana.</p><button>Revisar ahora →</button></div></section>
              <section className="quick"><h2>Acceso rápido</h2><div><button><i>⌕</i><span>Registrar<br/>precio</span></button><button><i>▤</i><span>Subir<br/>documento</span></button><button><i>♡</i><span>Añadir<br/>medicamento</span></button></div></section>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
