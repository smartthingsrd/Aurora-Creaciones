import { requireAdmin } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { GestionUsuarios } from "@/components/gestion-usuarios";

export default async function UsuariosPage() {
  await requireAdmin();
  const usuarios = await prisma.usuario.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Usuarios" description="Cuentas con acceso al sistema" />
      <GestionUsuarios usuariosIniciales={usuarios} />
    </div>
  );
}
