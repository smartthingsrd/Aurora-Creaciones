import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthRoute } from "@/lib/api-guard";
import { ROLES_ADMIN } from "@/lib/permisos";

export const PATCH = withAuthRoute(
  async (req, _ctx, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const { activo, rol } = await req.json();
    const updateData: Record<string, unknown> = {};
    if (activo !== undefined) updateData.activo = activo;
    if (rol !== undefined) updateData.rol = rol;
    const usuario = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    });
    return NextResponse.json(usuario);
  },
  { roles: ROLES_ADMIN }
);
