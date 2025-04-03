"use client";

import Link from "next/link";
import { createClient } from "../../../supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import {
  UserCircle,
  Package,
  LogOut,
  MapPin,
  Calendar,
  Route,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("inicio");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function getUserInfo() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data } = await supabase
            .from("users")
            .select("name, full_name")
            .eq("id", user.id)
            .single();

          if (data) {
            setUserName(data.full_name || data.name || "Usuário");
          }
        } else {
          // Verificar localStorage para login simulado
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUserName(parsedUser.full_name || parsedUser.name || "Usuário");
          }
        }
      } catch (error) {
        console.error("Erro ao buscar informações do usuário:", error);
      }
    }

    getUserInfo();
  }, [supabase]);

  // Função para lidar com mudanças de aba
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Navegar para a página correspondente
    switch (tab) {
      case "inicio":
        router.push("/dashboard");
        break;
      case "agenda":
        router.push("/dashboard/schedule");
        break;
      case "rotas":
        router.push("/dashboard/routes");
        break;
      case "preferences":
        router.push("/dashboard/preferences");
        break;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user"); // Limpar usuário do localStorage
    router.push("/sign-in");
  };

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
            <Settings className="h-4 w-4 mr-2" />
            <span>Preferências</span>
          </Button>
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
                {userName}
              </div>
              <DropdownMenuItem
                onClick={handleLogout}
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
