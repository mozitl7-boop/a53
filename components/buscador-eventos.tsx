"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Search,
  Filter,
  X,
  Calendar,
  Building2,
  GraduationCap,
} from "lucide-react";

type FiltrosBusqueda = {
  textoBusqueda: string;
  auditorio: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  includeFull?: boolean;
  carrera: string;
};

type PropiedadesBuscadorEventos = {
  alBuscar: (filtros: FiltrosBusqueda) => void;
  alLimpiar: () => void;
  abrirFiltrosSolicitud?: number;
};

export type { FiltrosBusqueda, PropiedadesBuscadorEventos };

export function BuscadorEventos({
  alBuscar,
  alLimpiar,
  abrirFiltrosSolicitud = 0,
}: PropiedadesBuscadorEventos) {
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosBusqueda>({
    textoBusqueda: "",
    auditorio: "todos",
    fechaInicio: "",
    fechaFin: "",
    estado: "todos",
    includeFull: false,
    carrera: "todos",
  });

  useEffect(() => {
    if (abrirFiltrosSolicitud > 0) {
      setMobileFiltersOpen(true);
    }
  }, [abrirFiltrosSolicitud]);

  const manejarBusqueda = (e: React.FormEvent) => {
    e.preventDefault();
    alBuscar(filtros);
  };

  const limpiarFiltros = () => {
    setFiltros({
      textoBusqueda: "",
      auditorio: "todos",
      fechaInicio: "",
      fechaFin: "",
      estado: "todos",
      carrera: "todos",
    });
    alLimpiar();
  };

  const hayFiltrosActivos =
    filtros.textoBusqueda ||
    filtros.auditorio !== "todos" ||
    filtros.fechaInicio ||
    filtros.fechaFin ||
    filtros.estado !== "todos" ||
    filtros.carrera !== "todos";

  return (
    <Card className="w-full rounded-2xl border border-slate-800 bg-slate-950/95 p-3 shadow-xl backdrop-blur-sm md:p-4">
      <form onSubmit={manejarBusqueda} className="space-y-3">
        <div className="mb-3 flex items-center gap-3">
          <div className="rounded-lg bg-rose-500/15 p-2 shadow-md shadow-rose-950/20">
            <Search className="h-5 w-5 text-rose-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Buscar Eventos</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="ml-auto hidden rounded-lg text-slate-300 hover:bg-rose-500/10 hover:text-white md:inline-flex"
          >
            <Filter className="w-4 h-4 mr-2" />
            {mostrarFiltros ? "Ocultar" : "Filtros"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMobileFiltersOpen(true)}
            className="ml-auto inline-flex rounded-lg text-slate-300 hover:bg-rose-500/10 hover:text-white md:hidden"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <Input
              type="text"
              placeholder="Buscar por título o descripción..."
              value={filtros.textoBusqueda}
              onChange={(e) =>
                setFiltros({ ...filtros, textoBusqueda: e.target.value })
              }
              className="rounded-lg border-slate-800 bg-slate-900/80 pl-10 shadow-sm focus-visible:border-rose-500 focus-visible:ring-rose-500/30"
            />
          </div>
          <Button
            type="submit"
            className="rounded-lg bg-gradient-to-r from-[#e11d48] via-[#f43f5e] to-[#fb7185] px-5 text-white shadow-md shadow-rose-950/30 hover:from-[#be123c] hover:via-[#e11d48] hover:to-[#f43f5e]"
          >
            Buscar
          </Button>
          {hayFiltrosActivos && (
            <Button
              type="button"
              variant="ghost"
              onClick={limpiarFiltros}
              className="rounded-lg px-3 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {mostrarFiltros && (
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t-2 border-gray-200">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4" />
                Auditorio
              </Label>
              <Select
                value={filtros.auditorio}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, auditorio: value })
                }
              >
                <SelectTrigger className="rounded-lg shadow-sm">
                  <SelectValue placeholder="Selecciona un auditorio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="A">Auditorio A</SelectItem>
                  <SelectItem value="B">Auditorio B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4" />
                Carrera
              </Label>
              <Select
                value={filtros.carrera}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, carrera: value })
                }
              >
                <SelectTrigger className="rounded-lg shadow-sm">
                  <SelectValue placeholder="Selecciona una carrera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las carreras</SelectItem>
                  <SelectItem value="electronica">
                    Ingeniería Electrónica
                  </SelectItem>
                  <SelectItem value="electrica">
                    Ingeniería Eléctrica
                  </SelectItem>
                  <SelectItem value="industrial">
                    Ingeniería Industrial
                  </SelectItem>
                  <SelectItem value="mecanica">Ingeniería Mecánica</SelectItem>
                  <SelectItem value="logistica">
                    Ingeniería en Logística
                  </SelectItem>
                  <SelectItem value="gestion">
                    Ingeniería en Gestión Empresarial
                  </SelectItem>
                  <SelectItem value="tic">
                    Ingeniería en Tecnologías de la Información y Comunicaciones
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Estado</Label>
              <Select
                value={filtros.estado}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, estado: value })
                }
              >
                <SelectTrigger className="rounded-lg shadow-sm">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-white">
                <input
                  type="checkbox"
                  checked={!!filtros.includeFull}
                  onChange={(e) =>
                    setFiltros({ ...filtros, includeFull: e.target.checked })
                  }
                  className="mr-2"
                />
                Incluir salas llenas en resultados
              </label>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                Fecha Inicio
              </Label>
              <Input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaInicio: e.target.value })
                }
                className="rounded-lg shadow-sm"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                Fecha Fin
              </Label>
              <Input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaFin: e.target.value })
                }
                className="rounded-lg shadow-sm"
              />
            </div>
          </div>
        )}

        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetContent side="bottom" className="rounded-t-3xl border-slate-700/80 bg-white p-4">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription>
                Ajusta la búsqueda y aplica tus filtros desde el móvil.
              </SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-1 gap-4 pt-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4" />
                  Auditorio
                </Label>
                <Select
                  value={filtros.auditorio}
                  onValueChange={(value) =>
                    setFiltros({ ...filtros, auditorio: value })
                  }
                >
                  <SelectTrigger className="rounded-lg shadow-sm w-full">
                    <SelectValue placeholder="Selecciona un auditorio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="A">Auditorio A</SelectItem>
                    <SelectItem value="B">Auditorio B</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-4 h-4" />
                  Carrera
                </Label>
                <Select
                  value={filtros.carrera}
                  onValueChange={(value) =>
                    setFiltros({ ...filtros, carrera: value })
                  }
                >
                  <SelectTrigger className="rounded-lg shadow-sm w-full">
                    <SelectValue placeholder="Selecciona una carrera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas las carreras</SelectItem>
                    <SelectItem value="electronica">Ingeniería Electrónica</SelectItem>
                    <SelectItem value="electrica">Ingeniería Eléctrica</SelectItem>
                    <SelectItem value="industrial">Ingeniería Industrial</SelectItem>
                    <SelectItem value="mecanica">Ingeniería Mecánica</SelectItem>
                    <SelectItem value="logistica">Ingeniería en Logística</SelectItem>
                    <SelectItem value="gestion">Ingeniería en Gestión Empresarial</SelectItem>
                    <SelectItem value="tic">Ingeniería en Tecnologías de la Información y Comunicaciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Estado</Label>
                <Select
                  value={filtros.estado}
                  onValueChange={(value) =>
                    setFiltros({ ...filtros, estado: value })
                  }
                >
                  <SelectTrigger className="rounded-lg shadow-sm w-full">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={!!filtros.includeFull}
                    onChange={(e) =>
                      setFiltros({ ...filtros, includeFull: e.target.checked })
                    }
                    className="mr-2"
                  />
                  Incluir salas llenas
                </label>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  Fecha Inicio
                </Label>
                <Input
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) =>
                    setFiltros({ ...filtros, fechaInicio: e.target.value })
                  }
                  className="rounded-lg shadow-sm"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  Fecha Fin
                </Label>
                <Input
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) =>
                    setFiltros({ ...filtros, fechaFin: e.target.value })
                  }
                  className="rounded-lg shadow-sm"
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {hayFiltrosActivos && (
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-xs font-medium text-muted">
              Filtros activos:
            </span>
            {filtros.textoBusqueda && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                Búsqueda: {filtros.textoBusqueda}
              </span>
            )}
            {filtros.auditorio !== "todos" && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                Auditorio {filtros.auditorio}
              </span>
            )}
            {filtros.fechaInicio && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Desde: {filtros.fechaInicio}
              </span>
            )}
            {filtros.fechaFin && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Hasta: {filtros.fechaFin}
              </span>
            )}
            {filtros.estado !== "todos" && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                Estado: {filtros.estado}
              </span>
            )}
            {filtros.carrera !== "todos" && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                Carrera: {filtros.carrera}
              </span>
            )}
          </div>
        )}
      </form>
    </Card>
  );
}
