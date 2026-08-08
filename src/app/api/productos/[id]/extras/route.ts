import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthRoute } from "@/lib/api-guard";
import { ROLES_ADMIN } from "@/lib/permisos";
import { Prisma } from "@/generated/prisma/client";

export const POST = withAuthRoute(
  async (req, _ctx, { params }: { params: Promise<{ id: string }> }) => {
    const { id: productoId } = await params;
    const data = await req.json();
    const { nombre, tipo, montoPrecio, montoCosto } = data;

    if (!nombre || !tipo) {
      return NextResponse.json({ error: "Nombre y tipo son requeridos" }, { status: 400 });
    }
    if (!["precio", "costo", "ambos"].includes(tipo)) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    const extra = await prisma.productoExtra.create({
      data: {
        productoId,
        nombre,
        tipo,
        montoPrecio: new Prisma.Decimal(montoPrecio || 0),
        montoCosto: new Prisma.Decimal(montoCosto || 0),
      },
    });
    return NextResponse.json(extra, { status: 201 });
  },
  { roles: ROLES_ADMIN }
);
