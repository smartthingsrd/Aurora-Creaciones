import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthRoute } from "@/lib/api-guard";

export const PATCH = withAuthRoute(async (req, _ctx, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const data = await req.json();
  const { nombre, cedula, telefono, email, direccion, notas } = data;

  const updateData: Record<string, unknown> = {};
  if (nombre !== undefined) updateData.nombre = nombre;
  if (cedula !== undefined) updateData.cedula = cedula || null;
  if (telefono !== undefined) updateData.telefono = telefono || null;
  if (email !== undefined) updateData.email = email || null;
  if (direccion !== undefined) updateData.direccion = direccion || null;
  if (notas !== undefined) updateData.notas = notas || null;

  const cliente = await prisma.cliente.update({ where: { id }, data: updateData });
  return NextResponse.json(cliente);
});
