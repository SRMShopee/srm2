"use client";

import { Badge } from "../ui/badge";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RouteScheduleProps {
  shift?: "AM" | "PM" | "OUROBOROS";
  date?: string;
  userId?: string;
}

export const getShiftColor = (shift: string) => {
  switch (shift) {
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

export const getShiftTime = (shift: string) => {
  switch (shift) {
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

export const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

export default function RouteSchedule({
  shift,
  date,
  userId,
}: RouteScheduleProps) {
  const [availability, setAvailability] = React.useState<{
    shift: "AM" | "PM" | "OUROBOROS";
    date: string;
    active: boolean;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    // If shift and date are provided directly, use those
    if (shift && date) {
      setAvailability({
        shift,
        date,
        active: true,
      });
      setLoading(false);
      return;
    }

    // Otherwise fetch from API if userId is provided
    if (userId) {
      const fetchAvailability = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/preferences?user_id=${userId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          });

          if (!response.ok) {
            throw new Error("Failed to fetch availability");
          }

          const data = await response.json();
          if (data.availability) {
            setAvailability({
              shift: data.availability.shift || "AM",
              date:
                data.availability.date ||
                new Date().toISOString().split("T")[0],
              active: data.availability.active || false,
            });
          } else {
            // Set default values if no availability found
            setAvailability({
              shift: "AM",
              date: new Date().toISOString().split("T")[0],
              active: false,
            });
          }
        } catch (err) {
          console.error("Error fetching availability:", err);
          setError(
            "Não foi possível carregar sua disponibilidade. Tente novamente mais tarde.",
          );
          // Set default values on error
          setAvailability({
            shift: "AM",
            date: new Date().toISOString().split("T")[0],
            active: false,
          });
        } finally {
          setLoading(false);
        }
      };

      fetchAvailability();
    }
  }, [shift, date, userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-800">
        {error}
      </div>
    );
  }

  if (!availability) {
    return (
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg border border-amber-200 dark:border-amber-800">
        Nenhuma disponibilidade configurada.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg border border-green-200 dark:border-green-800">
          Disponibilidade atualizada com sucesso!
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Sua Disponibilidade Atual</h3>
        <div className="flex flex-col gap-1 items-end">
          <Badge
            className={`${getShiftColor(availability.shift)} text-xs font-medium py-1 px-2 flex items-center`}
          >
            <Clock className="h-3 w-3 mr-1" />
            {availability.shift} ({getShiftTime(availability.shift)})
          </Badge>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(availability.date)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["AM", "PM", "OUROBOROS"].map((shiftOption) => (
          <div
            key={shiftOption}
            className={`p-4 rounded-lg border ${availability.shift === shiftOption ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20" : "border-gray-200 dark:border-gray-700"} hover:border-orange-300 dark:hover:border-orange-700 transition-all cursor-pointer`}
            onClick={() =>
              setAvailability({
                ...availability,
                shift: shiftOption as "AM" | "PM" | "OUROBOROS",
              })
            }
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">{shiftOption}</h4>
              <Badge className={`${getShiftColor(shiftOption)} text-xs`}>
                {getShiftTime(shiftOption)}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {shiftOption === "AM"
                ? "Manhã cedo"
                : shiftOption === "PM"
                  ? "Meio-dia"
                  : "Tarde"}
            </p>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div>
          <label className="block text-sm font-medium mb-1">
            Data de Disponibilidade:
          </label>
          <input
            type="date"
            value={availability.date}
            onChange={(e) =>
              setAvailability({
                ...availability,
                date: e.target.value,
              })
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        <button
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors duration-300"
          onClick={async () => {
            if (!userId) return;

            try {
              setLoading(true);
              const response = await fetch("/api/preferences", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  user_id: userId,
                  availability: {
                    shift: availability.shift,
                    date: availability.date,
                    active: true,
                  },
                }),
                credentials: "include",
              });

              if (!response.ok) {
                throw new Error("Failed to update availability");
              }

              setSuccess(true);
              setTimeout(() => setSuccess(false), 3000);
            } catch (err) {
              console.error("Error updating availability:", err);
              setError(
                "Não foi possível atualizar sua disponibilidade. Tente novamente mais tarde.",
              );
            } finally {
              setLoading(false);
            }
          }}
        >
          Salvar Disponibilidade
        </button>
      </div>
    </div>
  );
}
