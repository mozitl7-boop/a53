import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function obtenerNombreSala(auditorio?: string | null) {
  const nombre = String(auditorio ?? "").trim();
  const normalizado = nombre.toLocaleLowerCase("es-MX");

  if (normalizado === "a" || normalizado === "auditorio a" || normalizado === "sala a") {
    return "Sala 1";
  }
  if (normalizado === "b" || normalizado === "auditorio b" || normalizado === "sala b") {
    return "Sala 2";
  }
  return nombre || "Sala no especificada";
}
