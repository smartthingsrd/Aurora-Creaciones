"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, Sparkles } from "lucide-react";

export default function SetupPage() {
  const [form, setForm] = useState({ nombre: "", email: "", password: "", confirmar: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: form.nombre, email: form.email, password: form.password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Error al crear el usuario");
      setLoading(false);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">¡Cuenta creada!</h1>
          <p className="text-muted-foreground mb-6">Tu cuenta de dueña fue creada exitosamente.</p>
          <a href="/login" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors">
            Ir al Login →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={26} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Configuración inicial</h1>
          <p className="text-muted-foreground text-sm mt-1">Crea la cuenta de dueña de Aurora Creaciones</p>
        </div>

        <form onSubmit={handleSubmit} className="border border-border rounded-xl p-6 bg-card space-y-4 shadow-sm">
          <div className="space-y-1.5">
            <Label>Nombre completo</Label>
            <Input
              value={form.nombre}
              onChange={e => setForm(v => ({ ...v, nombre: e.target.value }))}
              placeholder="Pamela"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Correo electrónico</Label>
            <Input
              type="email"
              value={form.email}
              onChange={e => setForm(v => ({ ...v, email: e.target.value }))}
              placeholder="correo@ejemplo.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Contraseña</Label>
            <Input
              type="password"
              value={form.password}
              onChange={e => setForm(v => ({ ...v, password: e.target.value }))}
              placeholder="Mínimo 8 caracteres"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Confirmar contraseña</Label>
            <Input
              type="password"
              value={form.confirmar}
              onChange={e => setForm(v => ({ ...v, confirmar: e.target.value }))}
              placeholder="Repite la contraseña"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? <><Loader2 size={15} className="animate-spin mr-2" />Creando cuenta...</>
              : "Crear cuenta y entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
