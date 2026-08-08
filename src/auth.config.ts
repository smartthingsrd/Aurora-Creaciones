import type { NextAuthConfig } from "next-auth";

// Rutas solo accesibles para admin/dueña — administración de insumos/costos y reportes.
const RUTAS_ADMIN = [
  "/recursos",
  "/reportes",
  "/usuarios",
  "/api/recursos",
  "/api/usuarios",
  "/api/reportes",
];

export const ROLES_ADMIN = ["dueña", "admin"];

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = user.rol;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.rol = token.rol;
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/setup") || pathname === "/setup") {
        return true;
      }

      if (isLoggedIn && pathname === "/login") {
        return Response.redirect(new URL("/", nextUrl));
      }

      if (!isLoggedIn && pathname !== "/login") {
        return false;
      }

      if (isLoggedIn) {
        const rol = auth!.user.rol ?? "vendedora";
        const esAdmin = ROLES_ADMIN.includes(rol);
        if (!esAdmin && RUTAS_ADMIN.some((r) => pathname.startsWith(r))) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
