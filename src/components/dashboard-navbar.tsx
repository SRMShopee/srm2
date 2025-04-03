"use client";

import Link from "next/link";
import { getCurrentUser, signOut } from "@/utils/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// Dynamically import icons to prevent hydration mismatch
const UserCircle = dynamic(
  () => import("lucide-react").then((mod) => mod.UserCircle),
  { ssr: false },
);
const Package = dynamic(
  () => import("lucide-react").then((mod) => mod.Package),
  { ssr: false },
);
const LogOut = dynamic(() => import("lucide-react").then((mod) => mod.LogOut), {
  ssr: false,
});
const MapPin = dynamic(() => import("lucide-react").then((mod) => mod.MapPin), {
  ssr: false,
});
const Calendar = dynamic(
  () => import("lucide-react").then((mod) => mod.Calendar),
  { ssr: false },
);
const Route = dynamic(() => import("lucide-react").then((mod) => mod.Route), {
  ssr: false,
});
const Info = dynamic(() => import("lucide-react").then((mod) => mod.Info), {
  ssr: false,
});

export default function DashboardNavbar() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("inicio");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get the current user from the session
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  // Function to handle tab changes and dispatch custom event
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Dispatch custom event to notify DriverDashboard
    const event = new CustomEvent("tabChange", { detail: { tab } });
    window.dispatchEvent(event);
  };

  const handleSignOut = () => {
    signOut();
    router.push("/sign-in");
  };

  const isAdmin = user?.permissions === "admin";

  return (
    <nav className="w-full border-b border-orange-200 bg-white py-4 sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-1 md:gap-4">
          <Link
            href="/dashboard"
            prefetch
            className="text-xl font-bold text-shopee-orange flex items-center gap-2 mr-4"
          >
            <Package className="h-6 w-6 text-shopee-orange" />
            <span className="hidden md:inline">Shopee Delivery</span>
          </Link>

          <Button
            variant={activeTab === "inicio" ? "default" : "ghost"}
            onClick={() => handleTabChange("inicio")}
            className={
              activeTab === "inicio"
                ? "bg-shopee-orange text-white"
                : "text-gray-600 hover:text-shopee-orange"
            }
          >
            <MapPin className="h-4 w-4 mr-2" />
            <span>Início</span>
          </Button>

          <Button
            variant={activeTab === "agenda" ? "default" : "ghost"}
            onClick={() => handleTabChange("agenda")}
            className={
              activeTab === "agenda"
                ? "bg-shopee-orange text-white"
                : "text-gray-600 hover:text-shopee-orange"
            }
          >
            <Calendar className="h-4 w-4 mr-2" />
            <span>Agenda</span>
          </Button>

          <Button
            variant={activeTab === "rotas" ? "default" : "ghost"}
            onClick={() => handleTabChange("rotas")}
            className={
              activeTab === "rotas"
                ? "bg-shopee-orange text-white"
                : "text-gray-600 hover:text-shopee-orange"
            }
          >
            <Route className="h-4 w-4 mr-2" />
            <span>Rotas</span>
          </Button>

          <Button
            variant={activeTab === "preferences" ? "default" : "ghost"}
            onClick={() => handleTabChange("preferences")}
            className={
              activeTab === "preferences"
                ? "bg-shopee-orange text-white"
                : "text-gray-600 hover:text-shopee-orange"
            }
          >
            <MapPin className="h-4 w-4 mr-2" />
            <span>Preferências</span>
          </Button>

          {isAdmin && (
            <Button
              variant={activeTab === "admin" ? "default" : "ghost"}
              onClick={() => handleTabChange("admin")}
              className={
                activeTab === "admin"
                  ? "bg-shopee-orange text-white"
                  : "text-gray-600 hover:text-shopee-orange"
              }
            >
              <Info className="h-4 w-4 mr-2" />
              <span>Admin</span>
            </Button>
          )}
        </div>

        <div className="flex gap-4 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-shopee-orange hover:text-orange-600 hover:bg-orange-50 rounded-full h-10 w-10"
              >
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2">
              <div className="px-2 py-1.5 text-sm font-medium text-shopee-orange border-b mb-1">
                {user?.name || "Perfil do Entregador"}
              </div>
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer rounded-md px-2 py-1.5"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
