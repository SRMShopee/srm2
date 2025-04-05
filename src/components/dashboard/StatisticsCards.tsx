import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Users,
  Upload,
  Calendar,
  Clock,
  Package as PackageIcon,
} from "lucide-react";

interface StatsData {
  totalDrivers: number;
  activeDrivers: number;
  totalRoutes: number;
  completedRoutes: number;
  pendingRoutes: number;
  totalPackages: number;
  spr?: number; // Stops Per Route - média de paradas por rota
}

interface DriversByPeriodData {
  AM: number;
  PM: number;
  OUROBOROS: number;
}

export const StatisticsOverviewCards = ({
  stats,
  loading,
}: {
  stats: StatsData;
  loading: boolean;
}) => {
  // Calculate SPR (Stops Per Route) if not provided
  const spr =
    stats.spr ||
    (stats.completedRoutes > 0
      ? (stats.totalPackages / stats.completedRoutes).toFixed(1)
      : 0);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="border-orange-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" />
            Entregadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold">
                {loading ? "..." : stats.totalDrivers}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ativos</p>
              <p className="text-2xl font-bold">
                {loading ? "..." : stats.activeDrivers}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5 text-orange-500" />
            Rotas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-2">
            <p className="text-sm text-gray-500 mb-1">Total do Dia</p>
            <p className="text-3xl font-bold text-orange-600">
              {loading ? "..." : stats.totalRoutes}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Entregadores</p>
              <p className="text-2xl font-bold">
                {loading ? "..." : stats.activeDrivers}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Rotas Não Atribuídas</p>
              <p className="text-2xl font-bold">
                {loading ? "..." : stats.pendingRoutes}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New cards for packages and SPR */}
      <Card className="border-orange-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <PackageIcon className="h-5 w-5 text-orange-500" />
            Pacotes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Total de pacotes transportados (média)
              </p>
              <p className="text-2xl font-bold">
                {loading ? "..." : stats.totalPackages || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">SPR (Paradas/Rota)</p>
              <p className="text-2xl font-bold text-orange-600">
                {loading ? "..." : spr}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const DriversByPeriodCard = ({
  driversByPeriod,
  loading,
}: {
  driversByPeriod: DriversByPeriodData;
  loading: boolean;
}) => {
  return (
    <Card className="border-orange-100 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          Entregadores por Período
        </CardTitle>
        <CardDescription>
          Distribuição de entregadores disponíveis por período em{" "}
          {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-blue-800">Período AM</h3>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-xs text-blue-600 mb-2">3:30 - 7:30</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-blue-800">
                {loading ? "..." : driversByPeriod.AM}
              </span>
              <span className="text-sm text-blue-600">entregadores</span>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-green-800">Período PM</h3>
              <Clock className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-green-600 mb-2">11:00 - 13:00</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-green-800">
                {loading ? "..." : driversByPeriod.PM}
              </span>
              <span className="text-sm text-green-600">entregadores</span>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-purple-800">Período OUROBOROS</h3>
              <Clock className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-xs text-purple-600 mb-2">15:00 - 17:00</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-purple-800">
                {loading ? "..." : driversByPeriod.OUROBOROS}
              </span>
              <span className="text-sm text-purple-600">entregadores</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
