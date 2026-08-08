import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const ROLES_ADMIN = ["dueña", "admin"];

export async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  const rol = session.user.rol ?? "vendedora";
  if (!ROLES_ADMIN.includes(rol)) redirect("/dashboard");
  return session;
}

export async function requireDuena() {
  const session = await requireAuth();
  if (session.user.rol !== "dueña") redirect("/dashboard");
  return session;
}

export function esAdmin(rol?: string | null): boolean {
  return ROLES_ADMIN.includes(rol ?? "");
}

/** true si el rol puede ver costo/beneficio/margen (dueña/admin) — vendedora nunca. */
export function puedeVerCostos(rol?: string | null): boolean {
  return esAdmin(rol);
}
