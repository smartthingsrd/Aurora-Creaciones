import { requireAdmin } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { contarUsoRecursosBatch } from "@/lib/costeo";
import { PageHeader } from "@/components/page-header";
import { RecursosLista } from "@/components/recursos-lista";

export default async function RecursosPage() {
  await requireAdmin();
  const [recursos, usoRecursos] = await Promise.all([
    prisma.recurso.findMany({ orderBy: { nombre: "asc" } }),
    contarUsoRecursosBatch(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Recursos de producción"
        description="Materiales, mano de obra y otros costos usados en las recetas"
      />
      <RecursosLista
        recursosIniciales={recursos.map((r) => ({
          ...r,
          costoCompra: r.costoCompra.toString(),
          cantidadCompra: r.cantidadCompra.toString(),
          costoUnitario: r.costoUnitario.toString(),
          stock: r.stock?.toString() ?? null,
          stockMinimo: r.stockMinimo?.toString() ?? null,
          usadoEnProductos: usoRecursos.get(r.id) ?? 0,
        }))}
      />
    </div>
  );
}
