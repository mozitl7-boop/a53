"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Trash2, RefreshCw, Check } from "lucide-react";

interface Invitacion {
  id: string;
  codigo: string;
  email: string;
  usado: boolean;
  fecha_creacion: string;
  fecha_expiracion: string;
  fecha_uso: string | null;
  creado_por: string;
}

export default function AdminInvitacionesPage() {
  const router = useRouter();
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [email, setEmail] = useState("");
  const [dias, setDias] = useState("7");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    cargarInvitaciones();
  }, []);

  const cargarInvitaciones = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/invitaciones");
      
      if (res.status === 403) {
        setError("Acceso denegado. Solo el administrador puede acceder.");
        return;
      }
      
      if (!res.ok) {
        throw new Error("Error al cargar invitaciones");
      }
      
      const data = await res.json();
      setInvitaciones(data.invitaciones || []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Error al cargar invitaciones");
    } finally {
      setLoading(false);
    }
  };

  const generarInvitacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Por favor ingresa un correo");
      return;
    }

    try {
      setGenerando(true);
      const res = await fetch("/api/admin/invitaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          dias_validez: parseInt(dias) || 7,
        }),
      });

      if (res.status === 403) {
        setError("Acceso denegado. Solo el administrador puede generar invitaciones.");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al generar invitación");
      }

      const data = await res.json();
      setSuccess(`Código generado: ${data.invitacion.codigo}`);
      setEmail("");
      setDias("7");
      await cargarInvitaciones();
    } catch (err: any) {
      setError(err.message || "Error al generar invitación");
    } finally {
      setGenerando(false);
    }
  };

  const copiarLink = (codigo: string) => {
    const link = `${window.location.origin}/auth/register-organizador?code=${codigo}`;
    navigator.clipboard.writeText(link);
    setCopiedId(codigo);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const esExpirado = (fechaExp: string) => {
    return new Date(fechaExp) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Invitaciones para Organizadores
          </h1>
          <p className="text-slate-400">
            Gestiona códigos de invitación para nuevos organizadores
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-500 bg-red-500/10">
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="mb-6 border-green-500 bg-green-500/10">
            <Check className="w-4 h-4 text-green-500" />
            <AlertDescription className="text-green-200">{success}</AlertDescription>
          </Alert>
        )}

        {/* Formulario Generador */}
        <Card className="mb-8 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Generar Nueva Invitación</CardTitle>
            <CardDescription>Crea un código de invitación único para un nuevo organizador</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={generarInvitacion} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">
                    Correo del Organizador
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="organizador@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={generando}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dias" className="text-slate-200">
                    Días de Validez
                  </Label>
                  <Input
                    id="dias"
                    type="number"
                    min="1"
                    max="90"
                    value={dias}
                    onChange={(e) => setDias(e.target.value)}
                    disabled={generando}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={generando || !email.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {generando ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  "Generar Código"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Invitaciones */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              Invitaciones Activas
              <Button
                variant="outline"
                size="sm"
                onClick={cargarInvitaciones}
                className="border-slate-600 text-slate-200 hover:bg-slate-700"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              Total: {invitaciones.length} | Usadas: {invitaciones.filter((i) => i.usado).length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invitaciones.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No hay invitaciones generadas aún
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {invitaciones.map((inv) => {
                  const expirado = esExpirado(inv.fecha_expiracion);
                  return (
                    <div
                      key={inv.id}
                      className="p-4 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="px-2 py-1 bg-slate-600 text-blue-300 rounded font-mono text-sm">
                              {inv.codigo}
                            </code>
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                inv.usado
                                  ? "bg-gray-600 text-gray-200"
                                  : expirado
                                  ? "bg-red-600 text-red-100"
                                  : "bg-green-600 text-green-100"
                              }`}
                            >
                              {inv.usado ? "USADO" : expirado ? "EXPIRADO" : "ACTIVO"}
                            </span>
                          </div>
                          <p className="text-slate-300 text-sm">
                            <span className="text-slate-400">Para:</span> {inv.email}
                          </p>
                          <p className="text-slate-400 text-xs">
                            Creado: {formatDate(inv.fecha_creacion)}
                          </p>
                          <p className="text-slate-400 text-xs">
                            Expira: {formatDate(inv.fecha_expiracion)}
                          </p>
                          {inv.fecha_uso && (
                            <p className="text-green-400 text-xs">
                              Usado: {formatDate(inv.fecha_uso)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {!inv.usado && !expirado && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copiarLink(inv.codigo)}
                              className="text-slate-300 hover:text-white hover:bg-slate-600"
                              title="Copiar link de registro"
                            >
                              {copiedId === inv.codigo ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
