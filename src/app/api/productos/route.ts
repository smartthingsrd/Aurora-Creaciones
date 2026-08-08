import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthRoute } from "@/lib/api-guard";
import { ROLES_ADMIN } from "@/lib/permisos";
import { Prisma } from "@/generated/prisma/client";

export const GET = withAuthRoute(async () => {
  const productos = await prisma.producto.findMany({
    orderBy: { nombre: "asc" },
    include: { categoria: true },
  });
  return NextResponse.json(productos);
});

// Cualquier rol puede crear un producto simple (ej. facturación agregando un
// artículo comprado para revender); solo admin/dueña pueden crear compuestos
// (implican costeo/receta) — se valida dentro, no con el guard de rol general.
export const POST = withAuthRoute(async (req, ctx) => {
  const data = await req.json();
  const { nombre, descripcion, sku, categoriaId, tipoCosteo, costo, precio, margenObjetivo, stock, stockMinimo } = data;

  if (!nombre || !tipoCosteo || precio == null) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  if (tipoCosteo === "compuesto" && !ROLES_ADMIN.includes(ctx.rol)) {
    return NextResponse.json({ error: "Sin acceso para crear productos compuestos" }, { status: 403 });
  }

  const producto = await prisma.producto.create({
    data: {
      nombre,
      descripcion: descripcion || null,
      sku: sku || null,
      categoriaId: categoriaId || null,
      tipoCosteo,
      costo: tipoCosteo === "simple" && costo != null ? new Prisma.Decimal(costo) : null,
      precio: new Prisma.Decimal(precio),
      margenObjetivo: margenObjetivo != null ? new Prisma.Decimal(margenObjetivo) : null,
      // Stock solo se rastrea para productos simples — un compuesto se fabrica
      // sobre pedido y su "stock" real es el de los recursos de su receta.
      stock: tipoCosteo === "simple" && stock != null && stock !== "" ? new Prisma.Decimal(stock) : null,
      stockMinimo: tipoCosteo === "simple" && stockMinimo != null && stockMinimo !== "" ? new Prisma.Decimal(stockMinimo) : null,
      ...(tipoCosteo === "compuesto" ? { receta: { create: {} } } : {}),
    },
  });
  return NextResponse.json(producto, { status: 201 });
});
