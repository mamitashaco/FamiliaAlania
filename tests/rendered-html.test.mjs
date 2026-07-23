import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("la interfaz incluye los módulos familiares y el acceso seguro", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  for (const texto of ["Integrantes", "Salud", "Finanzas", "Precios", "Educación", "Seguros", "Viajes y eventos", "Mascotas", "Archivos históricos"]) {
    assert.match(page, new RegExp(texto));
  }
  assert.match(page, /maxLength=\{8\}/);
  assert.match(page, /modo|oscuro/i);
});

test("el esquema Supabase usa prefijo tb y activa RLS", async () => {
  const sql = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  assert.match(sql, /create table tb_usuarios/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /fn_restablecer_clave/i);
  assert.match(sql, /fn_es_administrador/i);
});
