import { createHmac, timingSafeEqual } from "node:crypto";

export type SesionFamilia = {
  usuarioId: string;
  rol: "administrador" | "integrante";
  exp: number;
};

function secreto() {
  const valor = process.env.SESSION_SECRET;
  if (!valor) throw new Error("SESSION_SECRET no configurado");
  return valor;
}

function firma(valor: string) {
  return createHmac("sha256", secreto()).update(valor).digest("base64url");
}

export function crearTokenSesion(datos: Omit<SesionFamilia, "exp">) {
  const carga = Buffer.from(JSON.stringify({
    ...datos,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  })).toString("base64url");
  return `${carga}.${firma(carga)}`;
}

export function leerTokenSesion(token?: string): SesionFamilia | null {
  if (!token) return null;
  const [carga, recibida] = token.split(".");
  if (!carga || !recibida) return null;
  const esperada = firma(carga);
  const a = Buffer.from(recibida);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const datos = JSON.parse(Buffer.from(carga, "base64url").toString()) as SesionFamilia;
  return datos.exp > Date.now() ? datos : null;
}
