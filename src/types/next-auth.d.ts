import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    rol: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: string;
  }
}

// `next-auth/jwt` sólo re-exporta el JWT de `@auth/core/jwt` (export *) — el
// augment de arriba no siempre se fusiona con el original a través del
// re-export, así que se declara también directo contra el paquete base.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    rol: string;
  }
}
