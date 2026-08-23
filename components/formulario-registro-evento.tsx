"use client";

import type React from "react";
import { useValidatedForm } from "./form-components";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { User, Mail } from "lucide-react";

interface RegistroEventoProps {
  nombre: string;
  email: string;
  titulo: string;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function FormularioRegistroEvento({
  nombre,
  email,
  titulo,
  isSubmitting,
  onSubmit,
  onCancel,
}: RegistroEventoProps) {
  const form = useValidatedForm<LoginInput>(loginSchema);

  return (
    <div className="mt-4 p-6 rounded-2xl shadow-xl bg-slate-900/95 border border-white/10 backdrop-blur-xl">
      <h3 className="text-xl font-bold mb-2 text-orange-400">Regístrate al Evento</h3>
      <p className="mb-4 text-slate-300 text-sm">
        Completa tus datos para registrarte a <span className="font-semibold">"{titulo}"</span>
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Nombre - ReadOnly */}
        <div className="space-y-2">
          <Label htmlFor="registro-nombre" className="text-slate-300 text-sm font-medium flex items-center gap-2">
            <User className="w-4 h-4 text-orange-400" />
            Nombre Completo
          </Label>
          <Input
            id="registro-nombre"
            value={nombre}
            disabled
            placeholder="Tu nombre"
            className="bg-slate-800/50 border-white/10 text-white placeholder:text-[var(--input-placeholder)] cursor-not-allowed"
          />
          <p className="text-xs text-slate-400">Datos de tu perfil (no editables)</p>
        </div>

        {/* Email - ReadOnly */}
        <div className="space-y-2">
          <Label htmlFor="registro-email" className="text-slate-300 text-sm font-medium flex items-center gap-2">
            <Mail className="w-4 h-4 text-orange-400" />
            Correo Electrónico
          </Label>
          <Input
            id="registro-email"
            type="email"
            value={email}
            disabled
            placeholder="tu@email.com"
            className="bg-slate-800/50 border-white/10 text-white placeholder:text-[var(--input-placeholder)] cursor-not-allowed"
          />
          <p className="text-xs text-slate-400">Datos de tu perfil (no editables)</p>
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <AlertCircle className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
          <p className="text-xs text-blue-300">
            Se te asignará automáticamente el siguiente asiento disponible en orden de llegada.
          </p>
        </div>

        {/* Botones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Registrando...
              </span>
            ) : (
              "Confirmar Registro"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
