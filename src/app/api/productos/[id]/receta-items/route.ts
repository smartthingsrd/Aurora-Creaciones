import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthRoute } from "@/lib/api-guard";
import { ROLES_ADMIN } from "@/lib/permisos";
import { validarSinCiclo, validarXorRecursoProducto } from "@/lib/recetas";
import { Prisma } from "@/generated/prisma/client";

export const POST = withAuthRoute(
  async (req, _ctx, { params }: { params: Promise<{ id: string }> }) => {
    const { id: productoId } = await params;
    const data = await req.json();
    const { recursoId, productoComponenteId, cantidad, unidad, mermaPct } = data;

    try {
      validarXorRecursoProducto(recursoId, productoComponenteId);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
    if (!cantidad || !unidad) {
      return NextResponse.json({ error: "Cantidad y unidad son requeridas" }, { status: 400 });
    }

    if (productoComponenteId) {
      try {
        await validarSinCiclo(productoId, productoComponenteId);
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 400 });
      }
    }

    const receta = await prisma.receta.upsert({
      where: { productoId },
      update: {},
      create: { productoId },
    });

    const ultimoOrden = await prisma.recetaItem.count({ where: { recetaId: receta.id } });

    const item = await prisma.recetaItem.create({
      data: {
        recetaId: receta.id,
        recursoId: recursoId || null,
        productoComponenteId: productoComponenteId || null,
        cantidad: new Prisma.Decimal(cantidad),
        unidad,
        mermaPct: mermaPct != null ? new Prisma.Decimal(mermaPct) : new Prisma.Decimal(0),
        orden: ultimoOrden,
      },
    });
    return NextResponse.json(item, { status: 201 });
  },
  { roles: ROLES_ADMIN }
);
