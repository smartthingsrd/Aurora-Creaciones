import { NextResponse } from "next/server";
import { auth } from "@/auth";

export type RouteCtx = { userId: string; rol: string };

type Handler<Rest extends unknown[]> = (
  req: Request,
  ctx: RouteCtx,
  ...rest: Rest
) => Promise<Response>;

/** Envuelve una ruta API de negocio: exige sesión (+ rol si se pide). */
export function withAuthRoute<Rest extends unknown[]>(
  handler: Handler<Rest>,
  opts: { roles?: string[] } = {}
) {
  return async (req: Request, ...rest: Rest): Promise<Response> => {
    const session = await auth();
    const user = session?.user;
    if (!session || !user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (opts.roles && !opts.roles.includes(user.rol ?? "")) {
      return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
    }
    return handler(req, { userId: user.id, rol: user.rol ?? "vendedora" }, ...rest);
  };
}
