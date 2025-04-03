"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../supabase/client";
import { Route } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  AlertCircle,
  MapPin,
  Clock,
  Package,
  CheckCircle2,
} from "lucide-react";

export default function DriverRoutes() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchRoutes() {
      setLoading(true);
      try {
        // Simular busca de rotas disponíveis
        // Em uma implementação real, você buscaria do banco de dados
        setTimeout(() => {
          const mockRoutes: Route[] = [
            {
              id: "R001",
              name: "Rota Centro Novo Hamburgo",
              status: "pending",
              period: "AM",
              packages: 15,
              distance: "12 km",
              estimated_time: "1h 30min",
              city_id: 15,
              city: { id: 15, name: "NOVO HAMBURGO" },
              description: "Entrega matinal em Novo Hamburgo",
            },
            {
              id: "R002",
              name: "Rota Canudos",
              status: "pending",
              period: "PM",
              packages: 12,
              distance: "8 km",
              estimated_time: "1h 15min",
              city_id: 15,
              city: { id: 15, name: "NOVO HAMBURGO" },
              description: "Entrega da tarde em Novo Hamburgo",
            },
            {
              id: "R003",
              name: "Rota Centro São Leopoldo",
              status: "pending",
              period: "OUROBOROS",
              packages: 18,
              distance: "15 km",
              estimated_time: "1h 45min",
              city_id: 25,
              city: { id: 25, name: "SAO LEOPOLDO" },
              description: "Entrega final em São Leopoldo",
            },
            {
              id: "R004",
              name: "Rota Mathias Velho",
              status: "pending",
              period: "AM",
              packages: 10,
              distance: "7 km",
              estimated_time: "1h",
              city_id: 3,
              city: { id: 3, name: "CAMPO BOM" },
              description: "Entrega matinal em Campo Bom",
            },
          ];
          setRoutes(mockRoutes);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error("Erro ao buscar rotas:", err);
        setError(
          "Erro ao carregar rotas disponíveis. Tente novamente mais tarde.",
        );
        setLoading(false);
      }
    }

    fetchRoutes();
  }, []);

  const filteredRoutes =
    selectedPeriod === "all"
      ? routes
      : routes.filter((route) => route.period === selectedPeriod);

  const getPeriodColor = (period: string) => {
    switch (period) {
      case "AM":
        return "bg-blue-100 text-blue-800";
      case "PM":
        return "bg-green-100 text-green-800";
      case "OUROBOROS":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPeriodTime = (period: string) => {
    switch (period) {
      case "AM":
        return "3:30 - 7:30";
      case "PM":
        return "11:00 - 13:00";
      case "OUROBOROS":
        return "15:00 - 17:00";
      default:
        return "";
    }
  };

  const handleRequestRoute = async (routeId: string) => {
    // Aqui você implementaria a lógica para solicitar uma rota
    // Por enquanto, apenas simulamos uma atualização local
    setRoutes(
      routes.map((route) =>
        route.id === routeId
          ? {
              ...route,
              status: "accepted" as "pending" | "accepted" | "completed",
            }
          : route,
      ),
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shopee-orange"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="border-orange-100 shadow-md">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Rotas Disponíveis
          </CardTitle>
          <CardDescription className="text-orange-100">
            Visualize e solicite rotas disponíveis para entrega
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Filtrar por período</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedPeriod === "all" ? "default" : "outline"}
                className={
                  selectedPeriod === "all"
                    ? "bg-shopee-orange text-white"
                    : "border-orange-200"
                }
                onClick={() => setSelectedPeriod("all")}
              >
                Todos os períodos
              </Button>
              <Button
                variant={selectedPeriod === "AM" ? "default" : "outline"}
                className={
                  selectedPeriod === "AM"
                    ? "bg-blue-600 text-white"
                    : "border-blue-200 text-blue-700"
                }
                onClick={() => setSelectedPeriod("AM")}
              >
                <Clock className="mr-2 h-4 w-4" />
                AM (3:30 - 7:30)
              </Button>
              <Button
                variant={selectedPeriod === "PM" ? "default" : "outline"}
                className={
                  selectedPeriod === "PM"
                    ? "bg-green-600 text-white"
                    : "border-green-200 text-green-700"
                }
                onClick={() => setSelectedPeriod("PM")}
              >
                <Clock className="mr-2 h-4 w-4" />
                PM (11:00 - 13:00)
              </Button>
              <Button
                variant={selectedPeriod === "OUROBOROS" ? "default" : "outline"}
                className={
                  selectedPeriod === "OUROBOROS"
                    ? "bg-purple-600 text-white"
                    : "border-purple-200 text-purple-700"
                }
                onClick={() => setSelectedPeriod("OUROBOROS")}
              >
                <Clock className="mr-2 h-4 w-4" />
                OUROBOROS (15:00 - 17:00)
              </Button>
            </div>
          </div>

          {filteredRoutes.length > 0 ? (
            <div className="space-y-4">
              {filteredRoutes.map((route) => (
                <div
                  key={route.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:border-orange-200 transition-colors"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-lg">{route.name}</h4>
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <MapPin className="h-4 w-4" />
                          {route.city?.name || "Não especificada"}
                        </div>
                      </div>
                      <Badge className={getPeriodColor(route.period)}>
                        {route.period} ({getPeriodTime(route.period)})
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm text-gray-500">Pacotes</div>
                        <div className="font-medium">{route.packages}</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm text-gray-500">Distância</div>
                        <div className="font-medium">{route.distance}</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm text-gray-500">Tempo Est.</div>
                        <div className="font-medium">
                          {route.estimated_time}
                        </div>
                      </div>
                    </div>

                    {route.status === "accepted" ? (
                      <div className="text-center p-3 bg-green-50 text-green-700 rounded-md">
                        <CheckCircle2 className="h-5 w-5 mx-auto mb-1" />
                        <p>Rota solicitada com sucesso!</p>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleRequestRoute(route.id)}
                        className="w-full bg-shopee-orange hover:bg-orange-600 text-white"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Solicitar Rota
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-6 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Nenhuma rota disponível</p>
                <p className="text-sm">
                  Não há rotas disponíveis para o período selecionado.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
