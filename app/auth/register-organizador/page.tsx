"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

function RegisterOrganizerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Aquí se podría validar el código en el servidor
    // Por ahora solo mostramos que está presente
    if (!code) {
      setError("Código de invitación no proporcionado");
    }
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register-organizador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          nombre: nombre.trim(),
          codigo: code,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Error al registrar organizador");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/magic?redirectTo=/admin/sala");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Error de conexión");
      setLoading(false);
    }
  };

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-full max-w-md p-8 bg-[var(--card)] rounded-lg shadow-lg border border-[var(--border)]">
          <h1 className="text-2xl font-bold mb-6 text-[var(--foreground)]">
            Registro de Organizador
          </h1>
          <Alert className="bg-[var(--destructive)] text-[var(--destructive-foreground)] border-[var(--destructive)]">
            Código de invitación no proporcionado. Por favor, usa el enlace enviado a tu correo.
          </Alert>
          <div className="mt-6">
            <Link href="/">
              <Button className="w-full">Volver al inicio</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-full max-w-md p-8 bg-[var(--card)] rounded-lg shadow-lg border border-[var(--border)]">
          <div className="text-center">
            <div className="w-16 h-16 bg-[var(--success)] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
              ¡Registro exitoso!
            </h2>
            <p className="text-[var(--muted-foreground)] mb-4">
              Organizador registrado correctamente. Se te envió un email de
              confirmación.
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              Redirigiendo...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md p-8 bg-[var(--card)] rounded-lg shadow-lg border border-[var(--border)]">
        <h1 className="text-2xl font-bold mb-6 text-[var(--foreground)]">
          Crear Cuenta Organizador
        </h1>

        {error && (
          <Alert className="mb-5 items-start gap-x-3 border-red-400/35 bg-red-950/35 px-4 py-3 text-red-100 shadow-sm [&>svg]:mt-0.5 [&>svg]:size-5 [&>svg]:text-red-300">
            <AlertCircle aria-hidden="true" />
            <div className="space-y-1">
              <div className="font-semibold leading-5">No pudimos crear tu cuenta</div>
              <div className="text-sm leading-5 text-red-100/75">{error}</div>
            </div>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--foreground)] mb-1"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-[var(--input)] text-[var(--foreground)] border-[var(--input-border)] placeholder:text-[var(--input-placeholder)]"
            />
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Debe coincidir con el email de invitación
            </p>
          </div>

          <div>
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-[var(--foreground)] mb-1"
            >
              Nombre Completo
            </label>
            <Input
              id="nombre"
              type="text"
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-[var(--input)] text-[var(--foreground)] border-[var(--input-border)] placeholder:text-[var(--input-placeholder)]"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            className="w-full mt-6"
          >
            {loading ? "Registrando..." : "Crear Cuenta"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/auth/login"
              className="text-[var(--primary)] hover:underline font-medium"
            >
              Inicia sesión
            </Link>
          </p>
        </div>

        <div className="mt-4 p-3 bg-[var(--muted)] rounded text-xs text-[var(--muted-foreground)]">
          <p>
            <strong>Nota:</strong> Este enlace se activa solo con un código de
            invitación válido proporcionado por un administrador.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterOrganizerPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <RegisterOrganizerContent />
    </Suspense>
  );
}
