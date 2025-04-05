"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../supabase/client";
import { Route, User } from "@/types";
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
  Calendar,
  Info,
} from "lucide-react";

interface DriverRoutesProps {
  user: User;
}

export default function DriverRoutes({ user }: DriverRoutesProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [userAvailability, setUserAvailability] = useState<{
    [key: string]: string[];
  }>({});
  const [hasAvailability, setHasAvailability] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUserAvailability() {
      setLoading(true);
      try {
        // First check if user has set region preferences
        const preferencesResponse = await fetch("/api/preferences");
        if (!preferencesResponse.ok) {
          throw new Error("Failed to fetch user preferences");
        }

        const preferencesData = await preferencesResponse.json();

        // Check if user has set region preferences
        const userHasPreferences =
          preferencesData.preferences &&
          preferencesData.preferences.primary_regions &&
          Array.isArray(preferencesData.preferences.primary_regions) &&
          preferencesData.preferences.primary_regions.length > 0;

        if (!userHasPreferences) {
          setHasAvailability(false);
          setError(
            "Você precisa definir suas preferências de região antes de visualizar rotas disponíveis.",
          );
          setLoading(false);
          return;
        }

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const formatDateKey = (date: Date) => {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        };

        // Initialize with empty availability
        const availability = {
          [formatDateKey(today)]: [],
          [formatDateKey(tomorrow)]: [],
        };

        // If we have availability data and it's active (disp=true), add the shift
        if (
          preferencesData.availability &&
          preferencesData.availability.disp &&
          preferencesData.availability.turno
        ) {
          availability[formatDateKey(tomorrow)] = [
            preferencesData.availability.turno,
          ];
          setHasAvailability(true);
        } else {
          setHasAvailability(false);
        }

        setUserAvailability(availability);
      } catch (err) {
        console.error("Erro ao buscar disponibilidade do usuário:", err);
        setHasAvailability(false);
      } finally {
        setLoading(false);
      }
    }

    fetchUserAvailability();
  }, [user.id]);

  useEffect(() => {
    async function fetchRoutes() {
      if (!hasAvailability) {
        setRoutes([]);
        return;
      }

      setLoading(true);
      try {
        // Get all available periods the user has scheduled
        const availablePeriods = Object.values(userAvailability).flat();

        // Fetch routes from API with availability filter
        const response = await fetch(`/api/routes?filterByAvailability=true`);
        if (!response.ok) {
          throw new Error("Failed to fetch routes");
        }

        const data = await response.json();

        if (data.hasAvailability === false) {
          setHasAvailability(false);
          setRoutes([]);
        } else if (data.routes) {
          setRoutes(data.routes);
        } else {
          // Fallback to mock data if API doesn't return routes
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
          ].filter((route) => availablePeriods.includes(route.period));

          setRoutes(mockRoutes);
        }
      } catch (err) {
        console.error("Erro ao buscar rotas:", err);
        setError(
          "Erro ao carregar rotas disponíveis. Tente novamente mais tarde.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchRoutes();
  }, [hasAvailability, userAvailability]);

  const filteredRoutes =
    selectedPeriod === "all"
      ? routes
      : routes.filter((route) => route.period === selectedPeriod);

  const getPeriodColor = (period: string) => {
    switch (period) {
      case "AM":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200";
      case "PM":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
      case "OUROBOROS":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
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

  const cancelAvailability = async () => {
    try {
      setLoading(true);
      // Call API to cancel availability
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          availability: {
            turno: null,
            disp: false,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel availability");
      }

      // Update local state
      setHasAvailability(false);
      setRoutes([]);
    } catch (err) {
      console.error("Erro ao cancelar disponibilidade:", err);
      setError("Erro ao cancelar disponibilidade. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8 mt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shopee-orange dark:border-orange-500"></div>
      </div>
    );
  }

  if (!hasAvailability) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <Card className="border-orange-100 dark:border-orange-900 shadow-md bg-white dark:bg-gray-800">
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
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
              <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 p-4 rounded-full">
                <Calendar className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold dark:text-white">
                {error
                  ? "Preferências de Região Não Definidas"
                  : "Você não selecionou nenhum turno de disponibilidade"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                {error
                  ? error
                  : "Você precisa marcar sua disponibilidade na agenda antes de visualizar as rotas disponíveis."}
              </p>
              <Button
                onClick={() => {
                  // Navigate to preferences or agenda page
                  if (error) {
                    window.location.href = "/dashboard/preferences";
                  } else {
                    window.location.href = "/dashboard/schedule";
                  }
                }}
                className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
              >
                {error ? (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Definir Preferências de Região
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Ir para Agenda
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-6 mt-16">
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="border-orange-100 dark:border-orange-900 shadow-md bg-white dark:bg-gray-800">
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
            <h3 className="text-lg font-medium mb-3 dark:text-white">
              Filtrar por período
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedPeriod === "all" ? "default" : "outline"}
                className={
                  selectedPeriod === "all"
                    ? "bg-shopee-orange text-white"
                    : "border-orange-200 dark:border-orange-800"
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
                    : "border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400"
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
                    : "border-green-200 text-green-700 dark:border-green-800 dark:text-green-400"
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
                    : "border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-400"
                }
                onClick={() => setSelectedPeriod("OUROBOROS")}
              >
                <Clock className="mr-2 h-4 w-4" />
                OUROBOROS (15:00 - 17:00)
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-blue-800 dark:text-blue-200 font-medium">
                Rotas baseadas na sua disponibilidade
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Você está vendo apenas rotas para os períodos em que marcou
                disponibilidade na agenda.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 flex-shrink-0"
              onClick={cancelAvailability}
            >
              Cancelar Disponibilidade
            </Button>
          </div>

          {filteredRoutes.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-orange-200 dark:hover:border-orange-700 transition-colors shadow-sm hover:shadow-md bg-white dark:bg-gray-800"
                  >
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium dark:text-white">
                            {route.name}
                          </h4>
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
                            <MapPin className="h-3 w-3" />
                            {route.city?.name || "Não especificada"}
                          </div>
                        </div>
                        <Badge className={getPeriodColor(route.period)}>
                          {route.period}
                        </Badge>
                      </div>

                      <div className="mb-2">
                        <div className="text-xs font-medium mb-1 dark:text-gray-300">
                          Principais bairros:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant="outline"
                            className="bg-gray-50 dark:bg-gray-700 text-xs py-0 dark:text-gray-300"
                          >
                            Área Rural
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-gray-50 dark:bg-gray-700 text-xs py-0 dark:text-gray-300"
                          >
                            Faz Filho
                          </Badge>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                          <span className="font-medium dark:text-gray-300">
                            {route.distance || "15 km"}
                          </span>
                        </div>
                      </div>

                      {route.status === "accepted" ? (
                        <div className="text-center p-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-sm">
                          <CheckCircle2 className="h-4 w-4 inline mr-1" />
                          Solicitada
                        </div>
                      ) : (
                        <Button
                          onClick={() => {
                            // Show confirmation dialog
                            const confirmDialog = document.createElement("div");
                            confirmDialog.id = "route-confirmation-dialog";
                            confirmDialog.className =
                              "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
                            confirmDialog.innerHTML = `
                              <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 relative">
                                <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" onclick="document.getElementById('route-confirmation-dialog').remove()">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                                <div class="flex items-center gap-2 mb-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-500"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
                                  <h3 class="text-lg font-semibold dark:text-white">Confirmar seleção de rota</h3>
                                </div>
                                <p class="text-gray-600 dark:text-gray-300 mb-4">Você está prestes a selecionar uma rota. Esta ação precisará ser aprovada por um administrador.</p>
                                <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-md mb-4">
                                  <div class="flex items-center gap-2 mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-500"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    <span class="font-medium text-orange-700 dark:text-orange-300">${route.city?.name || "Taquara"}</span>
                                  </div>
                                  <div class="flex items-center gap-2 mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-500"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                    <span class="font-medium text-orange-700 dark:text-orange-300">${route.period} (${getPeriodTime(route.period)})</span>
                                  </div>
                                  <div class="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-500"><path d="M5 8h14"></path><path d="M5 12h14"></path><path d="M5 16h14"></path><path d="M3 21h18"></path><path d="M3 3h18"></path></svg>
                                    <span class="font-medium text-orange-700 dark:text-orange-300">${route.distance || "15 km"} de distância total</span>
                                  </div>
                                </div>
                                <div class="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md mb-4">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                                  <span class="text-sm text-amber-800 dark:text-amber-200">Ao confirmar, você estará se candidatando para esta rota. Um administrador precisará aprovar sua solicitação.</span>
                                </div>
                                <div class="flex justify-end gap-2">
                                  <button class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200" onclick="document.getElementById('route-confirmation-dialog').remove()">Cancelar</button>
                                  <button class="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600" onclick="document.getElementById('route-confirmation-dialog').remove(); window.handleRouteRequest('${route.id}')">Confirmar Seleção</button>
                                </div>
                              </div>
                            `;
                            document.body.appendChild(confirmDialog);

                            // Add global handler for the confirmation button
                            window.handleRouteRequest = (routeId) => {
                              handleRequestRoute(routeId);
                              delete window.handleRouteRequest;
                            };
                          }}
                          className="w-full bg-shopee-orange hover:bg-orange-600 text-white text-sm py-1"
                          size="sm"
                        >
                          Selecionar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
              <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 p-4 rounded-full">
                <MapPin className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold dark:text-white">
                Nenhuma rota disponível
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Não há rotas disponíveis para o período selecionado. Tente
                selecionar outro período ou verifique mais tarde.
              </p>
              <Button
                onClick={() => setSelectedPeriod("all")}
                className="mt-2 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Ver todos os períodos
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
