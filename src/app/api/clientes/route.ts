import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthRoute } from "@/lib/api-guard";

export const GET = withAuthRoute(async () => {
  const clientes = await prisma.cliente.findMany({ orderBy: { nombre: "asc" } });
  return NextResponse.json(clientes);
});

export const POST = withAuthRoute(async (req) => {
  const { nombre, cedula, telefono, email, direccion, notas } = await req.json();
  if (!nombre) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });

  const cliente = await prisma.cliente.create({
    data: { nombre, cedula: cedula || null, telefono: telefono || null, email: email || null, direccion: direccion || null, notas: notas || null },
  });
  return NextResponse.json(cliente, { status: 201 });
});
