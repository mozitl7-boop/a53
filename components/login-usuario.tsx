"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type UserShort = {
  id: string;
  nombre: string;
  email: string;
  tipo_usuario: string;
};

export function LoginUsuario({
  onSelect,
}: {
  onSelect: (user: UserShort) => void;
}) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("asistente");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [linkSent, setLinkSent] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`/api/auth/me`);
        const j = await res.json();
        if (!mounted) return;
        if (res.ok && j.user) onSelect(j.user as UserShort);
      } catch (e) {
      } finally {
        if (mounted) setCheckingSession(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [onSelect]);

  const submitLogin = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Error al iniciar sesión");
        return;
      }
      setLinkSent(true);
      setSuccess("Se ha enviado un enlace de confirmación a tu correo. Revisa tu bandeja de entrada.");
      setEmail("");
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async () => {
    setError(null);
    setSuccess(null);
    if (!nombre || !email) {
      setError("Completa nombre y correo");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, tipo_usuario: tipoUsuario }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Error al registrarse");
        return;
      }
      setLinkSent(true);
      setSuccess("Se ha enviado un enlace de confirmación a tu correo. Completa el registro usando el enlace.");
      setNombre("");
      setEmail("");
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-full min-w-0 mx-auto px-0 box-border">
      <div className="w-full rounded-3xl border border-slate-700/60 bg-slate-950/90 p-4 sm:p-5 shadow-inner shadow-cyan-500/5">
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="w-full rounded-full bg-cyan-500/10 px-4 py-3 text-center text-sm font-medium text-cyan-200">
            Acceso rápido con enlace mágico
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Button
              variant={tab === "login" ? "default" : "outline"}
              className="w-full"
              onClick={() => {
                setTab("login");
                setLinkSent(false);
                setSuccess(null);
                setError(null);
              }}
            >
              Iniciar Sesión
            </Button>
            <Button
              variant={tab === "register" ? "default" : "outline"}
              className="w-full"
              onClick={() => {
                setTab("register");
                setLinkSent(false);
                setSuccess(null);
                setError(null);
              }}
            >
              Registrarse
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-5 w-full mt-4">
          {tab === "login" && (
            <div className="flex flex-col gap-4 w-full">
              {linkSent ? (
                <div className="w-full rounded-3xl border border-blue-400/20 bg-slate-950/80 p-5 text-slate-100 shadow-lg shadow-blue-500/10">
                  <p className="text-sm">✓ Enviado. Revisa tu correo para continuar.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex flex-col gap-2 w-full">
                    <Label htmlFor="login-email">Correo</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@universidad.edu"
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground">Te enviaremos un acceso directo a tu bandeja de entrada.</p>
                  </div>

                  <Button
                    onClick={submitLogin}
                    disabled={!email || loading}
                    className="w-full bg-linear-to-r from-[#f081a4] to-[#c41e3a] text-white font-semibold rounded-xl py-2.5 text-base"
                  >
                    {loading ? "Enviando..." : "Enviar enlace de acceso"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {tab === "register" && (
            <div className="flex flex-col gap-4 w-full">
              {linkSent ? (
                <div className="w-full rounded-3xl border border-emerald-400/20 bg-slate-950/80 p-5 text-slate-100 shadow-lg shadow-emerald-500/10">
                  <p className="text-sm">✓ Enviado. Revisa tu correo para completar el registro.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex flex-col gap-2 w-full">
                    <Label htmlFor="register-name">Nombre</Label>
                    <Input
                      id="register-name"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Juan Pérez"
                      className="w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-2 w-full">
                    <Label htmlFor="register-email">Correo</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@universidad.com"
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground">Te enviaremos un acceso directo a tu bandeja de entrada.</p>
                  </div>

                  <div className="flex flex-col gap-2 w-full">
                    <Label>Tipo</Label>
                    <Select value={tipoUsuario} onValueChange={setTipoUsuario}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Asistente u Organizador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asistente">Asistente</SelectItem>
                        <SelectItem value="organizador">Organizador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={submitRegister}
                    disabled={!nombre || !email || loading}
                    className="w-full bg-linear-to-r from-[#f081a4] to-[#c41e3a] text-white font-semibold rounded-xl py-2.5 text-base"
                  >
                    {loading ? "Enviando..." : "Enviar enlace de acceso"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {checkingSession && <p className="text-sm text-muted-foreground">Comprobando sesión...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-foreground/80">{success}</p>}
        </div>
      </div>
    </div>
  );
}
