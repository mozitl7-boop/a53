"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
    <div className="w-full min-w-0 rounded-[1.75rem] border border-[#1e344f] bg-[#0b131f] p-5 shadow-inner shadow-black/20 sm:p-6">
      <div className="w-full">
        <div className="grid w-full grid-cols-2 gap-2 border-b border-slate-700/70 pb-3">
            <Button
              variant={tab === "login" ? "default" : "outline"}
              className={`w-full rounded-xl border font-semibold ${tab === "login" ? "border-[#f43f5e] bg-gradient-to-r from-[#e11d48] via-[#f43f5e] to-[#fb7185] text-white shadow-lg shadow-rose-950/30" : "border-[#1e344f] bg-slate-900/80 text-slate-300 hover:border-[#f43f5e] hover:text-white"}`}
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
              className={`w-full rounded-xl border font-semibold ${tab === "register" ? "border-[#f43f5e] bg-gradient-to-r from-[#e11d48] via-[#f43f5e] to-[#fb7185] text-white shadow-lg shadow-rose-950/30" : "border-[#1e344f] bg-slate-900/80 text-slate-300 hover:border-[#f43f5e] hover:text-white"}`}
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

        <div className="mt-6 flex w-full flex-col gap-5">
          {tab === "login" && (
            <div className="flex flex-col gap-4 w-full">
              {linkSent ? (
                  <div className="w-full rounded-2xl border border-[#1e344f] bg-slate-900/80 p-5 text-slate-100 shadow-lg shadow-rose-950/20">
                  <p className="text-sm">Enviado. Revisa tu correo para continuar.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex flex-col gap-2 w-full">
                    <Label htmlFor="login-email">Correo electrónico</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@universidad.edu"
                      className="w-full border-[#1e324d] bg-[#111c2d] text-white placeholder:text-slate-500 focus-visible:border-[#f43f5e] focus-visible:ring-[#f43f5e]/30"
                    />
                    <p className="text-sm text-slate-300">Te enviaremos un acceso directo a tu bandeja de entrada.</p>
                  </div>

                  <Button
                    onClick={submitLogin}
                    disabled={!email || loading}
                    className="w-full rounded-xl border border-[#f43f5e] bg-gradient-to-r from-[#e11d48] via-[#f43f5e] to-[#fb7185] py-2.5 text-base font-semibold text-white shadow-lg shadow-rose-950/30 hover:from-[#be123c] hover:via-[#e11d48] hover:to-[#f43f5e]"
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
                  <div className="w-full rounded-2xl border border-[#1e344f] bg-slate-900/80 p-5 text-slate-100 shadow-lg shadow-rose-950/20">
                  <p className="text-sm">Enviado. Revisa tu correo para completar el registro.</p>
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
                      className="w-full border-[#1e324d] bg-[#111c2d] text-white placeholder:text-slate-500 focus-visible:border-[#f43f5e] focus-visible:ring-[#f43f5e]/30"
                    />
                  </div>

                  <div className="flex flex-col gap-2 w-full">
                    <Label htmlFor="register-email">Correo electrónico</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@universidad.com"
                      className="w-full border-[#1e324d] bg-[#111c2d] text-white placeholder:text-slate-500 focus-visible:border-[#f43f5e] focus-visible:ring-[#f43f5e]/30"
                    />
                    <p className="text-sm text-slate-300">Te enviaremos un acceso directo a tu bandeja de entrada.</p>
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
                    className="w-full rounded-xl border border-[#f43f5e] bg-gradient-to-r from-[#e11d48] via-[#f43f5e] to-[#fb7185] py-2.5 text-base font-semibold text-white shadow-lg shadow-rose-950/30 hover:from-[#be123c] hover:via-[#e11d48] hover:to-[#f43f5e]"
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
