import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { calcularCostoProducto } from "@/lib/costeo";
import { PageHeader } from "@/components/page-header";
import { ProductoDetalle } from "@/components/producto-detalle";

export default async function ProductoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAuth();

  const producto = await prisma.producto.findUnique({
    where: { id },
    include: {
      categoria: true,
      extras: { orderBy: { nombre: "asc" } },
      receta: {
        include: {
          items: {
            orderBy: { orden: "asc" },
            include: {
              recurso: true,
              productoComponente: { select: { id: true, nombre: true, tipoCosteo: true } },
            },
          },
        },
      },
    },
  });
  if (!producto) notFound();

  const costo = await calcularCostoProducto(id);

  // Recursos y productos disponibles para agregar como componente.
  const [recursos, productosDisponibles] = await Promise.all([
    prisma.recurso.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
    prisma.producto.findMany({
      where: { activo: true, id: { not: id } },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, tipoCosteo: true },
    }),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <PageHeader title={producto.nombre} description={producto.descripcion ?? undefined} />
      <ProductoDetalle
        rol={session.user.rol}
        producto={{
          id: producto.id,
          nombre: producto.nombre,
          sku: producto.sku,
          tipoCosteo: producto.tipoCosteo,
          costo: producto.costo?.toString() ?? null,
          precio: producto.precio.toString(),
          margenObjetivo: producto.margenObjetivo?.toString() ?? null,
          stock: producto.stock?.toString() ?? null,
          stockMinimo: producto.stockMinimo?.toString() ?? null,
          activo: producto.activo,
          categoriaNombre: producto.categoria?.nombre ?? null,
        }}
        costo={{
          materiales: costo.materiales.toString(),
          manoObra: costo.manoObra.toString(),
          otros: costo.otros.toString(),
          total: costo.total.toString(),
        }}
        items={
          producto.receta?.items.map((item) => ({
            id: item.id,
            cantidad: item.cantidad.toString(),
            unidad: item.unidad,
            mermaPct: item.mermaPct.toString(),
            recurso: item.recurso
              ? { id: item.recurso.id, nombre: item.recurso.nombre, tipo: item.recurso.tipo, costoUnitario: item.recurso.costoUnitario.toString() }
              : null,
            productoComponente: item.productoComponente
              ? { id: item.productoComponente.id, nombre: item.productoComponente.nombre }
              : null,
          })) ?? []
        }
        extras={producto.extras.map((ex) => ({
          id: ex.id,
          nombre: ex.nombre,
          tipo: ex.tipo,
          montoPrecio: ex.montoPrecio.toString(),
          montoCosto: ex.montoCosto.toString(),
          activo: ex.activo,
        }))}
        recursosDisponibles={recursos.map((r) => ({ id: r.id, nombre: r.nombre, tipo: r.tipo, unidadMedida: r.unidadMedida }))}
        productosDisponibles={productosDisponibles}
      />
    </div>
  );
}
