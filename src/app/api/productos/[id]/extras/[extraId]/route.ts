import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthRoute } from "@/lib/api-guard";
import { ROLES_ADMIN } from "@/lib/permisos";
import { Prisma } from "@/generated/prisma/client";

export const PATCH = withAuthRoute(
  async (req, _ctx, { params }: { params: Promise<{ id: string; extraId: string }> }) => {
    const { extraId } = await params;
    const data = await req.json();
    const { nombre, tipo, montoPrecio, montoCosto, activo } = data;

    if (tipo !== undefined && !["precio", "costo", "ambos"].includes(tipo)) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (montoPrecio !== undefined) updateData.montoPrecio = new Prisma.Decimal(montoPrecio || 0);
    if (montoCosto !== undefined) updateData.montoCosto = new Prisma.Decimal(montoCosto || 0);
    if (activo !== undefined) updateData.activo = activo;

    const extra = await prisma.productoExtra.update({ where: { id: extraId }, data: updateData });
    return NextResponse.json(extra);
  },
  { roles: ROLES_ADMIN }
);

export const DELETE = withAuthRoute(
  async (_req, _ctx, { params }: { params: Promise<{ id: string; extraId: string }> }) => {
    const { extraId } = await params;
    await prisma.productoExtra.delete({ where: { id: extraId } });
    return NextResponse.json({ ok: true });
  },
  { roles: ROLES_ADMIN }
);
