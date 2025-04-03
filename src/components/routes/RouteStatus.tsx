"use client";

import { Route } from "@/types";
import { AlertCircle, CheckCircle, Clock, Package, MapPin } from "lucide-react";
import { Button } from "../ui/button";

interface RouteStatusProps {
  route: Route | null;
}

export default function RouteStatus({ route }: RouteStatusProps) {
  if (!route) {
    return (
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-lg">Status da Rota</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
            <AlertCircle className="h-5 w-5" />
            <p>Você não possui nenhuma rota atribuída no momento.</p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-gray-500 mb-4">
              Acesse a seção "Rotas" para solicitar uma nova rota.
            </p>
            <Button className="bg-shopee-orange hover:bg-orange-600 text-white">
              Ver Rotas Disponíveis
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-semibold text-lg">Status da Rota</h2>
      </div>
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl font-semibold">{route.name}</h3>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                {route.status === "pending"
                  ? "Pendente"
                  : route.status === "accepted"
                    ? "Atribuída"
                    : "Concluída"}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4 text-shopee-orange" />
                <span>Período: {route.period}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Package className="h-4 w-4 text-shopee-orange" />
                <span>Pacotes: {route.packages}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4 text-shopee-orange" />
                <span>Região: {route.city?.name || "Não especificada"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <h4 className="font-medium">Rota Atribuída</h4>
              <p className="text-sm text-gray-500">
                Você pode iniciar esta entrega
              </p>
            </div>

            <Button className="w-full bg-shopee-orange hover:bg-orange-600 text-white">
              Iniciar Entrega
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
