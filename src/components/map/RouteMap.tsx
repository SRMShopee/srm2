"use client";

import { useEffect, useState } from "react";
import { Route } from "@/types";
import { MapPin } from "lucide-react";

interface RouteMapProps {
  route: Route | null;
}

export default function RouteMap({ route }: RouteMapProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento do mapa
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-shopee-orange" />
          Mapa de Rotas
        </h2>
      </div>
      <div className="aspect-video bg-gray-100 flex items-center justify-center p-4">
        {isLoading ? (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shopee-orange"></div>
        ) : route ? (
          <div className="text-center">
            <div className="bg-white p-6 rounded-lg shadow-sm inline-block">
              <p className="text-gray-500 mb-2">Rota atual: {route.name}</p>
              <p className="font-bold text-xl text-shopee-orange">
                {route.city?.name || "SINOSPLEX"}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {route.packages} pacotes • {route.distance} •{" "}
                {route.estimated_time}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-white p-6 rounded-lg shadow-sm inline-block">
              <p className="text-gray-500 mb-2">
                Mapa do Google Maps centralizado em
              </p>
              <p className="font-bold text-xl text-shopee-orange">SINOSPLEX</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
