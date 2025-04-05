"use client";

import { useState, useEffect, useRef } from "react";
import { User, getCurrentUser } from "@/utils/auth";
import { useTheme } from "next-themes";
import {
  AlertCircle,
  MapPin,
  Calendar,
  Route as RouteIcon,
  Settings,
  Sun,
  Moon,
  Truck,
  Package as PackageIcon,
  CheckCircle2,
  Bell,
  Clock,
  ArrowRight,
  Plus,
  ChevronRight,
  Layers,
  BarChart,
  X,
} from "lucide-react";
import DriverInfo from "./DriverInfo";
import DriverSchedule from "./DriverSchedule";
import DriverRoutes from "./DriverRoutes";
import CheckIn from "./CheckIn";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import RegionPreferences from "./preferences/RegionPreferences";
import RouteSchedule from "./routes/RouteSchedule";

interface Route {
  id: string;
  status: "PENDENTE" | "ATRIBUÍDA" | "CONCLUÍDA";
  period: "AM" | "PM" | "OUROBOROS";
  description?: string;
}

interface DriverDashboardProps {
  user: User;
}

export default function DriverDashboard({
  user: propUser,
}: DriverDashboardProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inicio");
  const [user, setUser] = useState<User | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hubInfo, setHubInfo] = useState<{ code: string; name: string } | null>(
    null,
  );
  const [notifications, setNotifications] = useState<
    { message: string; type: string; id: string; timestamp: number }[]
  >([
    {
      message: "Nova rota disponível para o período AM",
      type: "info",
      id: "1",
      timestamp: Date.now(),
    },
    {
      message: "Sua solicitação de rota foi aprovada",
      type: "success",
      id: "2",
      timestamp: Date.now(),
    },
  ]);
  const [stats, setStats] = useState({
    completedRoutes: 12,
    pendingRoutes: 3,
    totalPackages: 156,
  });
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  // Set mounted to true after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle clicks outside quick actions menu to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        quickActionsRef.current &&
        !quickActionsRef.current.contains(event.target as Node)
      ) {
        setQuickActionsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // If user is passed as prop, use it, otherwise get from local storage
    if (propUser) {
      setUser(propUser);
    } else {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    }
  }, [propUser]);

  useEffect(() => {
    async function fetchHubInfo() {
      if (!user?.hub_id) return;

      try {
        // Fetch hub information
        const response = await fetch(`/api/hubs/${user.hub_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Hub data fetched successfully:", data.hub);
          setHubInfo(data.hub);
        } else {
          console.error("Failed to fetch hub info, status:", response.status);
          // Fallback if API fails
          setHubInfo({
            code: "SINOSPLEX",
            name: "Sinosplex Logistics",
          });
        }
      } catch (error) {
        console.error("Error fetching hub info:", error);
        // Fallback if API fails
        setHubInfo({
          code: "SINOSPLEX",
          name: "Sinosplex Logistics",
        });
      }
    }

    if (user) {
      fetchHubInfo();
    }
  }, [user]);

  useEffect(() => {
    // Listen for tab changes from navbar
    const handleTabChange = (e: CustomEvent) => {
      if (e.detail && e.detail.tab) {
        console.log(`DriverDashboard received tab change: ${e.detail.tab}`);
        setActiveTab(e.detail.tab);
      }
    };

    window.addEventListener("tabChange", handleTabChange as EventListener);

    return () => {
      window.removeEventListener("tabChange", handleTabChange as EventListener);
    };
  }, []);

  useEffect(() => {
    async function fetchRoutes() {
      if (!user?.hub_id) return;

      setLoading(true);
      try {
        // Fetch routes from our database API
        const response = await fetch(`/api/routes?hub_id=${user.hub_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch routes");
        }

        const data = await response.json();
        setRoutes(data.routes || []);
      } catch (error) {
        console.error("Error fetching routes:", error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchRoutes();
    }
  }, [user]);

  const handleStartRoute = (routeId: string) => {
    // Update route status to in progress
    setRoutes(
      routes.map((route) =>
        route.id === routeId
          ? {
              ...route,
              status: "ATRIBUÍDA" as "PENDENTE" | "ATRIBUÍDA" | "CONCLUÍDA",
            }
          : route,
      ),
    );
  };

  const handleCompleteRoute = (routeId: string) => {
    // Update route status to completed
    setRoutes(
      routes.map((route) =>
        route.id === routeId
          ? {
              ...route,
              status: "CONCLUÍDA" as "PENDENTE" | "ATRIBUÍDA" | "CONCLUÍDA",
            }
          : route,
      ),
    );
    // Update stats
    setStats((prev) => ({
      ...prev,
      completedRoutes: prev.completedRoutes + 1,
      pendingRoutes: prev.pendingRoutes - 1,
    }));
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  };

  // Toggle quick actions menu
  const toggleQuickActions = () => {
    setQuickActionsOpen(!quickActionsOpen);
  };

  // Handle quick action selection
  const handleQuickAction = (tab: string) => {
    setActiveTab(tab);
    setQuickActionsOpen(false);
  };

  // Auto-dismiss notifications after 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setNotifications((prev) =>
        prev.filter((notification) => now - notification.timestamp < 15000),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Function to render the active tab content
  // Quick Actions Floating Button - extracted as a separate component for reuse
  const QuickActionsButton = () => (
    <div className="fixed bottom-6 left-6 z-40" ref={quickActionsRef}>
      <div className="relative">
        <button
          onClick={toggleQuickActions}
          className={`bg-orange-500 hover:bg-orange-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg ${quickActionsOpen ? "rotate-45" : ""}`}
          aria-label="Menu de ações rápidas"
        >
          {quickActionsOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Truck className="h-6 w-6" />
          )}
        </button>

        {quickActionsOpen && (
          <div className="absolute bottom-16 left-0 flex flex-col gap-3 animate-fadeIn">
            <button
              onClick={() => handleQuickAction("inicio")}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transform hover:scale-110"
              title="Menu Principal"
            >
              <MapPin className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleQuickAction("rotas")}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transform hover:scale-110"
              title="Ver rotas"
            >
              <RouteIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleQuickAction("agenda")}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transform hover:scale-110"
              title="Agenda"
            >
              <Calendar className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleQuickAction("preferences")}
              className="bg-purple-500 hover:bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transform hover:scale-110"
              title="Preferências"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleQuickAction("checkin")}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transform hover:scale-110"
              title="Check-in"
            >
              <CheckCircle2 className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case "inicio":
        return (
          <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
            {/* Notifications */}
            {notifications.length > 0 && (
              <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2 max-w-xs">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-2.5 rounded-lg shadow-lg flex items-center justify-between gap-2 animate-slide-up ${notification.type === "success" ? "bg-green-500 text-white" : "bg-blue-500 text-white"}`}
                  >
                    <div className="flex items-center gap-2">
                      {notification.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <Bell className="h-4 w-4 flex-shrink-0" />
                      )}
                      <p className="text-sm line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="text-white hover:text-gray-200 transition-colors flex-shrink-0"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions Floating Button */}
            <QuickActionsButton />

            {/* Welcome Card */}
            <Card className="border-orange-100 dark:border-orange-900 shadow-lg bg-white dark:bg-gray-800 overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full transform translate-x-16 -translate-y-16 opacity-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500 rounded-full transform -translate-x-12 translate-y-12 opacity-10"></div>

              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
                  <Truck className="h-6 w-6" />
                  Bem-vindo, {user.name || "Entregador"}!
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium uppercase tracking-wide text-sm">
                      Hub Atual
                    </p>
                    <p className="text-xl font-bold text-orange-500">
                      {hubInfo ? (
                        <>
                          <span className="drop-shadow-sm">
                            {hubInfo.code || "SINOSPLEX"}
                          </span>
                          {hubInfo.name && (
                            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 italic">
                              {hubInfo.name}
                            </span>
                          )}
                        </>
                      ) : (
                        "SINOSPLEX"
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>
                        Hoje:{" "}
                        {new Date().toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-orange-100 dark:border-orange-900 shadow-md bg-white dark:bg-gray-800 overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Rotas Concluídas
                      </p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400 drop-shadow-sm">
                        {stats.completedRoutes}
                      </p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <ArrowRight className="h-4 w-4 mr-1 text-green-500" />
                      <span>Bom trabalho!</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-100 dark:border-orange-900 shadow-md bg-white dark:bg-gray-800 overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Rotas Pendentes
                      </p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 drop-shadow-sm">
                        {stats.pendingRoutes}
                      </p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                      <RouteIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => setActiveTab("rotas")}
                      className="flex items-center text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <span>Ver rotas disponíveis</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-100 dark:border-orange-900 shadow-md bg-white dark:bg-gray-800 overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Total de Pacotes
                      </p>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 drop-shadow-sm">
                        {stats.totalPackages}
                      </p>
                    </div>
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                      <PackageIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <BarChart className="h-4 w-4 mr-1 text-purple-500" />
                      <span>Média: 13 pacotes/rota</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Map Section */}
            <Card className="border-orange-100 dark:border-orange-900 shadow-lg bg-white dark:bg-gray-800 overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
              <CardHeader className="pb-2 border-b dark:border-gray-700">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-transparent bg-clip-text">
                    Mapa do Hub
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent pointer-events-none"></div>
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&q=80')] bg-cover bg-center opacity-20"></div>
                  <div className="text-center relative z-10 w-full flex flex-col items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-orange-100 dark:border-orange-900 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 max-w-md">
                      <p className="text-gray-500 dark:text-gray-400 mb-2">
                        Mapa do Google Maps centralizado em
                      </p>
                      <p className="font-bold text-xl text-orange-500 mb-4">
                        {hubInfo ? hubInfo.code : "SINOSPLEX"}
                      </p>
                      <div className="flex justify-center">
                        <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors duration-300 flex items-center justify-center gap-2 transform hover:scale-105">
                          <MapPin className="h-4 w-4" />
                          Ver mapa completo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Route Status Section */}
            <Card className="border-orange-100 dark:border-orange-900 shadow-lg bg-white dark:bg-gray-800 overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
              <CardHeader className="pb-2 border-b dark:border-gray-700 flex flex-row justify-between items-center">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <RouteIcon className="h-5 w-5 text-orange-500" />
                  <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-transparent bg-clip-text">
                    Status da Rota
                  </span>
                </CardTitle>
                <Button
                  onClick={() => setActiveTab("rotas")}
                  variant="ghost"
                  className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30"
                >
                  Ver todas
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  </div>
                ) : routes.length > 0 ? (
                  <div className="space-y-4">
                    {routes.slice(0, 2).map((route) => (
                      <div
                        key={route.id}
                        className="p-4 border dark:border-gray-700 rounded-lg hover:border-orange-200 dark:hover:border-orange-800 transition-colors bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <span className="font-medium text-lg dark:text-white tracking-tight">
                              Rota #{route.id}
                            </span>
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                              {route.description ||
                                `Rota ${route.period} - ${hubInfo ? hubInfo.code : "SINOSPLEX"}`}
                            </p>
                          </div>
                          <Badge
                            className={`${route.status === "PENDENTE" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" : route.status === "ATRIBUÍDA" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"}`}
                          >
                            {route.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <PackageIcon className="h-4 w-4 text-orange-500" />
                            <span className="font-medium">
                              Período:{" "}
                              <span className="text-orange-500">
                                {route.period}
                              </span>
                            </span>
                          </div>
                          {route.status === "PENDENTE" ? (
                            <Button
                              onClick={() => handleStartRoute(route.id)}
                              className="bg-orange-500 hover:bg-orange-600 text-white transition-colors duration-300 transform hover:scale-105"
                              size="sm"
                            >
                              Iniciar Rota
                            </Button>
                          ) : route.status === "ATRIBUÍDA" ? (
                            <Button
                              onClick={() => handleCompleteRoute(route.id)}
                              className="bg-green-600 hover:bg-green-700 text-white transition-colors duration-300 transform hover:scale-105"
                              size="sm"
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Concluir
                            </Button>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Concluída
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {routes.length > 2 && (
                      <Button
                        onClick={() => setActiveTab("rotas")}
                        variant="outline"
                        className="w-full border-orange-200 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/30"
                      >
                        Ver mais {routes.length - 2} rotas
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-lg border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-5 w-5" />
                    <p>Você não possui nenhuma rota programada no momento.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      case "agenda":
        return (
          <div className="container mx-auto px-4 py-8">
            <Card className="border-orange-100 dark:border-orange-900 shadow-lg bg-white dark:bg-gray-800 overflow-hidden">
              <CardHeader className="pb-2 border-b dark:border-gray-700">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-transparent bg-clip-text">
                    Agenda de Disponibilidade
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <RouteSchedule userId={user.id} />
              </CardContent>
            </Card>
            <QuickActionsButton />
          </div>
        );
      case "rotas":
        return (
          <>
            <DriverRoutes user={user} />
            <QuickActionsButton />
          </>
        );
      case "preferences":
        return (
          <>
            <RegionPreferences user={user} />
            <QuickActionsButton />
          </>
        );
      case "checkin":
        return (
          <div className="container mx-auto px-4 py-8">
            <CheckIn user={user} />
            <QuickActionsButton />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-gray-50 dark:bg-gray-900 min-h-screen pb-12 transition-colors duration-200 pt-4">
      {renderTabContent()}
    </div>
  );
}
