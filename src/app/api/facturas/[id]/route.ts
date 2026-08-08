import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthRoute } from "@/lib/api-guard";

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
  const factura = await prisma.factura.update({ where: { id }, data: { estado } });
  return NextResponse.json(factura);
});
