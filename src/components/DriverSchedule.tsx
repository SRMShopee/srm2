"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Car,
} from "lucide-react";
import { getCurrentUser } from "@/utils/auth";

type Period = "AM" | "PM" | "OUROBOROS";
type VehicleType = "PASSEIO" | "UTILITARIO" | "VAN" | "VUC" | string;

interface PeriodInfo {
  id: Period;
  name: string;
  time: string;
  description: string;
  recommendedVehicles?: VehicleType[];
}

const PERIODS: PeriodInfo[] = [
  {
    id: "AM",
    name: "Período AM",
    time: "3:30 - 7:30",
    description: "Entregas matinais",
    recommendedVehicles: ["UTILITARIO", "VAN", "VUC"],
  },
  {
    id: "PM",
    name: "Período PM",
    time: "11:00 - 13:00",
    description: "Entregas do meio-dia",
    recommendedVehicles: ["PASSEIO"],
  },
  {
    id: "OUROBOROS",
    name: "Período OUROBOROS",
    time: "15:00 - 17:00",
    description: "Entregas da tarde",
  },
];

// Lista de cidades disponíveis para entrega
const AVAILABLE_CITIES = [
  "ARARICA",
  "BOM PRINCIPIO",
  "CAMPO BOM",
  "CAPELA DE SANTANA",
  "DOIS IRMAOS",
  "ESTANCIA VELHA",
  "ESTEIO",
  "HARMONIA",
  "IGREJINHA",
  "IVOTI",
  "LINDOLFO COLLOR",
  "MONTENEGRO",
  "MORRO REUTER",
  "NOVA HARTZ",
  "NOVO HAMBURGO",
  "PARECI NOVO",
  "PAROBE",
  "PICADA CAFE",
  "PORTAO",
  "PRESIDENTE LUCENA",
  "RIOZINHO",
  "ROLANTE",
  "SANTA MARIA DO HERVAL",
  "SAO JOSE DO HORTENCIO",
  "SAO LEOPOLDO",
  "SAO SEBASTIAO DO CAI",
  "SAPIRANGA",
  "SAPUCAIA DO SUL",
  "TAQUARA",
  "TRES COROAS",
];

export default function DriverSchedule() {
  const [selectedPeriods, setSelectedPeriods] = useState<Period[]>([]);
  const [currentDate] = useState<Date>(new Date());
  const [nextDays] = useState<Date[]>(getNextDays(7));
  const [selectedDay, setSelectedDay] = useState<Date>(nextDays[0]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userVehicle, setUserVehicle] = useState<VehicleType>("");
  const [hasActiveAvailability, setHasActiveAvailability] = useState(false);
  const [activeAvailabilityPeriod, setActiveAvailabilityPeriod] =
    useState<Period | null>(null);

  // Fetch user data and current availability on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get current user from auth
        const user = getCurrentUser();
        if (!user) return;

        // Fetch user preferences and availability
        const response = await fetch("/api/preferences", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data = await response.json();

        // Check if user has active availability
        if (data.availability && data.availability.disp === true) {
          setHasActiveAvailability(true);
          setActiveAvailabilityPeriod(data.availability.turno);
          setSelectedPeriods([data.availability.turno]);
        } else {
          setHasActiveAvailability(false);
          setActiveAvailabilityPeriod(null);
        }

        // Set user vehicle type
        if (data.availability && data.availability.vehicle) {
          setUserVehicle(data.availability.vehicle);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fetchUserData();
  }, []);

  function getNextDays(count: number): Date[] {
    const days: Date[] = [];
    const today = new Date();

    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      days.push(date);
    }

    return days;
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  }

  function isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  function togglePeriod(period: Period) {
    // If user has active availability, don't allow selecting a different period
    if (hasActiveAvailability && activeAvailabilityPeriod !== period) {
      setError(
        "Você já possui uma disponibilidade ativa. Cancele-a antes de selecionar outro período.",
      );
      return;
    }

    if (selectedPeriods.includes(period)) {
      setSelectedPeriods(selectedPeriods.filter((p) => p !== period));
    } else {
      // Only allow one period at a time
      setSelectedPeriods([period]);
    }
  }

  const saveAvailability = async () => {
    if (selectedPeriods.length === 0) {
      setError("Selecione pelo menos um período de disponibilidade");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the API to save availability
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          availability: {
            turno: selectedPeriods[0],
            disp: true,
          },
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao salvar disponibilidade");
      }

      // Update state to reflect active availability
      setHasActiveAvailability(true);
      setActiveAvailabilityPeriod(selectedPeriods[0]);

      // Show success message
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error saving availability:", err);
      setError(
        err.message ||
          "Ocorreu um erro ao salvar sua disponibilidade. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelAvailability = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call the API to cancel availability
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          availability: {
            turno: activeAvailabilityPeriod,
            disp: false,
          },
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao cancelar disponibilidade");
      }

      // Reset availability state
      setHasActiveAvailability(false);
      setActiveAvailabilityPeriod(null);
      setSelectedPeriods([]);

      // Show success message
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error canceling availability:", err);
      setError(
        err.message ||
          "Ocorreu um erro ao cancelar sua disponibilidade. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Check if a period is recommended for the user's vehicle type
  const isPeriodRecommended = (period: PeriodInfo): boolean => {
    if (!userVehicle || !period.recommendedVehicles) return false;
    return period.recommendedVehicles.includes(userVehicle.toUpperCase());
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="border-orange-100 shadow-md">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Calendar className="h-5 w-5" />
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-transparent bg-clip-text">
              Agenda de Disponibilidade
            </span>
          </CardTitle>
          <CardDescription className="text-orange-100">
            Marque sua disponibilidade para os próximos dias
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">
                {hasActiveAvailability
                  ? "Disponibilidade salva com sucesso!"
                  : "Disponibilidade cancelada com sucesso!"}
              </p>
            </div>
          )}

          {userVehicle && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2 text-blue-700">
              {userVehicle.toUpperCase() === "PASSEIO" ? (
                <Car className="h-4 w-4 flex-shrink-0" />
              ) : (
                <Truck className="h-4 w-4 flex-shrink-0" />
              )}
              <p className="text-sm">
                Seu veículo:{" "}
                <span className="font-medium">{userVehicle.toUpperCase()}</span>
              </p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 uppercase tracking-wide text-sm font-bold text-gray-700 dark:text-gray-300">
              Selecione uma data
            </h3>
            <div className="flex overflow-x-auto pb-2 space-x-2">
              {nextDays.map((day, index) => (
                <Button
                  key={index}
                  variant={
                    selectedDay.getDate() === day.getDate()
                      ? "default"
                      : "outline"
                  }
                  className={`flex-shrink-0 ${selectedDay.getDate() === day.getDate() ? "bg-orange-500 text-white" : "border-orange-200 text-gray-700"} ${isToday(day) ? "ring-2 ring-orange-300" : ""}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <div className="text-center">
                    <div className="text-xs font-medium">
                      {day
                        .toLocaleDateString("pt-BR", { weekday: "short" })
                        .toUpperCase()}
                    </div>
                    <div className="text-lg font-bold">{day.getDate()}</div>
                    <div className="text-xs">
                      {day.toLocaleDateString("pt-BR", { month: "short" })}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 flex items-center gap-2 uppercase tracking-wide text-sm font-bold text-gray-700 dark:text-gray-300">
              <Clock className="h-5 w-5 text-orange-500" />
              Períodos Disponíveis para {formatDate(selectedDay)}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PERIODS.map((period) => {
                const isRecommended = isPeriodRecommended(period);
                return (
                  <div
                    key={period.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all 
                      ${selectedPeriods.includes(period.id) ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-200"}
                      ${isRecommended ? "ring-2 ring-green-400" : ""}`}
                    onClick={() => togglePeriod(period.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{period.name}</h4>
                          {isRecommended && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                              Recomendado
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {period.description}
                        </p>
                      </div>
                      {selectedPeriods.includes(period.id) && (
                        <CheckCircle2 className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-orange-500">
                      <Clock className="h-4 w-4" />
                      {period.time}
                    </div>
                    {period.recommendedVehicles && (
                      <div className="mt-2 text-xs text-gray-500">
                        Ideal para: {period.recommendedVehicles.join(", ")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {hasActiveAvailability ? (
            <Button
              className="w-full bg-red-500 hover:bg-red-600 text-white"
              onClick={cancelAvailability}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Cancelando...
                </>
              ) : (
                "Cancelar Disponibilidade"
              )}
            </Button>
          ) : (
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={saveAvailability}
              disabled={loading || selectedPeriods.length === 0}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                "Salvar Disponibilidade"
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
