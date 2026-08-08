import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Bootstrap de un solo uso: solo funciona mientras no exista ningún usuario.
// Proyecto de un solo negocio (sin tenant), así que no hace falta más guarda.
export async function POST(req: Request) {
  const yaExiste = await prisma.usuario.findFirst();
  if (yaExiste) {
    return NextResponse.json({ error: "El sistema ya fue configurado" }, { status: 409 });
  }

  const { nombre, email, password } = await req.json();
  if (!nombre || !email || !password) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }
  if (String(password).length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
  }

  const hash = await bcrypt.hash(String(password), 12);
  const usuario = await prisma.usuario.create({
    data: { nombre, email, password: hash, rol: "dueña" },
  });

  return NextResponse.json({ id: usuario.id }, { status: 201 });
}
