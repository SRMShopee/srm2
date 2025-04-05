"use client";

import { useState, useEffect } from "react";
import { User } from "@/utils/auth";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  AlertCircle,
  Clock,
  MapPin,
  CheckCircle,
  Copy,
  RefreshCw,
} from "lucide-react";
import { calculateDistance } from "@/utils/utils";

interface CheckInProps {
  user: User;
  onClose?: () => void;
}

interface CheckInData {
  password: string;
  timestamp: number;
  expiresAt: number;
  routeId?: string;
  routeName?: string;
  cityName?: string;
  queuePosition?: number;
  estimatedTime?: string;
  vehicle?: string;
  period?: string;
}

export default function CheckIn({ user, onClose }: CheckInProps) {
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [checkInData, setCheckInData] = useState<CheckInData | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hubInfo, setHubInfo] = useState<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    check_in_radius: number;
  } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [animatePassword, setAnimatePassword] = useState(false);

  // Check if there's an existing check-in in localStorage
  useEffect(() => {
    const storedCheckIn = localStorage.getItem("checkInData");
    if (storedCheckIn) {
      try {
        const parsedData = JSON.parse(storedCheckIn) as CheckInData;

        // Check if the check-in is still valid (not expired)
        if (parsedData.expiresAt > Date.now()) {
          setCheckInData(parsedData);
          setPassword(parsedData.password);
          setSuccess(true);

          // Set countdown
          setCountdown(Math.floor((parsedData.expiresAt - Date.now()) / 1000));

          // Fetch latest queue position
          fetchQueuePosition(parsedData);
        } else {
          // Clear expired check-in
          localStorage.removeItem("checkInData");
          // Generate a new password
          handleGeneratePassword();
        }
      } catch (err) {
        console.error("Error parsing stored check-in data:", err);
        localStorage.removeItem("checkInData");
        // Generate a new password
        handleGeneratePassword();
      }
    } else {
      // Generate a new password if no stored check-in
      handleGeneratePassword();
    }
  }, []);

  // Fetch hub information
  useEffect(() => {
    if (!user?.hub_id) return;

    const fetchHubInfo = async () => {
      try {
        const response = await fetch(`/api/hubs/${user.hub_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch hub information");
        }

        const data = await response.json();
        if (data.hub) {
          setHubInfo(data.hub);

          // If we already have location, calculate distance
          if (location && data.hub.latitude && data.hub.longitude) {
            const dist = calculateDistance(
              location.latitude,
              location.longitude,
              data.hub.latitude,
              data.hub.longitude,
            );
            setDistance(dist);
            setIsWithinRadius(dist <= (data.hub.check_in_radius || 500) / 1000); // Convert meters to km
          }
        }
      } catch (err) {
        console.error("Error fetching hub info:", err);
      }
    };

    fetchHubInfo();
  }, [user, location]);

  // Get user's current location
  const getLocationIfNeeded = async (): Promise<boolean> => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocalização não é suportada pelo seu navegador");
      return false;
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        },
      );

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });

      // Calculate distance to hub if hub info is available
      if (hubInfo && hubInfo.latitude && hubInfo.longitude) {
        const dist = calculateDistance(
          position.coords.latitude,
          position.coords.longitude,
          hubInfo.latitude,
          hubInfo.longitude,
        );
        setDistance(dist);
        const isWithin = dist <= (hubInfo.check_in_radius || 500) / 1000; // Convert meters to km
        setIsWithinRadius(isWithin);

        if (!isWithin) {
          setLocationError(
            `Você está a ${dist.toFixed(2)}km do hub. É necessário estar a menos de ${((hubInfo.check_in_radius || 500) / 1000).toFixed(2)}km para fazer check-in.`,
          );
          return false;
        }

        return true;
      }

      return true;
    } catch (error: any) {
      console.error("Error getting location:", error);
      setLocationError(
        error.message ||
          "Não foi possível obter sua localização. Verifique se a permissão está ativada.",
      );
      return false;
    }
  };

  // Fetch queue position periodically
  const fetchQueuePosition = async (data: CheckInData) => {
    try {
      // In a real implementation, this would call an API endpoint to get the current queue position
      // For now, we'll simulate it with a random position between 1 and 3
      const queuePosition = Math.floor(Math.random() * 3) + 1;
      const estimatedMinutes = queuePosition * 5;

      // Update the check-in data with queue position
      const updatedData = {
        ...data,
        queuePosition,
        estimatedTime: `${estimatedMinutes} minutos`,
      };

      setCheckInData(updatedData);
      localStorage.setItem("checkInData", JSON.stringify(updatedData));

      // Schedule next update in 30 seconds
      setTimeout(() => {
        if (checkInData) {
          fetchQueuePosition(checkInData);
        }
      }, 30000);
    } catch (error) {
      console.error("Error fetching queue position:", error);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Clear check-in data when countdown reaches zero
          if (checkInData) {
            localStorage.removeItem("checkInData");
            setCheckInData(null);
            setSuccess(false);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, checkInData]);

  const handleGeneratePassword = () => {
    // Check if there's already a valid check-in for the current route
    if (checkInData && checkInData.expiresAt > Date.now()) {
      setError(
        "Você já possui uma senha válida para esta rota. Aguarde a expiração ou cancele o check-in atual.",
      );

      // Highlight the existing password with animation
      setAnimatePassword(true);
      setTimeout(() => setAnimatePassword(false), 1500);

      return;
    }

    // Generate a password with the OWNFLEET pattern
    // Get the current date to determine if we need to reset the counter
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    const storedDate = localStorage.getItem("ownfleetPasswordDate");
    const storedCounter = localStorage.getItem("ownfleetPasswordCounter");

    // Clear any previous error
    setError(null);

    let counter = 1;

    // If we have a stored counter and it's from today, increment it
    if (storedDate === today && storedCounter) {
      counter = parseInt(storedCounter, 10) + 1;
    } else {
      // It's a new day or first password, reset counter to 1
      localStorage.setItem("ownfleetPasswordDate", today);
    }

    // Store the updated counter
    localStorage.setItem("ownfleetPasswordCounter", counter.toString());

    // Format the password as OWNFLEET-{counter}
    const newPassword = `OWNFLEET-${counter}`;
    setPassword(newPassword);
    setCopied(false);

    // Trigger animation
    setAnimatePassword(true);
    setTimeout(() => setAnimatePassword(false), 500);
  };

  const handleCopyPassword = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCheckIn = async () => {
    if (!password) {
      setError("Gere uma senha para fazer check-in");
      return;
    }

    // Check if user has an assigned route
    if (!checkInData?.routeId && !checkInData?.routeName) {
      setError(
        "Você não possui uma rota atribuída. Entre em contato com o administrador.",
      );
      return;
    }

    setLoading(true);
    setError(null);

    // Verify user's location
    const locationValid = await getLocationIfNeeded();
    if (!locationValid) {
      setLoading(false);
      return;
    }

    try {
      // Prepare check-in data
      const checkInRequest = {
        userId: user.id,
        driverId: user.driver_id,
        password,
        hubId: user.hub_id,
        timestamp: Date.now(),
        location: location
          ? {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
            }
          : undefined,
      };

      // Send check-in request to API
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkInRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao realizar check-in");
      }

      const data = await response.json();

      // Store check-in data in localStorage
      const newCheckInData: CheckInData = {
        password,
        timestamp: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes expiration
        routeId: data.routeId || checkInData?.routeId,
        routeName: data.routeName || checkInData?.routeName,
        cityName: data.cityName || checkInData?.cityName,
        queuePosition: 1,
        estimatedTime: "5 minutos",
        vehicle: checkInData?.vehicle,
        period: checkInData?.period,
      };

      localStorage.setItem("checkInData", JSON.stringify(newCheckInData));
      setCheckInData(newCheckInData);
      setSuccess(true);
      setCountdown(30 * 60); // 30 minutes in seconds
    } catch (err: any) {
      console.error("Check-in error:", err);
      setError(err.message || "Ocorreu um erro ao realizar o check-in");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Fetch user's route and vehicle information
  useEffect(() => {
    if (user?.id) {
      const fetchUserRouteInfo = async () => {
        try {
          const response = await fetch(`/api/user?userId=${user.id}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            if (data.route) {
              setCheckInData((prev) => ({
                ...prev,
                routeId: data.route.id,
                routeName: data.route.name,
                cityName: data.route.city?.name || "Cidade não especificada",
                period: data.route.period,
              }));
            }

            if (data.vehicle) {
              setCheckInData((prev) => ({
                ...prev,
                vehicle: data.vehicle,
              }));
            }
          }
        } catch (err) {
          console.error("Error fetching user route info:", err);
        }
      };

      fetchUserRouteInfo();
    }
  }, [user]);

  return (
    <Card className="border-orange-100 dark:border-orange-900 shadow-lg bg-white dark:bg-gray-800 overflow-hidden w-full max-w-md mx-auto relative transition-all duration-300 hover:shadow-xl">
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full transform translate-x-16 -translate-y-16 opacity-10 animate-pulse"></div>
      <div
        className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500 rounded-full transform -translate-x-12 translate-y-12 opacity-10 animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute top-1/2 left-0 w-16 h-16 bg-orange-300 rounded-full transform -translate-x-8 -translate-y-8 opacity-10 animate-pulse"
        style={{ animationDelay: "1.5s" }}
      ></div>
      <div
        className="absolute bottom-1/4 right-0 w-20 h-20 bg-orange-400 rounded-full transform translate-x-10 translate-y-10 opacity-10 animate-pulse"
        style={{ animationDelay: "0.7s" }}
      ></div>

      <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white relative overflow-hidden transition-all duration-300">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80')] bg-cover bg-center opacity-20 hover:opacity-30 transition-opacity duration-300"></div>
        <CardTitle className="flex items-center gap-2 text-xl relative z-10 transition-transform duration-300 transform hover:scale-105">
          <MapPin
            className="h-5 w-5 animate-bounce"
            style={{ animationDuration: "2s" }}
          />
          Check-in de Rota
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 relative z-10">
        {success && checkInData ? (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 flex items-start gap-3 transition-all duration-300 hover:shadow-md relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-transparent dark:from-green-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-green-200 dark:bg-green-800 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 transition-transform duration-300 group-hover:scale-110 relative z-10" />
              <div className="relative z-10">
                <h3 className="font-medium text-green-800 dark:text-green-300 transition-all duration-300 group-hover:translate-x-1 uppercase tracking-wide text-sm font-bold">
                  Check-in realizado com sucesso!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1 transition-all duration-300 group-hover:translate-x-1">
                  Sua senha é válida por{" "}
                  <span className="font-bold relative">
                    {formatTime(countdown)}
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-green-300 dark:bg-green-700 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
                  </span>
                </p>
                <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800 text-xs text-green-600 dark:text-green-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                  <Clock className="h-3 w-3" />
                  <span>Mantenha esta tela aberta até ser chamado</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide text-xs font-bold">
                  Senha de Check-in
                </h3>
                <Badge
                  variant="outline"
                  className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 transition-all duration-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 group"
                >
                  <Clock className="h-3 w-3 mr-1 group-hover:animate-pulse" />
                  <span className="relative">
                    {formatTime(countdown)}
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-orange-300 dark:bg-orange-700 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
                  </span>
                </Badge>
              </div>

              <div className="relative group">
                <Input
                  value={checkInData.password}
                  readOnly
                  className="text-center text-2xl font-bold tracking-widest bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 transition-all duration-300 group-hover:border-orange-300 dark:group-hover:border-orange-700 group-hover:shadow-sm"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-all duration-300 hover:scale-110 active:scale-95"
                  onClick={handleCopyPassword}
                >
                  <Copy className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
                  {copied && (
                    <span className="absolute -top-8 right-0 text-xs bg-black text-white px-2 py-1 rounded animate-fadeIn">
                      Copiado!
                    </span>
                  )}
                </Button>
                <div className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-orange-300 dark:bg-orange-700 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></div>
              </div>
            </div>

            {checkInData.routeName && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-md group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-100 dark:bg-blue-900/20 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2 relative z-10">
                  <MapPin className="h-4 w-4 text-blue-500 transition-transform duration-300 group-hover:scale-110" />
                  Informações da Rota
                </h3>
                <div className="space-y-2 relative z-10">
                  <div className="flex justify-between transition-all duration-300 hover:translate-x-1 group-hover:bg-white/50 dark:group-hover:bg-gray-800/50 p-1 rounded-md">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Rota:
                    </span>
                    <span className="text-sm font-medium">
                      {checkInData.routeName}
                    </span>
                  </div>
                  {checkInData.cityName && (
                    <div className="flex justify-between transition-all duration-300 hover:translate-x-1 group-hover:bg-white/50 dark:group-hover:bg-gray-800/50 p-1 rounded-md">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Cidade:
                      </span>
                      <span className="text-sm font-medium">
                        {checkInData.cityName}
                      </span>
                    </div>
                  )}
                  {checkInData.period && (
                    <div className="flex justify-between transition-all duration-300 hover:translate-x-1 group-hover:bg-white/50 dark:group-hover:bg-gray-800/50 p-1 rounded-md">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Turno de Carregamento:
                      </span>
                      <span className="text-sm font-medium">
                        {checkInData.period}
                      </span>
                    </div>
                  )}
                  {checkInData.vehicle && (
                    <div className="flex justify-between transition-all duration-300 hover:translate-x-1 group-hover:bg-white/50 dark:group-hover:bg-gray-800/50 p-1 rounded-md">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Veículo:
                      </span>
                      <span className="text-sm font-medium">
                        {checkInData.vehicle}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between transition-all duration-300 hover:translate-x-1 group-hover:bg-white/50 dark:group-hover:bg-gray-800/50 p-1 rounded-md">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Horário:
                    </span>
                    <span className="text-sm font-medium">
                      {new Date(checkInData.timestamp).toLocaleTimeString(
                        "pt-BR",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  </div>

                  {/* Queue Position Information */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 relative">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500 transition-transform duration-300 group-hover:scale-110" />
                      Status da Fila
                    </h4>
                    <div className="flex items-center justify-between transition-all duration-300 hover:translate-x-1 group-hover:bg-white/50 dark:group-hover:bg-gray-800/50 p-1 rounded-md">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Posição:
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 transition-all duration-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      >
                        {checkInData.queuePosition || "1"} de 5
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2 transition-all duration-300 hover:translate-x-1 group-hover:bg-white/50 dark:group-hover:bg-gray-800/50 p-1 rounded-md">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Tempo estimado:
                      </span>
                      <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                        {checkInData.estimatedTime || "5-10 minutos"}
                      </span>
                    </div>

                    {/* Progress bar for estimated time */}
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full transition-all duration-1000 ease-in-out"
                        style={{
                          width: `${Math.min(100, (checkInData.queuePosition || 1) * 20)}%`,
                        }}
                      ></div>
                    </div>

                    <div className="mt-3 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-md text-xs text-orange-700 dark:text-orange-300 flex items-center group-hover:shadow-sm transition-all duration-300 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-100 to-transparent dark:from-orange-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <Clock
                        className="h-3 w-3 mr-1 flex-shrink-0 animate-pulse relative z-10"
                        style={{ animationDuration: "2s" }}
                      />
                      <span className="relative z-10">
                        Aguarde ser chamado pelo operador
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-300 hover:shadow-md active:scale-95 group relative overflow-hidden"
                onClick={() => {
                  localStorage.removeItem("checkInData");
                  setCheckInData(null);
                  setSuccess(false);
                  setPassword("");
                  handleGeneratePassword();
                }}
              >
                <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-red-100 to-transparent dark:from-red-900/10 dark:to-transparent z-0"></span>
                <span className="relative z-10 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                  Cancelar Check-in
                </span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <span className="relative group-hover:text-orange-600 transition-colors duration-300 tracking-wide uppercase text-xs font-bold">
                  Senha de Check-in
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-orange-300 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
                </span>
              </h3>
              <div className="flex gap-2 relative group">
                <Input
                  value={password}
                  readOnly
                  placeholder="Senha"
                  className={`text-center text-xl font-bold tracking-widest transition-all duration-300 focus:ring-2 focus:ring-orange-300 dark:focus:ring-orange-700 group-hover:border-orange-300 dark:group-hover:border-orange-700 ${animatePassword ? "animate-pulse" : ""}`}
                />
                <Button
                  variant="outline"
                  className="flex-shrink-0 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/20 transition-all duration-300 hover:scale-105 active:scale-95 group"
                  onClick={handleGeneratePassword}
                >
                  <RefreshCw className="h-4 w-4 mr-1 transition-transform duration-300 group-hover:rotate-180" />
                  <span className="relative">
                    Gerar
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-orange-300 dark:bg-orange-700 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
                  </span>
                </Button>
                <div className="absolute -bottom-2 left-0 w-full h-0.5 bg-orange-300 dark:bg-orange-700 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></div>
              </div>
            </div>

            {/* Route and Vehicle Information */}
            <div className="space-y-3 transition-all duration-300 transform hover:translate-y-[-2px]">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-500" />
                <span className="relative group-hover:text-orange-600 transition-colors duration-300 tracking-wide uppercase text-xs font-bold">
                  Informações da Rota
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-orange-300 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
                </span>
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800">
                <div className="space-y-2">
                  <div className="flex justify-between transition-all duration-300 hover:translate-x-1 hover:bg-white/70 dark:hover:bg-gray-800/70 p-1 rounded-md">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Rota:
                    </span>
                    <span className="text-sm font-medium">
                      {checkInData?.routeName || "Rota não encontrada"}
                    </span>
                  </div>
                  <div className="flex justify-between transition-all duration-300 hover:translate-x-1 hover:bg-white/70 dark:hover:bg-gray-800/70 p-1 rounded-md">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Cidade:
                    </span>
                    <span className="text-sm font-medium">
                      {checkInData?.cityName || "Não especificada"}
                    </span>
                  </div>
                  <div className="flex justify-between transition-all duration-300 hover:translate-x-1 hover:bg-white/70 dark:hover:bg-gray-800/70 p-1 rounded-md">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Veículo:
                    </span>
                    <span className="text-sm font-medium">
                      {checkInData?.vehicle ||
                        user?.vehicle ||
                        "Não especificado"}
                    </span>
                  </div>
                  <div className="flex justify-between transition-all duration-300 hover:translate-x-1 hover:bg-white/70 dark:hover:bg-gray-800/70 p-1 rounded-md">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Turno de Carregamento:
                    </span>
                    <span className="text-sm font-medium">
                      {checkInData?.period || "Não especificado"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Status */}
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-md group relative overflow-hidden transform hover:translate-y-[-2px]">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-100 to-transparent dark:from-orange-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2 relative z-10">
                <MapPin className="h-4 w-4 text-orange-500 transition-transform duration-300 group-hover:scale-110" />
                <span className="tracking-wide uppercase text-xs font-bold">
                  Status de Localização
                </span>
              </h3>
              <div className="space-y-2 relative z-10">
                {location ? (
                  <div className="flex items-center justify-between transition-all duration-300 hover:translate-x-1 group-hover:bg-white/50 dark:group-hover:bg-gray-800/50 p-1 rounded-md">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Localização:
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        isWithinRadius
                          ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 transition-all duration-300 hover:bg-green-100 dark:hover:bg-green-900/30 animate-pulse"
                          : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 transition-all duration-300 hover:bg-red-100 dark:hover:bg-red-900/30 animate-pulse"
                      }
                      style={{ animationDuration: "3s" }}
                    >
                      {isWithinRadius ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Dentro da área permitida
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Fora da área permitida
                        </span>
                      )}
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center justify-between transition-all duration-300 hover:translate-x-1 group-hover:bg-white/50 dark:group-hover:bg-gray-800/50 p-1 rounded-md">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Localização:
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800 transition-all duration-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 animate-pulse"
                    >
                      <span className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Não detectada
                      </span>
                    </Badge>
                  </div>
                )}

                {distance !== null && (
                  <div className="flex items-center justify-between transition-all duration-300 hover:translate-x-1 group-hover:bg-white/50 dark:group-hover:bg-gray-800/50 p-1 rounded-md">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Distância do hub:
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">
                        {distance.toFixed(2)} km
                      </span>
                      {isWithinRadius ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </div>
                )}

                <div className="relative mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/20 transition-all duration-300 hover:shadow-md active:scale-95 group"
                    onClick={() => getLocationIfNeeded()}
                  >
                    <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-orange-100 to-transparent dark:from-orange-900/10 dark:to-transparent z-0"></span>
                    <span className="relative z-10 flex items-center justify-center">
                      <RefreshCw className="h-4 w-4 mr-1 transition-transform duration-300 group-hover:rotate-180" />
                      Atualizar Localização
                    </span>
                  </Button>
                  <div
                    className="absolute bottom-0 left-0 h-0.5 bg-orange-300 dark:bg-orange-700 transition-all duration-1000 ease-in-out"
                    style={{ width: location ? "100%" : "0%" }}
                  ></div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-700 dark:text-red-400 animate-pulse transition-all duration-300 transform hover:scale-102 hover:shadow-md">
                <AlertCircle
                  className="h-4 w-4 flex-shrink-0 animate-bounce"
                  style={{ animationDuration: "2s" }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{error}</p>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1 opacity-80">
                    Verifique os requisitos e tente novamente
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between gap-3 mt-6">
              {onClose && (
                <Button
                  variant="outline"
                  className="flex-1 transition-all duration-300 hover:border-red-300 hover:text-red-600 dark:hover:border-red-700 dark:hover:text-red-400 active:scale-95 group"
                  onClick={onClose}
                >
                  <span className="relative inline-block">
                    Cancelar
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-300 dark:bg-red-700 transform scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100"></span>
                  </span>
                </Button>
              )}
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white transition-all duration-300 hover:shadow-lg active:scale-95 relative overflow-hidden group"
                onClick={handleCheckIn}
                disabled={!password || loading}
              >
                <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-orange-600 to-orange-500 group-hover:bg-orange-600 z-0"></span>
                <span className="relative z-10 flex items-center justify-center">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                      Realizar Check-in
                    </>
                  )}
                </span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
