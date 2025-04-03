"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { User, getCurrentUser } from "@/utils/auth";
import {
  AlertCircle,
  MapPin,
  Calendar,
  Route as RouteIcon,
  Info,
} from "lucide-react";
import DriverInfo from "./DriverInfo";
import DriverSchedule from "./DriverSchedule";
import DriverRoutes from "./DriverRoutes";

interface Route {
  id: string;
  status: "PENDENTE" | "ATRIBUÍDA" | "CONCLUÍDA";
  period: "AM" | "PM" | "OUROBOROS";
  description?: string;
}

interface DriverDashboardProps {
  user: User;
}

// Create a Supabase client for database operations only (not auth)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function DriverDashboard({
  user: propUser,
}: DriverDashboardProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inicio");
  const [user, setUser] = useState<User | null>(null);

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
    async function fetchRoutes() {
      if (!user?.hub_id) return;

      setLoading(true);
      try {
        // Fetch routes from Supabase
        const { data, error } = await supabase
          .from("routes")
          .select("*")
          .eq("hub_id", user.hub_id);

        if (error) {
          console.error("Error fetching routes:", error);
          return;
        }

        setRoutes((data as Route[]) || []);
      } catch (error) {
        console.error("Error fetching routes:", error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchRoutes();
    }

    // Listen for tab changes from navbar
    const handleTabChange = (e: CustomEvent) => {
      if (e.detail && e.detail.tab) {
        setActiveTab(e.detail.tab);
      }
    };

    window.addEventListener("tabChange" as any, handleTabChange);

    return () => {
      window.removeEventListener("tabChange" as any, handleTabChange);
    };
  }, [user]);

  // Function to render the active tab content
  const renderTabContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case "inicio":
        return (
          <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
            {/* Map Section */}
            <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-shopee-orange" />
                  Mapa do Hub
                </h2>
              </div>
              <div className="aspect-video bg-gray-100 flex items-center justify-center p-4">
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
            </section>

            {/* Route Status Section */}
            <section className="bg-white rounded-xl border shadow-sm">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-lg">Status da Rota</h2>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shopee-orange"></div>
                  </div>
                ) : routes.length > 0 ? (
                  <div className="space-y-4">
                    {routes.map((route) => (
                      <div key={route.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">
                              Rota #{route.id}
                            </span>
                            <p className="text-sm text-gray-500">
                              {route.description}
                            </p>
                          </div>
                          <div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                route.status === "PENDENTE"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : route.status === "ATRIBUÍDA"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {route.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                    <AlertCircle className="h-5 w-5" />
                    <p>Você não possui nenhuma rota programado no momento.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        );
      case "agenda":
        return <DriverSchedule user={user} />;
      case "rotas":
        return <DriverRoutes user={user} routes={routes} loading={loading} />;
      case "preferences":
        return <DriverInfo user={user} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-gray-50 min-h-screen pb-12">
      <div className="container mx-auto px-4 py-4 md:hidden">
        <div className="flex justify-between bg-white rounded-lg shadow-sm p-2">
          <button
            onClick={() => setActiveTab("inicio")}
            className={`flex flex-col items-center p-2 rounded ${activeTab === "inicio" ? "text-shopee-orange" : "text-gray-500"}`}
          >
            <MapPin className="h-5 w-5" />
            <span className="text-xs mt-1">Início</span>
          </button>
          <button
            onClick={() => setActiveTab("agenda")}
            className={`flex flex-col items-center p-2 rounded ${activeTab === "agenda" ? "text-shopee-orange" : "text-gray-500"}`}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-xs mt-1">Agenda</span>
          </button>
          <button
            onClick={() => setActiveTab("rotas")}
            className={`flex flex-col items-center p-2 rounded ${activeTab === "rotas" ? "text-shopee-orange" : "text-gray-500"}`}
          >
            <RouteIcon className="h-5 w-5" />
            <span className="text-xs mt-1">Rotas</span>
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`flex flex-col items-center p-2 rounded ${activeTab === "preferences" ? "text-shopee-orange" : "text-gray-500"}`}
          >
            <MapPin className="h-5 w-5" />
            <span className="text-xs mt-1">Preferências</span>
          </button>
        </div>
      </div>

      {renderTabContent()}
    </div>
  );
}
