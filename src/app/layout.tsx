import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/session-provider";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aurora Creaciones — Sistema",
  description: "Sistema de gestión y costeo de producción para Aurora Creaciones",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
