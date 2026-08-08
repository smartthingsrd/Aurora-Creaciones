import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthRoute } from "@/lib/api-guard";
import { ROLES_ADMIN } from "@/lib/permisos";
import { Prisma } from "@/generated/prisma/client";

export const PATCH = withAuthRoute(
  async (req, _ctx, { params }: { params: Promise<{ id: string; itemId: string }> }) => {
    const { itemId } = await params;
    const data = await req.json();
    const { cantidad, unidad, mermaPct } = data;

    const updateData: Record<string, unknown> = {};
    if (cantidad !== undefined) updateData.cantidad = new Prisma.Decimal(cantidad);
    if (unidad !== undefined) updateData.unidad = unidad;
    if (mermaPct !== undefined) updateData.mermaPct = new Prisma.Decimal(mermaPct);

    const item = await prisma.recetaItem.update({ where: { id: itemId }, data: updateData });
    return NextResponse.json(item);
  },
  { roles: ROLES_ADMIN }
);

export const DELETE = withAuthRoute(
  async (_req, _ctx, { params }: { params: Promise<{ id: string; itemId: string }> }) => {
    const { itemId } = await params;
    await prisma.recetaItem.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
  },
  { roles: ROLES_ADMIN }
);
