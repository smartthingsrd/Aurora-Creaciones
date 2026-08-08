import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthRoute } from "@/lib/api-guard";
import { ROLES_ADMIN } from "@/lib/permisos";
import { calcularCostoProducto } from "@/lib/costeo";
import { Prisma } from "@/generated/prisma/client";

export const GET = withAuthRoute(async (_req, _ctx, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const producto = await prisma.producto.findUnique({
    where: { id },
    include: {
      categoria: true,
      extras: true,
      receta: {
        include: {
          items: {
            orderBy: { orden: "asc" },
            include: { recurso: true, productoComponente: { select: { id: true, nombre: true, tipoCosteo: true } } },
          },
        },
      },
    },
  });
  if (!producto) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const costo = await calcularCostoProducto(id);
  return NextResponse.json({ producto, costo });
});

export const PATCH = withAuthRoute(async (req, ctx, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const data = await req.json();
  const { nombre, descripcion, sku, categoriaId, precio, costo, margenObjetivo, activo } = data;

  const esAdmin = ROLES_ADMIN.includes(ctx.rol);
  const updateData: Record<string, unknown> = {};
  if (nombre !== undefined) updateData.nombre = nombre;
  if (descripcion !== undefined) updateData.descripcion = descripcion || null;
  if (sku !== undefined) updateData.sku = sku || null;
  if (categoriaId !== undefined) updateData.categoriaId = categoriaId || null;
  if (activo !== undefined) updateData.activo = activo;
  if (precio !== undefined) updateData.precio = new Prisma.Decimal(precio);

  // Costo manual y margen objetivo solo los toca admin/dueña.
  if (esAdmin) {
    if (costo !== undefined) updateData.costo = costo != null ? new Prisma.Decimal(costo) : null;
    if (margenObjetivo !== undefined) {
      updateData.margenObjetivo = margenObjetivo != null ? new Prisma.Decimal(margenObjetivo) : null;
    }
  }

  const producto = await prisma.producto.update({ where: { id }, data: updateData });
  return NextResponse.json(producto);
});

export const DELETE = withAuthRoute(
  async (_req, _ctx, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const enUso = await prisma.recetaItem.findFirst({ where: { productoComponenteId: id } });
    if (enUso) {
      return NextResponse.json(
        { error: "Este producto es componente de otro combo — desactívalo en vez de borrarlo" },
        { status: 409 }
      );
    }
    await prisma.producto.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  },
  { roles: ROLES_ADMIN }
);
