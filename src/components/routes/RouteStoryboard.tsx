"use client";

import { useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { MapPin, Package, Clock, Edit, Save, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import RouteSchedule from "./RouteSchedule";
import RouteStatus from "./RouteStatus";

interface Route {
  id: string;
  file_name: string;
  city: string;
  neighborhoods: string[];
  total_distance: number;
  sequence: number;
  shift: "AM" | "PM" | "OUROBOROS";
  date: string;
  created_at: string;
  status?: "pending" | "approved" | "rejected";
  driver_id?: string;
  driver_name?: string;
  loading_time?: string;
}

interface RouteStoryboardProps {
  route: Route;
  onStatusChange?: (routeId: string, status: "approved" | "rejected") => void;
  onLoadingTimeChange?: (routeId: string, loadingTime: string) => void;
}

export default function RouteStoryboard({
  route,
  onStatusChange,
  onLoadingTimeChange,
}: RouteStoryboardProps) {
  const [isEditingLoadingTime, setIsEditingLoadingTime] = useState(false);
  const [loadingTime, setLoadingTime] = useState(route.loading_time || "");

  const handleStatusChange = (status: "approved" | "rejected") => {
    if (onStatusChange) {
      onStatusChange(route.id, status);
    }
  };

  const handleSaveLoadingTime = () => {
    if (onLoadingTimeChange) {
      onLoadingTimeChange(route.id, loadingTime);
    }
    setIsEditingLoadingTime(false);
  };

  const handleCancelEdit = () => {
    setLoadingTime(route.loading_time || "");
    setIsEditingLoadingTime(false);
  };

  return (
    <Card className="border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-medium text-lg dark:text-white">
              {route.file_name}
            </h3>
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
              <MapPin className="h-3 w-3" />
              {route.city}
            </div>
          </div>
          <RouteSchedule shift={route.shift} date={route.date} />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Pacotes
            </div>
            <div className="font-medium flex items-center gap-1">
              <Package className="h-4 w-4 text-orange-500" />
              {route.sequence}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Distância
            </div>
            <div className="font-medium flex items-center gap-1">
              <MapPin className="h-4 w-4 text-orange-500" />
              {route.total_distance.toFixed(2)} km
            </div>
          </div>
        </div>

        <div className="mb-3">
          <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-300">
            Bairros:
          </div>
          <div className="flex flex-wrap gap-1">
            {route.neighborhoods.slice(0, 3).map((neighborhood, index) => (
              <Badge
                key={index}
                variant="outline"
                className="bg-gray-50 dark:bg-gray-800 text-xs py-0"
              >
                {neighborhood}
              </Badge>
            ))}
            {route.neighborhoods.length > 3 && (
              <Badge
                variant="outline"
                className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-xs py-0"
              >
                +{route.neighborhoods.length - 3} mais
              </Badge>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md mb-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Horário de Carregamento
          </div>
          <div className="font-medium flex items-center gap-1">
            <Clock className="h-4 w-4 text-blue-500" />
            {isEditingLoadingTime ? (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={loadingTime}
                  onChange={(e) => setLoadingTime(e.target.value)}
                  placeholder="HH:MM"
                  className="w-20 h-7 py-1 px-2 text-sm"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={handleSaveLoadingTime}
                >
                  <Save className="h-4 w-4 text-green-500" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={handleCancelEdit}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-blue-500">
                  {route.loading_time || "Não definido"}
                </span>
                {onLoadingTimeChange && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsEditingLoadingTime(true)}
                  >
                    <Edit className="h-3 w-3 text-gray-500" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <RouteStatus
            status={route.status}
            onStatusChange={handleStatusChange}
          />

          {route.driver_name && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Motorista: {route.driver_name}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
