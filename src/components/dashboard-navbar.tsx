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
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  UserCircle,
  LogOut,
  MapPin,
  Calendar,
  Route,
  Settings,
  Sun,
  Moon,
  Truck,
  Menu,
  X,
} from "lucide-react";

export default function DashboardNavbar() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("inicio");
  const [user, setUser] = useState<any>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Set mounted to true after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll events to show/hide navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setNavbarVisible(false);
      } else {
        setNavbarVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    // Get the current user from the session
    const currentUser = getCurrentUser();
    setUser(currentUser);

    // Check URL to set active tab on initial load
    const path = window.location.pathname;
    if (path.includes("/dashboard/admin")) {
      setActiveTab("admin");
    } else if (path.includes("/dashboard/schedule")) {
      setActiveTab("agenda");
    } else if (path.includes("/dashboard/routes")) {
      setActiveTab("rotas");
    } else if (path.includes("/dashboard/preferences")) {
      setActiveTab("preferences");
    } else {
      setActiveTab("inicio");
    }

    // Listen for tab changes from other components
    const handleExternalTabChange = (e: CustomEvent) => {
      if (e.detail && e.detail.tab) {
        setActiveTab(e.detail.tab);
      }
    };

    window.addEventListener(
      "tabChange",
      handleExternalTabChange as EventListener,
    );
    return () => {
      window.removeEventListener(
        "tabChange",
        handleExternalTabChange as EventListener,
      );
    };
  }, []);

  // Function to handle tab changes without page navigation
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false); // Close mobile menu when tab changes

    try {
      // Dispatch custom event to notify DriverDashboard
      const event = new CustomEvent("tabChange", { detail: { tab } });
      window.dispatchEvent(event);

      // Force re-render by triggering a state change in parent components
      const customEvent = new Event("stateChange");
      window.dispatchEvent(customEvent);

      // Scroll to top of page for better user experience
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Update URL without full navigation
      if (tab === "inicio") {
        router.push("/dashboard");
      } else if (tab === "agenda") {
        router.push("/dashboard/schedule");
      } else if (tab === "rotas") {
        router.push("/dashboard/routes");
      } else if (tab === "preferences") {
        router.push("/dashboard/preferences");
      } else if (tab === "admin") {
        router.push("/dashboard/admin");
      }

      console.log(`Tab changed to: ${tab}`);
    } catch (error) {
      console.error("Error handling tab change:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      // Call the logout API endpoint
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      // Clear local storage
      signOut();

      // Redirect to sign-in page
      router.push("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isAdmin = user?.permissions === "admin";

  return (
    <nav
      className={`w-full fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navbarVisible ? "translate-y-0" : "-translate-y-full"} backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-b border-orange-200/50 dark:border-orange-900/30 shadow-lg`}
    >
      <div className="container mx-auto px-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex justify-between items-center h-16">
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              prefetch
              className="text-xl font-bold text-orange-500 flex items-center gap-2 mr-6 relative group"
              onClick={(e) => {
                e.preventDefault();
                handleTabChange("inicio");
              }}
            >
              <div className="absolute -inset-2 bg-orange-100 dark:bg-orange-900/30 rounded-full scale-0 group-hover:scale-100 transition-all duration-300 -z-10"></div>
              <Truck className="h-6 w-6 text-orange-500" />
              <span className="group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                SRM
              </span>
            </Link>

            <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-gray-800/80 rounded-full p-1 shadow-md dark:shadow-gray-900/50">
              {[
                {
                  id: "inicio",
                  label: "Início",
                  icon: <MapPin className="h-4 w-4" />,
                },
                {
                  id: "agenda",
                  label: "Agenda",
                  icon: <Calendar className="h-4 w-4" />,
                },
                {
                  id: "rotas",
                  label: "Rotas",
                  icon: <Route className="h-4 w-4" />,
                },
                {
                  id: "preferences",
                  label: "Preferências",
                  icon: <Settings className="h-4 w-4" />,
                },
                ...(isAdmin
                  ? [
                      {
                        id: "admin",
                        label: "Admin",
                        icon: <Settings className="h-4 w-4" />,
                      },
                    ]
                  : []),
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${activeTab === item.id ? "text-white font-medium" : "text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400"}`}
                >
                  {activeTab === item.id && (
                    <span className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-full animate-fadeIn shadow-inner"></span>
                  )}
                  <span className="relative flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 items-center">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="relative p-2 overflow-hidden rounded-full group"
                aria-label={
                  theme === "dark"
                    ? "Mudar para modo claro"
                    : "Mudar para modo escuro"
                }
              >
                <span className="absolute inset-0 bg-orange-100 dark:bg-orange-900/30 scale-0 group-hover:scale-100 transition-all duration-300 rounded-full"></span>
                <span className="relative block">
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5 text-orange-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-orange-500" />
                  )}
                </span>
              </button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="relative p-2 overflow-hidden rounded-full group"
                  aria-label="Menu do usuário"
                >
                  <span className="absolute inset-0 bg-orange-100 dark:bg-orange-900/30 scale-0 group-hover:scale-100 transition-all duration-300 rounded-full"></span>
                  <span className="relative block">
                    <UserCircle className="h-6 w-6 text-orange-500" />
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 p-2 bg-white dark:bg-gray-800 border-orange-200 dark:border-orange-900 rounded-xl shadow-xl animate-fadeIn"
              >
                <div className="px-3 py-2 text-sm font-medium text-orange-500 border-b border-orange-200 dark:border-orange-900 mb-1">
                  {user?.name || "Perfil do Entregador"}
                </div>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer rounded-md px-3 py-2 transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden justify-between items-center h-16">
          <Link
            href="/dashboard"
            prefetch
            className="text-xl font-bold text-orange-500 flex items-center gap-2"
            onClick={(e) => {
              e.preventDefault();
              handleTabChange("inicio");
            }}
          >
            <Truck className="h-6 w-6 text-orange-500" />
            <span>SRM</span>
          </Link>

          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-full"
                aria-label={
                  theme === "dark"
                    ? "Mudar para modo claro"
                    : "Mudar para modo escuro"
                }
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 text-orange-500" />
                ) : (
                  <Moon className="h-5 w-5 text-orange-500" />
                )}
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-orange-500 rounded-full"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="container mx-auto px-4 py-4 space-y-2 bg-white dark:bg-gray-900 border-t border-orange-200/50 dark:border-orange-900/30">
          {[
            {
              id: "inicio",
              label: "Início",
              icon: <MapPin className="h-5 w-5" />,
            },
            {
              id: "agenda",
              label: "Agenda",
              icon: <Calendar className="h-5 w-5" />,
            },
            {
              id: "rotas",
              label: "Rotas",
              icon: <Route className="h-5 w-5" />,
            },
            {
              id: "preferences",
              label: "Preferências",
              icon: <Settings className="h-5 w-5" />,
            },
            ...(isAdmin
              ? [
                  {
                    id: "admin",
                    label: "Admin",
                    icon: <Settings className="h-5 w-5" />,
                  },
                ]
              : []),
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}
