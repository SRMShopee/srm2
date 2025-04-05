import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";

// Create a Supabase client for database operations only (not auth)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

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

interface City {
  id: number;
  name: string;
  hub_id: string;
}

interface Stats {
  totalDrivers: number;
  activeDrivers: number;
  totalRoutes: number;
  completedRoutes: number;
  pendingRoutes: number;
  totalPackages: number;
  spr: number;
}

interface DriversByPeriod {
  AM: number;
  PM: number;
  OUROBOROS: number;
}

export function useAdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalDrivers: 0,
    activeDrivers: 0,
    totalRoutes: 0,
    completedRoutes: 0,
    pendingRoutes: 0,
    totalPackages: 0,
    spr: 0,
  });
  const [loading, setLoading] = useState(true);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [driversLoading, setDriversLoading] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [driversByPeriod, setDriversByPeriod] = useState<DriversByPeriod>({
    AM: 0,
    PM: 0,
    OUROBOROS: 0,
  });
  const [adminHubId, setAdminHubId] = useState<string | null>(null);

  // Função para formatar a data atual
  const getCurrentFormattedDate = () => {
    return format(new Date(), "yyyy-MM-dd");
  };

  // Função para obter o hub_id do administrador
  const getAdminHubId = async () => {
    try {
      // Se já temos o hub_id no estado, retorna ele
      if (adminHubId) {
        return adminHubId;
      }

      // Tenta obter o hub_id do usuário logado através da API
      try {
        const response = await fetch("/api/user", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData && userData.hub_id) {
            setAdminHubId(userData.hub_id);
            return userData.hub_id;
          }
        }
      } catch (apiError) {
        console.error("Erro ao chamar API de usuário:", apiError);
      }

      // Fallback para localStorage se a API falhar
      try {
        const storedHubId = localStorage.getItem("hub_id");
        if (storedHubId) {
          setAdminHubId(storedHubId);
          return storedHubId;
        }
      } catch (storageError) {
        console.error("Erro ao acessar localStorage:", storageError);
      }

      console.error("Não foi possível obter o hub_id do administrador");
      return null;
    } catch (error) {
      console.error("Erro ao obter hub_id:", error);
      return null;
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get the admin's hub_id
      const hubId = await getAdminHubId();
      if (!hubId) {
        console.error(
          "Hub ID não encontrado. Não é possível carregar os dados.",
        );
        setLoading(false);
        return;
      }

      // Fetch cities first
      const { data: citiesData, error: citiesError } = await supabase
        .from("cities")
        .select("*")
        .eq("hub_id", hubId)
        .order("name", { ascending: true });

      if (citiesError) throw citiesError;
      setCities(citiesData || []);

      // Fetch total drivers (excluding admin users)
      const { count: driversCount, error: driversError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("hub_id", hubId)
        .neq("permissions", "admin");

      if (driversError) {
        console.error("Error fetching drivers count:", driversError);
      }

      // Fetch total routes
      const { count: routesCount, error: routesError } = await supabase
        .from("routes")
        .select("*", { count: "exact", head: true })
        .eq("hub_id", hubId);

      if (routesError) {
        console.error("Error fetching routes count:", routesError);
      }

      // Fetch completed routes
      const { count: completedCount, error: completedError } = await supabase
        .from("routes")
        .select("*", { count: "exact", head: true })
        .eq("hub_id", hubId)
        .eq("status", "accepted");

      if (completedError) {
        console.error("Error fetching completed routes count:", completedError);
      }

      // Fetch total packages from completed routes
      const { data: completedRoutesData, error: packagesError } = await supabase
        .from("routes")
        .select("neighborhoods")
        .eq("hub_id", hubId)
        .eq("status", "accepted");

      if (packagesError) {
        console.error("Error fetching packages count:", packagesError);
      }

      // Calculate total packages (each neighborhood represents a stop/package)
      const totalPackages =
        completedRoutesData?.reduce((total, route) => {
          return total + (route.neighborhoods?.length || 0);
        }, 0) || 0;

      // Calculate SPR (Stops Per Route)
      const spr =
        completedCount > 0
          ? Number((totalPackages / completedCount).toFixed(1))
          : 0;

      // Fetch pending routes
      const { count: pendingCount, error: pendingError } = await supabase
        .from("routes")
        .select("*", { count: "exact", head: true })
        .eq("hub_id", hubId)
        .eq("status", "pending");

      if (pendingError) {
        console.error("Error fetching pending routes count:", pendingError);
      }

      // Fetch drivers by period for the current date
      const todayDate = getCurrentFormattedDate();

      const { data: amDrivers, error: amError } = await supabase
        .from("disp")
        .select("*", { count: "exact" })
        .eq("hub_id", hubId)
        .eq("turno", "AM")
        .eq("disp", true)
        .gte("created_at", `${todayDate}T00:00:00`)
        .lt("created_at", `${todayDate}T23:59:59`);

      const { data: pmDrivers, error: pmError } = await supabase
        .from("disp")
        .select("*", { count: "exact" })
        .eq("hub_id", hubId)
        .eq("turno", "PM")
        .eq("disp", true)
        .gte("created_at", `${todayDate}T00:00:00`)
        .lt("created_at", `${todayDate}T23:59:59`);

      const { data: ouroborosDrivers, error: ouroborosError } = await supabase
        .from("disp")
        .select("*", { count: "exact" })
        .eq("hub_id", hubId)
        .eq("turno", "OUROBOROS")
        .eq("disp", true)
        .gte("created_at", `${todayDate}T00:00:00`)
        .lt("created_at", `${todayDate}T23:59:59`);

      if (amError || pmError || ouroborosError) {
        console.error("Error fetching drivers by period:", {
          amError,
          pmError,
          ouroborosError,
        });
      }

      setDriversByPeriod({
        AM: amDrivers?.length || 0,
        PM: pmDrivers?.length || 0,
        OUROBOROS: ouroborosDrivers?.length || 0,
      });

      setStats({
        totalDrivers: driversCount || 0,
        activeDrivers: driversCount || 0, // For now, assume all drivers are active
        totalRoutes: routesCount || 0,
        completedRoutes: completedCount || 0,
        pendingRoutes: pendingCount || 0,
        totalPackages: totalPackages,
        spr: spr,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar apenas as rotas
  const fetchRoutes = async () => {
    try {
      setRoutesLoading(true);

      // Get the admin's hub_id
      const hubId = adminHubId || (await getAdminHubId());
      if (!hubId) {
        console.error(
          "Hub ID não encontrado. Não é possível carregar as rotas.",
        );
        setRoutesLoading(false);
        return;
      }

      // Fetch routes
      const { data: routesData, error: routesDataError } = await supabase
        .from("routes")
        .select("*")
        .eq("hub_id", hubId)
        .order("created_at", { ascending: false });

      if (routesDataError) throw routesDataError;

      // Transform route data to match the expected format
      const transformedRoutes = (routesData || []).map((route) => {
        return {
          id: route.id,
          file_name: route.name,
          city: route.city_id
            ? cities.find((c) => c.id === route.city_id)?.name || "Unknown"
            : "Unknown",
          neighborhoods: route.neighborhoods
            ? route.neighborhoods.split(", ")
            : [],
          total_distance: parseFloat(route.distance),
          sequence: route.packages,
          shift: route.shift,
          date: route.created_at
            ? new Date(route.created_at).toISOString().split("T")[0]
            : "",
          created_at: route.created_at || "",
          status:
            route.status === "APROVADA"
              ? "approved"
              : route.status === "REJEITADA"
                ? "rejected"
                : "pending",
          loading_time: route.loading_time,
        };
      });

      setRoutes(transformedRoutes);
    } catch (error) {
      console.error("Error fetching routes:", error);
    } finally {
      setRoutesLoading(false);
    }
  };

  // Função para buscar apenas os entregadores
  const fetchDrivers = async () => {
    try {
      setDriversLoading(true);

      // Get the admin's hub_id
      const hubId = adminHubId || (await getAdminHubId());
      if (!hubId) {
        console.error(
          "Hub ID não encontrado. Não é possível carregar os entregadores.",
        );
        setDriversLoading(false);
        return;
      }

      // Ensure we have cities data
      if (cities.length === 0) {
        const { data: citiesData, error: citiesError } = await supabase
          .from("cities")
          .select("*")
          .eq("hub_id", hubId)
          .order("name", { ascending: true });

        if (citiesError) throw citiesError;
        setCities(citiesData || []);
      }

      const todayDate = getCurrentFormattedDate();

      // Fetch users (excluding admin users)
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .eq("hub_id", hubId)
        .neq("permissions", "admin")
        .order("name", { ascending: true });

      if (usersError) throw usersError;

      // Fetch user preferences to get region information
      const { data: preferencesData, error: preferencesError } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("hub_id", hubId);

      if (preferencesError) throw preferencesError;

      // Fetch driver availability for the current date
      const { data: availabilityData, error: availabilityError } =
        await supabase
          .from("disp")
          .select("*")
          .eq("hub_id", hubId)
          .gte("created_at", `${todayDate}T00:00:00`)
          .lt("created_at", `${todayDate}T23:59:59`);

      if (availabilityError) {
        console.error("Error fetching driver availability:", availabilityError);
      }

      // Map preferences and availability to users
      const enhancedUsers = usersData.map((user: Driver) => {
        const userPrefs = preferencesData?.find(
          (pref: any) => pref.user_id === user.id,
        );

        // Find availability for this user
        const userAvailability = availabilityData?.find(
          (avail: any) => avail.user_id === user.id,
        );

        // Set availability properties
        user.is_available = userAvailability ? userAvailability.disp : false;
        user.availability_date = userAvailability
          ? format(new Date(userAvailability.created_at), "dd/MM/yyyy")
          : undefined;
        user.availability_shift = userAvailability
          ? userAvailability.turno
          : undefined;

        let primaryRegionName = "Não definida";
        let backupRegionNames: string[] = [];

        if (userPrefs) {
          // Handle primary region
          if (
            userPrefs.primary_regions &&
            Array.isArray(userPrefs.primary_regions) &&
            userPrefs.primary_regions.length > 0
          ) {
            const primaryRegionId = userPrefs.primary_regions[0];

            const primaryCity = cities?.find(
              (city: City) => city.id === primaryRegionId,
            );

            if (primaryCity) {
              primaryRegionName = primaryCity.name;
            }

            user.primary_region = primaryRegionId;
          }

          // Handle backup regions
          if (
            userPrefs.backup_regions &&
            Array.isArray(userPrefs.backup_regions) &&
            userPrefs.backup_regions.length > 0
          ) {
            const backupRegionIds = userPrefs.backup_regions;
            user.backup_regions = backupRegionIds;

            backupRegionNames = backupRegionIds
              .map((regionId: number) => {
                const city = cities?.find((city: City) => city.id === regionId);
                return city ? city.name : "Desconhecida";
              })
              .filter((name): name is string => Boolean(name));
          }
        }

        return {
          ...user,
          primary_region_name: primaryRegionName,
          backup_region_names: backupRegionNames,
        };
      });

      setDrivers(enhancedUsers);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    } finally {
      setDriversLoading(false);
    }
  };

  const handleRouteStatusChange = async (
    routeId: string,
    status: "approved" | "rejected",
  ) => {
    try {
      // Get the admin's hub_id
      const hubId = adminHubId || (await getAdminHubId());
      if (!hubId) {
        console.error(
          "Hub ID não encontrado. Não é possível atualizar o status da rota.",
        );
        return;
      }

      // Convert status to database enum value
      const dbStatus = status === "approved" ? "APROVADA" : "REJEITADA";

      const { error } = await supabase
        .from("routes")
        .update({ status: dbStatus })
        .eq("hub_id", hubId)
        .eq("id", routeId);

      if (error) throw error;

      // Update local state
      setRoutes(
        routes.map((route) =>
          route.id === routeId ? { ...route, status } : route,
        ),
      );
    } catch (error) {
      console.error("Error updating route status:", error);
    }
  };

  const handleLoadingTimeChange = async (
    routeId: string,
    loadingTime: string,
  ) => {
    try {
      // Get the admin's hub_id
      const hubId = adminHubId || (await getAdminHubId());
      if (!hubId) {
        console.error(
          "Hub ID não encontrado. Não é possível atualizar o horário de carregamento.",
        );
        return;
      }

      // Validate loading_time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(loadingTime)) {
        console.error("Invalid loading time format. Use HH:MM");
        return;
      }

      const { error } = await supabase
        .from("routes")
        .update({ loading_time: loadingTime })
        .eq("hub_id", hubId)
        .eq("id", routeId);

      if (error) throw error;

      // Update local state
      setRoutes(
        routes.map((route) =>
          route.id === routeId
            ? { ...route, loading_time: loadingTime }
            : route,
        ),
      );
    } catch (error) {
      console.error("Error updating route loading time:", error);
    }
  };

  useEffect(() => {
    // Inicializa apenas os dados do dashboard ao carregar a página
    fetchDashboardData();

    // Listen for route updates
    window.addEventListener("routes-updated", fetchDashboardData);
    return () => {
      window.removeEventListener("routes-updated", fetchDashboardData);
    };
  }, []);

  return {
    stats,
    loading,
    routesLoading,
    driversLoading,
    routes,
    drivers,
    cities,
    driversByPeriod,
    handleRouteStatusChange,
    handleLoadingTimeChange,
    fetchDashboardData,
    fetchRoutes,
    fetchDrivers,
    getCurrentFormattedDate,
  };
}
