import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthRoute } from "@/lib/api-guard";
import { ROLES_ADMIN } from "@/lib/permisos";
import bcrypt from "bcryptjs";

export const GET = withAuthRoute(
  async () => {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, email: true, rol: true, activo: true, creadoEn: true },
    });
    return NextResponse.json(usuarios);
  },
  { roles: ROLES_ADMIN }
);

export const POST = withAuthRoute(
  async (req, ctx) => {
    const { nombre, email, password, rol } = await req.json();
    if (!nombre || !email || !password || !rol) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    if (rol === "dueña" && ctx.rol !== "dueña") {
      return NextResponse.json({ error: "Solo la dueña puede crear otra cuenta dueña" }, { status: 403 });
    }
    const hash = await bcrypt.hash(String(password), 12);
    const usuario = await prisma.usuario.create({
      data: { nombre, email, password: hash, rol },
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    });
    return NextResponse.json(usuario, { status: 201 });
  },
  { roles: ROLES_ADMIN }
);
