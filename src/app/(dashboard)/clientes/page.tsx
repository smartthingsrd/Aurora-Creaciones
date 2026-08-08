import { requireAuth } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ClientesLista } from "@/components/clientes-lista";

export default async function ClientesPage() {
  await requireAuth();
  const clientes = await prisma.cliente.findMany({ orderBy: { nombre: "asc" } });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Clientes" description="Directorio de clientes" />
      <ClientesLista clientesIniciales={clientes} />
    </div>
  );
}
