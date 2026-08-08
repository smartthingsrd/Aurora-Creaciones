import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthRoute } from "@/lib/api-guard";
import { Prisma } from "@/generated/prisma/client";

export const GET = withAuthRoute(async () => {
  const cotizaciones = await prisma.cotizacion.findMany({
    orderBy: { creadoEn: "desc" },
    include: { cliente: true },
  });
  return NextResponse.json(cotizaciones);
});

type ItemInput = { productoId?: string; descripcion: string; cantidad: number; precio: number };

export const POST = withAuthRoute(async (req, ctx) => {
  const { clienteId, notas, items } = (await req.json()) as { clienteId?: string; notas?: string; items: ItemInput[] };
  if (!items || items.length === 0) {
    return NextResponse.json({ error: "La cotización necesita al menos un artículo" }, { status: 400 });
  }

  const count = await prisma.cotizacion.count();
  const numero = `COT-${String(count + 1).padStart(5, "0")}`;

  const itemsData = items.map((item) => ({
    productoId: item.productoId ?? null,
    descripcion: item.descripcion,
    cantidad: item.cantidad,
    precio: new Prisma.Decimal(item.precio),
    total: new Prisma.Decimal(item.precio).mul(item.cantidad),
  }));
  const subtotal = itemsData.reduce((acc, i) => acc.plus(i.total), new Prisma.Decimal(0));

  const cotizacion = await prisma.cotizacion.create({
    data: {
      numero,
      clienteId: clienteId || null,
      usuarioId: ctx.userId,
      notas: notas || null,
      subtotal,
      total: subtotal,
      items: { create: itemsData },
    },
    include: { items: true },
  });

  return NextResponse.json(cotizacion, { status: 201 });
});
