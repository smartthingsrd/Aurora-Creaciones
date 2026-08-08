import { requireAuth } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ProductoNuevoForm } from "@/components/producto-nuevo-form";

export default async function ProductoNuevoPage() {
  const session = await requireAuth();
  const categorias = await prisma.categoria.findMany({ orderBy: { nombre: "asc" } });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <PageHeader title="Nuevo producto" description="Crea un producto simple o compuesto (con receta)" />
      <ProductoNuevoForm categorias={categorias} rol={session.user.rol} />
    </div>
  );
}
