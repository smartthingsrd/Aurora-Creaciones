import { requireAuth } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { FacturaNuevaForm } from "@/components/factura-nueva-form";

export default async function FacturaNuevaPage() {
  await requireAuth();
  const [productos, clientes] = await Promise.all([
    prisma.producto.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      include: { extras: { where: { activo: true }, orderBy: { nombre: "asc" } } },
    }),
    prisma.cliente.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <PageHeader title="Nueva factura" />
      <FacturaNuevaForm
        productos={productos.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          precio: p.precio.toString(),
          extras: p.extras.map((ex) => ({
            id: ex.id,
            nombre: ex.nombre,
            tipo: ex.tipo,
            montoPrecio: ex.montoPrecio.toString(),
            montoCosto: ex.montoCosto.toString(),
          })),
        }))}
        clientes={clientes.map((c) => ({ id: c.id, nombre: c.nombre }))}
      />
    </div>
  );
}
