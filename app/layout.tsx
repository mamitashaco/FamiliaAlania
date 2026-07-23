import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Familia Alania · Nuestro espacio",
  description: "Gestión privada de salud, finanzas, documentos y recuerdos de la Familia Alania.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
