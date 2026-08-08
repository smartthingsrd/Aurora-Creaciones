import type { Metadata } from "next";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/session-provider";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });
// Serif con carácter solo para títulos/wordmark — datos y formularios se
// quedan en Geist (--font-sans) para no sacrificar legibilidad operativa.
const fraunces = Fraunces({ variable: "--font-heading", subsets: ["latin"], weight: ["500", "600"] });

export const metadata: Metadata = {
  title: "Aurora Creaciones — Sistema",
  description: "Sistema de gestión y costeo de producción para Aurora Creaciones",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
