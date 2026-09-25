import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "peluquita",
  description: "Sistema de gestión para peluquerías, barberías y salones de belleza",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
