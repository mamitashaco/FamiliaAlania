import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Familia Alania — Nuestro espacio",
  description: "Información, salud, recuerdos y bienestar de la Familia Alania en un solo lugar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
