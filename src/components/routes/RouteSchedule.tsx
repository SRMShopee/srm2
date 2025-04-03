"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Period = "AM" | "PM" | "OUROBOROS";

interface PeriodInfo {
  id: Period;
  name: string;
  time: string;
  description: string;
}

const PERIODS: PeriodInfo[] = [
  {
    id: "AM",
    name: "Período AM",
    time: "3:30 - 7:30",
    description: "Entregas matinais",
  },
  {
    id: "PM",
    name: "Período PM",
    time: "11:00 - 13:00",
    description: "Entregas do meio-dia",
  },
  {
    id: "OUROBOROS",
    name: "Período OUROBOROS",
    time: "15:00 - 17:00",
    description: "Entregas da tarde",
  },
];

interface RouteScheduleProps {
  userId: string;
}

export default function RouteSchedule({ userId }: RouteScheduleProps) {
  const [selectedPeriods, setSelectedPeriods] = useState<Period[]>([]);
  const [currentDate] = useState<Date>(new Date());
  const [nextDays] = useState<Date[]>(getNextDays(7));
  const [selectedDay, setSelectedDay] = useState<Date>(nextDays[0]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Aqui você poderia buscar as disponibilidades já cadastradas
    // para o usuário na data selecionada
    async function fetchAvailability() {
      try {
        // Implementação futura: buscar disponibilidades do banco de dados
        // Por enquanto, apenas simulamos com dados vazios
        setSelectedPeriods([]);
      } catch (error) {
        console.error("Erro ao buscar disponibilidades:", error);
      }
    }

    fetchAvailability();
  }, [selectedDay, userId]);

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
    if (selectedPeriods.includes(period)) {
      setSelectedPeriods(selectedPeriods.filter((p) => p !== period));
    } else {
      setSelectedPeriods([...selectedPeriods, period]);
    }
    setError("");
    setSuccess("");
  }

  async function saveAvailability() {
    if (selectedPeriods.length === 0) {
      setError("Selecione pelo menos um período");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Aqui você implementaria a lógica para salvar no banco de dados
      // Por enquanto, apenas simulamos o sucesso após um delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess("Disponibilidade salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar disponibilidade:", error);
      setError("Erro ao salvar disponibilidade. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border shadow-md">
      <div className="p-4 border-b bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Agenda de Disponibilidade
        </h2>
        <p className="text-sm text-orange-100">
          Marque sua disponibilidade para os próximos dias
        </p>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            {success}
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Selecione uma data</h3>
          <div className="flex overflow-x-auto pb-2 space-x-2">
            {nextDays.map((day, index) => (
              <Button
                key={index}
                variant={
                  selectedDay.getDate() === day.getDate()
                    ? "default"
                    : "outline"
                }
                className={`flex-shrink-0 ${selectedDay.getDate() === day.getDate() ? "bg-shopee-orange text-white" : "border-orange-200 text-gray-700"} ${isToday(day) ? "ring-2 ring-orange-300" : ""}`}
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
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-shopee-orange" />
            Períodos Disponíveis para {formatDate(selectedDay)}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PERIODS.map((period) => (
              <div
                key={period.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedPeriods.includes(period.id) ? "border-shopee-orange bg-orange-50" : "border-gray-200 hover:border-orange-200"}`}
                onClick={() => togglePeriod(period.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{period.name}</h4>
                    <p className="text-sm text-gray-500">
                      {period.description}
                    </p>
                  </div>
                  {selectedPeriods.includes(period.id) && (
                    <CheckCircle2 className="h-5 w-5 text-shopee-orange" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-shopee-orange">
                  <Clock className="h-4 w-4" />
                  {period.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          className="w-full bg-shopee-orange hover:bg-orange-600 text-white"
          onClick={saveAvailability}
          disabled={loading}
        >
          {loading ? "Salvando..." : "Salvar Disponibilidade"}
        </Button>
      </div>
    </div>
  );
}
