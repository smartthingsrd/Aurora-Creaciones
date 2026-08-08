import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthRoute } from "@/lib/api-guard";
import { ROLES_ADMIN } from "@/lib/permisos";
import { Prisma } from "@/generated/prisma/client";

export const PATCH = withAuthRoute(
  async (req, _ctx, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const data = await req.json();
    const { nombre, sku, tipo, descripcion, unidadMedida, costoCompra, cantidadCompra, activo, stock, stockMinimo } = data;

    const updateData: Record<string, unknown> = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (sku !== undefined) updateData.sku = sku || null;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (descripcion !== undefined) updateData.descripcion = descripcion || null;
    if (unidadMedida !== undefined) updateData.unidadMedida = unidadMedida;
    if (activo !== undefined) updateData.activo = activo;
    if (stock !== undefined) updateData.stock = stock != null && stock !== "" ? new Prisma.Decimal(stock) : null;
    if (stockMinimo !== undefined) {
      updateData.stockMinimo = stockMinimo != null && stockMinimo !== "" ? new Prisma.Decimal(stockMinimo) : null;
    }

    if (costoCompra != null && cantidadCompra != null) {
      const cCompra = new Prisma.Decimal(costoCompra);
      const cantCompra = new Prisma.Decimal(cantidadCompra);
      if (cantCompra.lte(0)) {
        return NextResponse.json({ error: "La cantidad adquirida debe ser mayor a 0" }, { status: 400 });
      }
      updateData.costoCompra = cCompra;
      updateData.cantidadCompra = cantCompra;
      updateData.costoUnitario = cCompra.div(cantCompra);
    }

    const recurso = await prisma.recurso.update({ where: { id }, data: updateData });
    return NextResponse.json(recurso);
  },
  { roles: ROLES_ADMIN }
);

export const DELETE = withAuthRoute(
  async (_req, _ctx, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const enUso = await prisma.recetaItem.findFirst({ where: { recursoId: id } });
    if (enUso) {
      return NextResponse.json(
        { error: "Este recurso está en uso en al menos una receta — desactívalo en vez de borrarlo" },
        { status: 409 }
      );
    }
    await prisma.recurso.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  },
  { roles: ROLES_ADMIN }
);
