"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { User } from "@/utils/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  BarChart,
  Users,
  Upload,
  Calendar,
  MapPin,
  Route,
  Clock,
} from "lucide-react";

interface AdminDashboardProps {
  user: User;
}

// Create a Supabase client for database operations only (not auth)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalDrivers: 0,
    activeDrivers: 0,
    totalRoutes: 0,
    completedRoutes: 0,
    pendingRoutes: 0,
  });
  const [loading, setLoading] = useState(true);

  // Mock data for active drivers by period
  const driversByPeriod = {
    AM: 18,
    PM: 22,
    OUROBOROS: 15,
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch total drivers
        const { count: driversCount, error: driversError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });

        if (driversError) {
          console.error("Error fetching drivers count:", driversError);
        }

        // Fetch total routes
        const { count: routesCount, error: routesError } = await supabase
          .from("routes")
          .select("*", { count: "exact", head: true });

        if (routesError) {
          console.error("Error fetching routes count:", routesError);
        }

        // Fetch completed routes
        const { count: completedCount, error: completedError } = await supabase
          .from("routes")
          .select("*", { count: "exact", head: true })
          .eq("status", "accepted");

        if (completedError) {
          console.error(
            "Error fetching completed routes count:",
            completedError,
          );
        }

        // Fetch pending routes
        const { count: pendingCount, error: pendingError } = await supabase
          .from("routes")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        if (pendingError) {
          console.error("Error fetching pending routes count:", pendingError);
        }

        setStats({
          totalDrivers: driversCount || 0,
          activeDrivers: driversCount || 0, // For now, assume all drivers are active
          totalRoutes: routesCount || 0,
          completedRoutes: completedCount || 0,
          pendingRoutes: pendingCount || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Painel Administrativo
        </h1>
        <div className="flex gap-2">
          <Button className="bg-shopee-orange hover:bg-orange-600 text-white">
            <Upload className="mr-2 h-4 w-4" />
            Importar Rotas
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="overview" className="text-base py-3">
            <BarChart className="mr-2 h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="drivers" className="text-base py-3">
            <Users className="mr-2 h-4 w-4" />
            Entregadores
          </TabsTrigger>
          <TabsTrigger value="routes" className="text-base py-3">
            <Route className="mr-2 h-4 w-4" />
            Rotas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-orange-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-shopee-orange" />
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
                  <Route className="h-5 w-5 text-shopee-orange" />
                  Rotas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold">
                      {loading ? "..." : stats.totalRoutes}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Concluídas</p>
                    <p className="text-2xl font-bold">
                      {loading ? "..." : stats.completedRoutes}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-shopee-orange" />
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
                    <p className="text-sm text-gray-500">Rotas Pendentes</p>
                    <p className="text-2xl font-bold">
                      {loading ? "..." : stats.pendingRoutes}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rest of the component remains the same */}
          {/* Drivers by Period */}
          <Card className="border-orange-100 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-shopee-orange" />
                Entregadores por Período
              </CardTitle>
              <CardDescription>
                Distribuição de entregadores disponíveis por período
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
                      {driversByPeriod.AM}
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
                      {driversByPeriod.PM}
                    </span>
                    <span className="text-sm text-green-600">entregadores</span>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-purple-800">
                      Período OUROBOROS
                    </h3>
                    <Clock className="h-4 w-4 text-purple-500" />
                  </div>
                  <p className="text-xs text-purple-600 mb-2">15:00 - 17:00</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-purple-800">
                      {driversByPeriod.OUROBOROS}
                    </span>
                    <span className="text-sm text-purple-600">
                      entregadores
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map Overview */}
          <Card className="border-orange-100 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-shopee-orange" />
                Mapa de Rotas
              </CardTitle>
              <CardDescription>
                Visão geral das rotas ativas no momento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-100 flex items-center justify-center p-4 rounded-lg">
                <div className="text-center">
                  <div className="bg-white p-6 rounded-lg shadow-sm inline-block">
                    <p className="text-gray-500 mb-2">
                      Mapa do Google Maps centralizado em
                    </p>
                    <p className="font-bold text-xl text-shopee-orange">
                      SINOSPLEX
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs remain the same */}
        <TabsContent value="drivers" className="space-y-6">
          <Card className="border-orange-100 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-shopee-orange" />
                Lista de Entregadores
              </CardTitle>
              <CardDescription>
                Gerenciamento de entregadores cadastrados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="bg-gray-50 p-4 border-b">
                  <div className="grid grid-cols-5 font-medium text-sm text-gray-600">
                    <div>Driver ID</div>
                    <div>Nome</div>
                    <div>Veículo</div>
                    <div>Região Principal</div>
                    <div>Status</div>
                  </div>
                </div>
                <div className="divide-y">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 hover:bg-gray-50">
                      <div className="grid grid-cols-5">
                        <div className="font-medium">DRIVER{i + 100}</div>
                        <div>Entregador {i + 1}</div>
                        <div>Moto</div>
                        <div>NOVO HAMBURGO</div>
                        <div>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Ativo
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="space-y-6">
          <Card className="border-orange-100 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5 text-shopee-orange" />
                Gerenciamento de Rotas
              </CardTitle>
              <CardDescription>
                Importação e atribuição de rotas para entregadores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-lg">
                <h3 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Importar Rotas
                </h3>
                <p className="text-sm text-orange-700 mb-4">
                  Faça upload de um arquivo CSV ou Excel com as rotas a serem
                  importadas para o sistema.
                </p>
                <div className="flex gap-2">
                  <Button className="bg-shopee-orange hover:bg-orange-600 text-white">
                    Selecionar Arquivo
                  </Button>
                  <Button variant="outline" className="border-orange-200">
                    Baixar Modelo
                  </Button>
                </div>
              </div>

              <div className="rounded-md border">
                <div className="bg-gray-50 p-4 border-b">
                  <div className="grid grid-cols-5 font-medium text-sm text-gray-600">
                    <div>ID</div>
                    <div>Região</div>
                    <div>Período</div>
                    <div>Pacotes</div>
                    <div>Status</div>
                  </div>
                </div>
                <div className="divide-y">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 hover:bg-gray-50">
                      <div className="grid grid-cols-5">
                        <div className="font-medium">R00{i + 1}</div>
                        <div>NOVO HAMBURGO</div>
                        <div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              i % 3 === 0
                                ? "bg-blue-100 text-blue-800"
                                : i % 3 === 1
                                  ? "bg-green-100 text-green-800"
                                  : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {i % 3 === 0
                              ? "AM"
                              : i % 3 === 1
                                ? "PM"
                                : "OUROBOROS"}
                          </span>
                        </div>
                        <div>{10 + i * 2}</div>
                        <div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              i % 2 === 0
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {i % 2 === 0 ? "PENDENTE" : "ATRIBUÍDA"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
