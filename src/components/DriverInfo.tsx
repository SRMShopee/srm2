"use client";

import React from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Truck,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
} from "lucide-react";
import { City } from "@/types";

interface Driver {
  id: string;
  name: string;
  driver_id: string;
  vehicle: string;
  hub_id: string;
  primary_region?: number;
  backup_regions?: number[];
  primary_region_name?: string;
  backup_region_names?: string[];
  is_available?: boolean;
  availability_date?: string;
  availability_shift?: "AM" | "PM" | "OUROBOROS";
}

interface DriverInfoProps {
  driver: Driver;
  cities?: City[];
}

export default function DriverInfo({ driver, cities = [] }: DriverInfoProps) {
  // Find primary region city if not already set in driver object
  const primaryRegionName =
    driver.primary_region_name ||
    (driver.primary_region && cities.length > 0
      ? cities.find((city) => city.id === driver.primary_region)?.name
      : "Não definida");

  // Find backup region cities if not already set in driver object
  const backupRegionNames =
    driver.backup_region_names ||
    (driver.backup_regions &&
    Array.isArray(driver.backup_regions) &&
    cities.length > 0
      ? driver.backup_regions.map((regionId) => {
          const city = cities.find((city) => city.id === regionId);
          return city ? city.name : "Desconhecida";
        })
      : []);

  return (
    <Card className="border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-medium text-lg dark:text-white">
              {driver.name}
            </h3>
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
              <Truck className="h-3 w-3" />
              Driver ID: {driver.driver_id}
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 text-xs font-medium py-1 px-2">
            {driver.vehicle || "Não definido"}
          </Badge>
        </div>

        <div className="space-y-3">
          {/* Availability Status */}
          <div>
            <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-300">
              Disponibilidade:
            </div>
            <div className="flex items-center gap-2">
              {driver.is_available ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 text-xs py-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Disponível
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 text-xs py-1 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Indisponível
                </Badge>
              )}

              {driver.availability_date && (
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="h-3 w-3 mr-1" />
                  {driver.availability_date}
                </div>
              )}

              {driver.availability_shift && (
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="h-3 w-3 mr-1" />
                  {driver.availability_shift}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-300">
              Região Principal:
            </div>
            <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 text-xs py-1">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {primaryRegionName}
              </div>
            </Badge>
          </div>

          <div>
            <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-300">
              Regiões de Backup:
            </div>
            <div className="flex flex-wrap gap-1">
              {backupRegionNames &&
              Array.isArray(backupRegionNames) &&
              backupRegionNames.length > 0 ? (
                backupRegionNames.map((region, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-gray-50 dark:bg-gray-800 text-xs py-0"
                  >
                    {region}
                  </Badge>
                ))
              ) : (
                <Badge
                  variant="outline"
                  className="bg-gray-50 dark:bg-gray-800 text-xs py-0"
                >
                  Não definidas
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
