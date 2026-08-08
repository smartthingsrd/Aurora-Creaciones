import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthRoute } from "@/lib/api-guard";
import { ROLES_ADMIN } from "@/lib/permisos";
import { Prisma } from "@/generated/prisma/client";

export const GET = withAuthRoute(async () => {
  const recursos = await prisma.recurso.findMany({ orderBy: { nombre: "asc" } });
  return NextResponse.json(recursos);
});

export const POST = withAuthRoute(
  async (req) => {
    const data = await req.json();
    const { nombre, sku, tipo, descripcion, unidadMedida, costoCompra, cantidadCompra } = data;

    if (!nombre || !tipo || !unidadMedida || costoCompra == null || cantidadCompra == null) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    const cCompra = new Prisma.Decimal(costoCompra);
    const cantCompra = new Prisma.Decimal(cantidadCompra);
    if (cantCompra.lte(0)) {
      return NextResponse.json({ error: "La cantidad adquirida debe ser mayor a 0" }, { status: 400 });
    }

    const recurso = await prisma.recurso.create({
      data: {
        nombre,
        sku: sku || null,
        tipo,
        descripcion: descripcion || null,
        unidadMedida,
        costoCompra: cCompra,
        cantidadCompra: cantCompra,
        costoUnitario: cCompra.div(cantCompra),
      },
    });
    return NextResponse.json(recurso, { status: 201 });
  },
  { roles: ROLES_ADMIN }
);
