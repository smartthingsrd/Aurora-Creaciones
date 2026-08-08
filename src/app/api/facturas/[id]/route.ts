import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthRoute } from "@/lib/api-guard";
import { revertirStockPorAnulacion } from "@/lib/inventario";

export const GET = withAuthRoute(async (_req, _ctx, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const factura = await prisma.factura.findUnique({
    where: { id },
    include: { cliente: true, usuario: true, items: { include: { producto: true } }, pagos: true },
  });
  if (!factura) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(factura);
});

export const PATCH = withAuthRoute(async (req, _ctx, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { estado } = await req.json();
  if (!estado) return NextResponse.json({ error: "Falta estado" }, { status: 400 });

  const factura = await prisma.$transaction(async (tx) => {
    const actual = await tx.factura.findUniqueOrThrow({ where: { id } });
    const actualizada = await tx.factura.update({ where: { id }, data: { estado } });

    // Solo revertir stock en la transición pendiente/pagada → anulada, una
    // sola vez (revertirStockPorAnulacion ya es idempotente si se repite).
    if (actual.estado !== "anulada" && estado === "anulada") {
      await revertirStockPorAnulacion(tx, id);
    }

    return actualizada;
  });

  return NextResponse.json(factura);
});
