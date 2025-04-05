"use client";

import { useState } from "react";
import { User } from "@/utils/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  BarChart,
  Users,
  Upload,
  Search,
  LogOut,
  FileSpreadsheet,
  CheckCircle,
  MapPin,
} from "lucide-react";
import CheckInManagement from "./CheckInManagement";
import RouteImport from "./RouteImport";
import {
  StatisticsOverviewCards,
  DriversByPeriodCard,
} from "./dashboard/StatisticsCards";
import RouteStoryboard from "./routes/RouteStoryboard";
import DriverInfo from "./DriverInfo";
import HubLocationMap from "./HubLocationMap";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

interface AdminDashboardProps {
  user: User;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Estado para filtros de motoristas
  const [driverFilter, setDriverFilter] = useState({
    vehicle: "all",
    region: "all",
    search: "",
    availability: "all",
  });

  // Use the custom hook to handle data fetching and state management
  const {
    stats,
    loading,
    routes,
    drivers,
    cities,
    driversByPeriod,
    handleRouteStatusChange,
    handleLoadingTimeChange,
    getCurrentFormattedDate,
  } = useAdminDashboard();

  // Inicializar o filtro de rota com a data atual
  const [routeFilter, setRouteFilter] = useState({
    date: getCurrentFormattedDate(),
    shift: "all",
    status: "all",
    search: "",
  });

  // Filter routes based on current filters
  const filteredRoutes = routes.filter((route) => {
    // Date filter
    if (
      routeFilter.date &&
      routeFilter.date !== "all" &&
      route.date !== routeFilter.date
    ) {
      return false;
    }

    // Shift filter
    if (routeFilter.shift !== "all" && route.shift !== routeFilter.shift) {
      return false;
    }

    // Status filter
    if (
      routeFilter.status !== "all" &&
      route.status !== routeFilter.status &&
      // Handle case where status might be undefined
      !(routeFilter.status === "pending" && !route.status)
    ) {
      return false;
    }

    // Search filter (search in file_name, city, or neighborhoods)
    if (routeFilter.search) {
      const searchLower = routeFilter.search.toLowerCase();
      const fileNameMatch = route.file_name.toLowerCase().includes(searchLower);
      const cityMatch = route.city.toLowerCase().includes(searchLower);
      const neighborhoodsMatch = route.neighborhoods.some((neighborhood) =>
        neighborhood.toLowerCase().includes(searchLower),
      );

      if (!fileNameMatch && !cityMatch && !neighborhoodsMatch) {
        return false;
      }
    }

    return true;
  });

  // Filter drivers based on current filters
  const filteredDrivers = drivers.filter((driver) => {
    // Vehicle filter
    if (
      driverFilter.vehicle !== "all" &&
      driver.vehicle !== driverFilter.vehicle
    ) {
      return false;
    }

    // Region filter
    if (driverFilter.region !== "all") {
      const regionId = parseInt(driverFilter.region);
      const isPrimaryRegion = driver.primary_region === regionId;
      const isBackupRegion = driver.backup_regions?.includes(regionId);

      if (!isPrimaryRegion && !isBackupRegion) {
        return false;
      }
    }

    // Availability filter
    if (driverFilter.availability !== "all") {
      const isAvailable = driverFilter.availability === "available";
      if (driver.is_available !== isAvailable) {
        return false;
      }
    }

    // Search filter (search in name or driver_id)
    if (driverFilter.search) {
      const searchLower = driverFilter.search.toLowerCase();
      const nameMatch = driver.name.toLowerCase().includes(searchLower);
      const driverIdMatch = driver.driver_id
        .toLowerCase()
        .includes(searchLower);

      if (!nameMatch && !driverIdMatch) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Painel Administrativo
        </h1>
        <div className="flex gap-2">
          <RouteImport user={user} />
          <Button
            variant="outline"
            className="flex items-center gap-2 border-red-200 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
            onClick={() => {
              // Redirecionar para a página de sign-in
              window.location.href = "/sign-in";
            }}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="overview" className="text-base py-3">
            <BarChart className="mr-2 h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="drivers" className="text-base py-3">
            <Users className="mr-2 h-4 w-4" />
            Entregadores
          </TabsTrigger>
          <TabsTrigger value="routes" className="text-base py-3">
            <Upload className="mr-2 h-4 w-4" />
            Rotas
          </TabsTrigger>
          <TabsTrigger value="checkins" className="text-base py-3">
            <CheckCircle className="mr-2 h-4 w-4" />
            Check-ins
          </TabsTrigger>
          <TabsTrigger value="location" className="text-base py-3">
            <MapPin className="mr-2 h-4 w-4" />
            Localização
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <StatisticsOverviewCards stats={stats} loading={loading} />

          {/* Drivers by Period */}
          <DriversByPeriodCard
            driversByPeriod={driversByPeriod}
            loading={loading}
          />

          {/* Route History Section */}
          <Card className="border-orange-100 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-orange-500" />
                Histórico de Rotas
              </CardTitle>
              <CardDescription>
                Últimas rotas importadas e seus status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Data
                  </label>
                  <Input
                    type="date"
                    value={routeFilter.date}
                    onChange={(e) =>
                      setRouteFilter({
                        ...routeFilter,
                        date: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Turno
                  </label>
                  <Select
                    value={routeFilter.shift}
                    onValueChange={(value) =>
                      setRouteFilter({ ...routeFilter, shift: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os turnos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os turnos</SelectItem>
                      <SelectItem value="AM">AM (3:30 - 7:30)</SelectItem>
                      <SelectItem value="PM">PM (11:00 - 13:30)</SelectItem>
                      <SelectItem value="OUROBOROS">
                        OUROBOROS (15:00 - 17:30)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <Select
                    value={routeFilter.status}
                    onValueChange={(value) =>
                      setRouteFilter({ ...routeFilter, status: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovada</SelectItem>
                      <SelectItem value="rejected">Rejeitada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Buscar por nome, cidade..."
                      value={routeFilter.search}
                      onChange={(e) =>
                        setRouteFilter({
                          ...routeFilter,
                          search: e.target.value,
                        })
                      }
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
              ) : filteredRoutes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRoutes.map((route) => (
                    <RouteStoryboard
                      key={route.id}
                      route={route}
                      onStatusChange={handleRouteStatusChange}
                      onLoadingTimeChange={handleLoadingTimeChange}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-full mb-4">
                    <FileSpreadsheet className="h-12 w-12 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 dark:text-white">
                    Nenhuma rota encontrada
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    Não foram encontradas rotas com os filtros selecionados.
                    Tente ajustar os filtros ou importar novas rotas.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs remain the same */}
        <TabsContent value="drivers" className="space-y-6">
          <Card className="border-orange-100 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                Entregadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Tipo de Veículo
                  </label>
                  <Select
                    value={driverFilter.vehicle}
                    onValueChange={(value) =>
                      setDriverFilter({ ...driverFilter, vehicle: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os veículos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os veículos</SelectItem>
                      <SelectItem value="PASSEIO">Passeio</SelectItem>
                      <SelectItem value="UTILITARIO">Utilitário</SelectItem>
                      <SelectItem value="VAN">Van</SelectItem>
                      <SelectItem value="VUC">VUC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Região
                  </label>
                  <Select
                    value={driverFilter.region}
                    onValueChange={(value) =>
                      setDriverFilter({ ...driverFilter, region: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todas as regiões" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      <SelectItem
                        value="all"
                        className="font-medium text-orange-600"
                      >
                        Todas as regiões
                      </SelectItem>
                      <div className="py-1 px-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800">
                        Cidades disponíveis
                      </div>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id.toString()}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Disponível
                  </label>
                  <Select
                    value={driverFilter.availability}
                    onValueChange={(value) =>
                      setDriverFilter({ ...driverFilter, availability: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="available">Disponível</SelectItem>
                      <SelectItem value="unavailable">Indisponível</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Buscar por nome, ID..."
                      value={driverFilter.search}
                      onChange={(e) =>
                        setDriverFilter({
                          ...driverFilter,
                          search: e.target.value,
                        })
                      }
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
              ) : filteredDrivers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDrivers.map((driver) => (
                    <DriverInfo
                      key={driver.id}
                      driver={driver}
                      cities={cities}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-full mb-4">
                    <Users className="h-12 w-12 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 dark:text-white">
                    Nenhum entregador encontrado
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    Não foram encontrados entregadores com os filtros
                    selecionados. Tente ajustar os filtros.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="space-y-6">
          <div className="flex justify-end mb-4">
            <RouteImport user={user} />
          </div>

          <Card className="border-orange-100 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-orange-500" />
                Gerenciamento de Rotas
              </CardTitle>
              <CardDescription>
                Importação e atribuição de rotas para entregadores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Reusing the same filter controls from the overview tab */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Data
                  </label>
                  <Input
                    type="date"
                    value={routeFilter.date}
                    onChange={(e) =>
                      setRouteFilter({
                        ...routeFilter,
                        date: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Turno
                  </label>
                  <Select
                    value={routeFilter.shift}
                    onValueChange={(value) =>
                      setRouteFilter({ ...routeFilter, shift: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os turnos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os turnos</SelectItem>
                      <SelectItem value="AM">AM (3:30 - 7:30)</SelectItem>
                      <SelectItem value="PM">PM (11:00 - 13:30)</SelectItem>
                      <SelectItem value="OUROBOROS">
                        OUROBOROS (15:00 - 17:30)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <Select
                    value={routeFilter.status}
                    onValueChange={(value) =>
                      setRouteFilter({ ...routeFilter, status: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovada</SelectItem>
                      <SelectItem value="rejected">Rejeitada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Buscar por nome, cidade..."
                      value={routeFilter.search}
                      onChange={(e) =>
                        setRouteFilter({
                          ...routeFilter,
                          search: e.target.value,
                        })
                      }
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
              ) : filteredRoutes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRoutes.map((route) => (
                    <RouteStoryboard
                      key={route.id}
                      route={route}
                      onStatusChange={handleRouteStatusChange}
                      onLoadingTimeChange={handleLoadingTimeChange}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-full mb-4">
                    <FileSpreadsheet className="h-12 w-12 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 dark:text-white">
                    Nenhuma rota encontrada
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    Não foram encontradas rotas com os filtros selecionados.
                    Tente ajustar os filtros ou importar novas rotas.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkins" className="space-y-6">
          <CheckInManagement />
        </TabsContent>

        <TabsContent value="location" className="space-y-6">
          <Card className="border-orange-100 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-500" />
                Configuração de Localização do Hub
              </CardTitle>
              <CardDescription>
                Configure a localização do hub e o raio permitido para check-in
                dos entregadores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HubLocationMap
                hubId={user.hub_id}
                onLocationSaved={() => {
                  // Refresh data if needed
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
