"use client";

import { useState, useEffect } from "react";

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
        // ignore
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
      setSuccess(
        "Se ha enviado un enlace de confirmación a tu correo. Revisa tu bandeja de entrada."
      );
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
        body: JSON.stringify({
          nombre,
          email,
          tipo_usuario: tipoUsuario,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Error al registrarse");
        return;
      }
      setLinkSent(true);
      setSuccess(
        "Se ha enviado un enlace de confirmación a tu correo. Completa el registro usando el enlace."
      );
      setNombre("");
      setEmail("");
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async () => {
    const token = prompt(
      "Ingresa el token que recibiste por correo (para pruebas):"
    );
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/magic?token=${token}`);
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Token inválido");
        return;
      }
      // Refrescar la sesión
      const me = await fetch(`/api/auth/me`);
      const meJson = await me.json();
      if (me.ok && meJson.user) {
        onSelect(meJson.user as UserShort);
      }
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[420px] px-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.45)] p-8 backdrop-blur-xl">
        <div className="bg-[#152743] rounded-full p-1 mb-3 flex gap-1 border border-primary/30">
          <button
            onClick={() => {
              setTab("login");
              setLinkSent(false);
              setSuccess(null);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-full text-sm font-medium ${
              tab === "login" ? "bg-primary text-black shadow" : "text-slate-300"
            }`}
          >
            <span className="inline-flex items-center gap-2 justify-center">
              <span>↪</span>
              <span>Iniciar Sesión</span>
            </span>
          </button>
          <button
            onClick={() => {
              setTab("register");
              setLinkSent(false);
              setSuccess(null);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-full text-sm font-medium ${
              tab === "register" ? "bg-primary text-black shadow" : "text-slate-300"
            }`}
          >
            <span className="inline-flex items-center gap-2 justify-center">
              <span>Registrarse</span>
            </span>
          </button>
        </div>

        {tab === "login" && (
          <div>
            {linkSent ? (
              <>
                <div className="bg-slate-900/75 border border-blue-500/20 rounded-2xl p-4 mb-4">
                  <p className="text-sm text-slate-100">
                    ✓ Se ha enviado un enlace a tu correo. Por favor, revisa tu
                    bandeja de entrada.
                  </p>
                </div>
                <button
                  onClick={handleVerifyToken}
                  className="w-full mt-2 bg-slate-800 text-white py-2 rounded-2xl text-sm shadow-sm"
                >
                  Ya tengo el enlace, ingresar token
                </button>
                <button
                  onClick={() => setLinkSent(false)}
                  className="w-full mt-2 text-gray-600 text-sm underline"
                >
                  Usar otro correo
                </button>
              </>
            ) : (
              <>
                <label className="block text-sm font-medium text-slate-300">
                  Correo electrónico
                </label>
                <input
                  className="w-full mt-2 rounded-2xl border border-white/10 bg-[#0b1830] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@universidad.edu"
                />

                <p className="text-xs text-slate-400 mt-2 mb-2">
                  Recibirás un enlace para acceder directamente.
                </p>

                <button
                  onClick={submitLogin}
                  disabled={!email || loading}
                  className="w-full mt-3 bg-gradient-to-r from-primary to-accent text-black py-3 rounded-2xl shadow-xl disabled:opacity-60 transition-all"
                >
                  {loading ? "Enviando..." : "Enviar Enlace"}
                </button>
              </>
            )}
          </div>
        )}

        {tab === "register" && (
          <div>
            {linkSent ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                  <p className="text-sm text-green-700">
                    ✓ Cuenta creada. Se ha enviado un enlace de confirmación a
                    tu correo.
                  </p>
                </div>
                <button
                  onClick={handleVerifyToken}
                  className="w-full mt-2 bg-gray-600 text-white py-2 rounded-full text-sm"
                >
                  Ya tengo el enlace, ingresar token
                </button>
                <button
                  onClick={() => setLinkSent(false)}
                  className="w-full mt-2 text-gray-600 text-sm underline"
                >
                  Registrarse con otro correo
                </button>
              </>
            ) : (
              <>
                <label className="block text-sm font-medium text-slate-300">
                  Nombre completo
                </label>
                <input
                  className="w-full mt-2 rounded-2xl border border-white/10 bg-[#0b1830] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan Pérez"
                />

                <label className="block text-sm font-medium text-slate-300 mt-3">
                  Correo electrónico
                </label>
                <input
                  className="w-full mt-2 rounded-2xl border border-white/10 bg-[#0b1830] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@universidad.com"
                />

                <label className="block text-sm font-medium text-slate-300 mt-3">
                  Tipo de usuario
                </label>
                <select
                  className="w-full mt-2 rounded-2xl border border-white/10 bg-[#0b1830] px-4 py-3 text-sm text-white focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none"
                  value={tipoUsuario}
                  onChange={(e) => setTipoUsuario(e.target.value)}
                >
                  <option value="asistente">Asistente</option>
                  <option value="organizador">Organizador</option>
                </select>

                <button
                  onClick={submitRegister}
                  disabled={!nombre || !email || loading}
                  className="w-full mt-3 bg-gradient-to-r from-primary to-accent text-black py-3 rounded-2xl shadow-xl disabled:opacity-60 transition-all"
                >
                  {loading ? "Creando cuenta..." : "Crear Cuenta"}
                </button>
              </>
            )}
          </div>
        )}

        {checkingSession && (
          <div className="mt-3 text-sm">Comprobando sesión...</div>
        )}
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        {success && (
          <div className="mt-3 text-sm text-green-600">{success}</div>
        )}
      </div>
    </div>
  );
}
