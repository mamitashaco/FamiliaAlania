import { createClient } from "@supabase/supabase-js";

export function supabaseServidor() {
  const url = process.env.SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !clave) throw new Error("Supabase no está configurado");
  return createClient(url, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
