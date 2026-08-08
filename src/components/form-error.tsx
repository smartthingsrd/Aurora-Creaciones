export function FormError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="text-sm text-alerta bg-alerta-soft border border-alerta/25 rounded-lg px-3 py-2">
      {children}
    </p>
  );
}
