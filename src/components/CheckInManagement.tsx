"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Search,
  Filter,
  RefreshCw,
  User,
  Maximize2,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { calculateDistance } from "@/utils/utils";

interface CheckInData {
  id: string;
  user_id: string;
  driver_id: string;
  password: string;
  hub_id: string;
  timestamp: string;
  status: "pending" | "approved" | "rejected";
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  user_name?: string;
  route_id?: string;
  route_name?: string;
  city_name?: string;
}

interface MapLocation {
  latitude: number;
  longitude: number;
  radius: number; // in meters
}

interface LocationLog {
  admin_name: string;
  timestamp: string;
  action: string;
  location: MapLocation;
}

export default function CheckInManagement() {
  const [checkIns, setCheckIns] = useState<CheckInData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    status: "pending",
    search: "",
  });
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckInData | null>(
    null,
  );
  const [hubLocation, setHubLocation] = useState<MapLocation>({
    latitude: -23.5505, // Default to São Paulo
    longitude: -46.6333,
    radius: 500, // 500 meters default radius
  });
  const [locationLogs, setLocationLogs] = useState<LocationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const fetchCheckIns = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/checkin", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao buscar check-ins");
      }

      const data = await response.json();
      setCheckIns(data.checkIns || []);
    } catch (err: any) {
      console.error("Error fetching check-ins:", err);
      setError(err.message || "Ocorreu um erro ao buscar os check-ins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckIns();

    // Refresh check-ins every 30 seconds
    const interval = setInterval(fetchCheckIns, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (
    checkInId: string,
    status: "approved" | "rejected",
  ) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/checkin/${checkInId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erro ao atualizar status do check-in",
        );
      }

      // Update local state
      setCheckIns(
        checkIns.map((checkIn) =>
          checkIn.id === checkInId ? { ...checkIn, status } : checkIn,
        ),
      );

      // Refresh check-ins
      fetchCheckIns();
    } catch (err: any) {
      console.error("Error updating check-in status:", err);
      setError(
        err.message || "Ocorreu um erro ao atualizar o status do check-in",
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter check-ins based on current filters
  const filteredCheckIns = checkIns.filter((checkIn) => {
    // Status filter
    if (filter.status !== "all" && checkIn.status !== filter.status) {
      return false;
    }

    // Search filter (search in driver_id, user_name, or route_name)
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const driverIdMatch = checkIn.driver_id
        ?.toLowerCase()
        .includes(searchLower);
      const userNameMatch = checkIn.user_name
        ?.toLowerCase()
        .includes(searchLower);
      const routeNameMatch = checkIn.route_name
        ?.toLowerCase()
        .includes(searchLower);
      const cityNameMatch = checkIn.city_name
        ?.toLowerCase()
        .includes(searchLower);

      if (
        !driverIdMatch &&
        !userNameMatch &&
        !routeNameMatch &&
        !cityNameMatch
      ) {
        return false;
      }
    }

    return true;
  });

  // Fetch hub location and history from database
  const fetchHubLocation = async () => {
    try {
      setLoadingLogs(true);
      setLogsError(null);

      // Fetch the current hub location and history
      const hubId = "1"; // Default hub ID - in a real implementation, this would be dynamic
      const response = await fetch(`/api/hub-location?hubId=${hubId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao buscar localização do hub");
      }

      const data = await response.json();

      // If we have history, use the most recent entry for current hub location
      if (data.history && data.history.length > 0) {
        const latestLocation = data.history[0];
        setHubLocation({
          latitude: latestLocation.latitude,
          longitude: latestLocation.longitude,
          radius: latestLocation.radius,
        });

        // Format the location logs
        const formattedLogs = data.history.map((entry: any) => ({
          admin_name: entry.adminName,
          timestamp: entry.timestamp,
          action: entry.action,
          location: {
            latitude: entry.latitude,
            longitude: entry.longitude,
            radius: entry.radius,
          },
        }));

        setLocationLogs(formattedLogs);
      } else {
        // Fallback to default location if no history
        const defaultLocation = {
          latitude: -23.5505,
          longitude: -46.6333,
          radius: 500,
        };
        setHubLocation(defaultLocation);
        setLocationLogs([]);
      }
    } catch (err: any) {
      console.error("Error fetching hub location:", err);
      setLogsError(err.message || "Erro ao buscar histórico de localização");
    } finally {
      setLoadingLogs(false);
    }
  };

  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [saveLocationSuccess, setSaveLocationSuccess] = useState<string | null>(
    null,
  );
  const [saveLocationError, setSaveLocationError] = useState<string | null>(
    null,
  );

  const handleSaveHubLocation = async () => {
    try {
      // Reset states
      setIsSavingLocation(true);
      setSaveLocationSuccess(null);
      setSaveLocationError(null);

      // Validate coordinates and radius
      if (!isValidCoordinate(hubLocation.latitude, hubLocation.longitude)) {
        throw new Error(
          "Coordenadas inválidas. Verifique a localização do hub.",
        );
      }

      if (hubLocation.radius < 100 || hubLocation.radius > 2000) {
        throw new Error("Raio inválido. Deve estar entre 100 e 2000 metros.");
      }

      // Save hub location to database
      const hubId = "1"; // Default hub ID - in a real implementation, this would be dynamic
      const response = await fetch(`/api/hub-location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hubId,
          latitude: hubLocation.latitude,
          longitude: hubLocation.longitude,
          radius: hubLocation.radius,
          action: "Atualizou localização do hub",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar localização do hub");
      }

      const data = await response.json();

      // Add the new log to the state
      const newLog = {
        admin_name: data.history.adminName || "Administrador",
        timestamp: data.history.timestamp,
        action: data.history.action,
        location: {
          latitude: data.history.latitude,
          longitude: data.history.longitude,
          radius: data.history.radius,
        },
      };

      setLocationLogs([newLog, ...locationLogs]);
      setSaveLocationSuccess("Localização do hub atualizada com sucesso!");

      // Close dialog after a short delay to show success message
      setTimeout(() => {
        setMapDialogOpen(false);
        setSaveLocationSuccess(null);
      }, 1500);

      // Refresh check-ins to reflect new location settings
      fetchCheckIns();
    } catch (err: any) {
      console.error("Error saving hub location:", err);
      setSaveLocationError(err.message || "Erro ao salvar localização do hub");
    } finally {
      setIsSavingLocation(false);
    }
  };

  // Helper function to validate coordinates
  const isValidCoordinate = (lat: number, lng: number): boolean => {
    return (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  };

  const handleRadiusChange = (value: number[]) => {
    setHubLocation({
      ...hubLocation,
      radius: value[0],
    });

    // Update circle radius if map is loaded
    if (mapLoaded && mapRef.current && mapDialogOpen) {
      const mapElement = mapRef.current as HTMLElement;
      const map = (mapElement as any).__gm?.map;
      if (map) {
        const circles = map.overlayMapTypes
          .getArray()
          .filter((overlay: any) => overlay instanceof google.maps.Circle);

        if (circles.length > 0) {
          circles[0].setRadius(value[0]);
        }
      }
    }
  };

  // Load Google Maps API
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !window.google &&
      !document.getElementById("google-maps-script")
    ) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBnkc_0-vCe-RU-V47O4zFj-QrI3ySPVpM&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("Google Maps API loaded successfully");
        setMapLoaded(true);
      };
      script.onerror = (error) => {
        console.error("Error loading Google Maps API:", error);
        setError(
          "Não foi possível carregar o mapa. Verifique sua conexão com a internet.",
        );
      };
      document.head.appendChild(script);
    } else if (window.google) {
      setMapLoaded(true);
    }

    fetchHubLocation();
  }, []);

  // Initialize map when dialog opens and map is loaded
  useEffect(() => {
    if (
      mapDialogOpen &&
      mapLoaded &&
      mapRef.current &&
      selectedCheckIn?.location
    ) {
      const { latitude, longitude } = selectedCheckIn.location;
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: latitude, lng: longitude },
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      // Add marker for check-in location
      new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map,
        title: `${selectedCheckIn.user_name || "Entregador"} - ${new Date(selectedCheckIn.timestamp).toLocaleString()}`,
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        },
      });

      // Add marker for hub location
      const hubMarker = new google.maps.Marker({
        position: { lat: hubLocation.latitude, lng: hubLocation.longitude },
        map,
        title: "Hub Location",
        draggable: true,
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        },
      });

      // Add circle for radius
      const circle = new google.maps.Circle({
        map,
        center: { lat: hubLocation.latitude, lng: hubLocation.longitude },
        radius: hubLocation.radius,
        fillColor: "#FF6347",
        fillOpacity: 0.2,
        strokeColor: "#FF6347",
        strokeOpacity: 0.8,
        strokeWeight: 2,
      });

      // Update circle when marker is dragged
      google.maps.event.addListener(hubMarker, "dragend", function () {
        const position = hubMarker.getPosition();
        if (position) {
          circle.setCenter(position);
          setHubLocation({
            ...hubLocation,
            latitude: position.lat(),
            longitude: position.lng(),
          });
        }
      });

      // Calculate distance between check-in and hub
      if (selectedCheckIn.location) {
        const distance =
          calculateDistance(
            selectedCheckIn.location.latitude,
            selectedCheckIn.location.longitude,
            hubLocation.latitude,
            hubLocation.longitude,
          ) * 1000; // Convert km to meters

        // Fit bounds to show both markers
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: latitude, lng: longitude });
        bounds.extend({
          lat: hubLocation.latitude,
          lng: hubLocation.longitude,
        });
        map.fitBounds(bounds);
      }
    }
  }, [mapDialogOpen, mapLoaded, selectedCheckIn, hubLocation]);

  return (
    <Card className="border-orange-100 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <Clock className="h-5 w-5 text-orange-500" />
          <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-transparent bg-clip-text">
            Gerenciamento de Check-ins
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300 uppercase tracking-wide text-xs font-bold">
              Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendentes</option>
              <option value="approved">Aprovados</option>
              <option value="rejected">Rejeitados</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300 uppercase tracking-wide text-xs font-bold">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por ID, nome..."
                value={filter.search}
                onChange={(e) =>
                  setFilter({ ...filter, search: e.target.value })
                }
                className="pl-10 w-full"
              />
            </div>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="flex items-center gap-2 h-10"
              onClick={fetchCheckIns}
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </div>

        {loading && checkIns.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
            {error}
          </div>
        ) : filteredCheckIns.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="uppercase text-xs font-bold tracking-wide text-gray-600 dark:text-gray-400">
                    Entregador
                  </TableHead>
                  <TableHead className="uppercase text-xs font-bold tracking-wide text-gray-600 dark:text-gray-400">
                    Senha
                  </TableHead>
                  <TableHead className="uppercase text-xs font-bold tracking-wide text-gray-600 dark:text-gray-400">
                    Horário
                  </TableHead>
                  <TableHead className="uppercase text-xs font-bold tracking-wide text-gray-600 dark:text-gray-400">
                    Rota
                  </TableHead>
                  <TableHead className="uppercase text-xs font-bold tracking-wide text-gray-600 dark:text-gray-400">
                    Localização
                  </TableHead>
                  <TableHead className="uppercase text-xs font-bold tracking-wide text-gray-600 dark:text-gray-400">
                    Status
                  </TableHead>
                  <TableHead className="uppercase text-xs font-bold tracking-wide text-gray-600 dark:text-gray-400">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCheckIns.map((checkIn) => (
                  <TableRow key={checkIn.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {checkIn.user_name || "Nome não disponível"}
                        </span>
                        <span className="text-sm text-gray-500">
                          {checkIn.driver_id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono font-bold text-orange-600 dark:text-orange-400 tracking-wider">
                        {checkIn.password}
                      </code>
                    </TableCell>
                    <TableCell>
                      {new Date(checkIn.timestamp).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{checkIn.route_name || "Não atribuída"}</span>
                        {checkIn.city_name && (
                          <span className="text-sm text-gray-500">
                            {checkIn.city_name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {checkIn.location ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-xs"
                          onClick={() => {
                            setSelectedCheckIn(checkIn);
                            setMapDialogOpen(true);
                          }}
                        >
                          <MapPin className="h-3 w-3" />
                          Ver no mapa
                        </Button>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          Não disponível
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`
                          ${checkIn.status === "pending" ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800" : ""}
                          ${checkIn.status === "approved" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" : ""}
                          ${checkIn.status === "rejected" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" : ""}
                        `}
                      >
                        {checkIn.status === "pending" && "Pendente"}
                        {checkIn.status === "approved" && "Aprovado"}
                        {checkIn.status === "rejected" && "Rejeitado"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {checkIn.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30"
                            onClick={() =>
                              handleStatusChange(checkIn.id, "approved")
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                            onClick={() =>
                              handleStatusChange(checkIn.id, "rejected")
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-full mb-4">
              <Clock className="h-12 w-12 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold mb-2 dark:text-white">
              Nenhum check-in encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Não foram encontrados check-ins com os filtros selecionados. Tente
              ajustar os filtros ou aguardar novos check-ins.
            </p>
          </div>
        )}
      </CardContent>

      {/* Map Dialog */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <MapPin className="h-5 w-5 text-orange-500" />
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-transparent bg-clip-text">
                Visualização de Localização
              </span>
            </DialogTitle>
            <DialogDescription>
              {selectedCheckIn?.user_name
                ? `Check-in de ${selectedCheckIn.user_name}`
                : "Localização do entregador"}
              {selectedCheckIn?.timestamp &&
                ` em ${new Date(selectedCheckIn.timestamp).toLocaleString("pt-BR")}`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow overflow-hidden">
            <div className="md:col-span-2 h-[50vh] md:h-auto relative rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
              <div ref={mapRef} className="w-full h-full"></div>
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
              )}
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[50vh] md:max-h-[70vh]">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium uppercase tracking-wide text-xs font-bold">
                    Configuração do Hub
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium uppercase tracking-wide text-xs font-bold">
                        Raio de Check-in (metros)
                      </label>
                      <Slider
                        value={[hubLocation.radius]}
                        min={100}
                        max={2000}
                        step={100}
                        onValueChange={handleRadiusChange}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>100m</span>
                        <span>{hubLocation.radius}m</span>
                        <span>2000m</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium uppercase tracking-wide text-xs font-bold">
                        Coordenadas
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500">
                            Latitude
                          </label>
                          <Input
                            value={hubLocation.latitude.toFixed(6)}
                            readOnly
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">
                            Longitude
                          </label>
                          <Input
                            value={hubLocation.longitude.toFixed(6)}
                            readOnly
                            className="text-xs"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 italic">
                        Arraste o marcador vermelho para ajustar a localização
                      </p>
                    </div>

                    {saveLocationSuccess && (
                      <div className="mb-2 p-2 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm">
                        {saveLocationSuccess}
                      </div>
                    )}

                    {saveLocationError && (
                      <div className="mb-2 p-2 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
                        {saveLocationError}
                      </div>
                    )}

                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={handleSaveHubLocation}
                      disabled={isSavingLocation}
                    >
                      {isSavingLocation ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Salvando...
                        </>
                      ) : (
                        "Salvar Configuração"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium uppercase tracking-wide text-xs font-bold">
                    Histórico de Alterações
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[200px] overflow-y-auto">
                  {loadingLogs ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    </div>
                  ) : logsError ? (
                    <div className="text-sm text-red-500 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                      {logsError}
                    </div>
                  ) : locationLogs.length > 0 ? (
                    <div className="space-y-3">
                      {locationLogs.map((log, index) => (
                        <div
                          key={index}
                          className="border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0"
                        >
                          <p className="text-sm font-medium">{log.action}</p>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{log.admin_name}</span>
                            <span>
                              {new Date(log.timestamp).toLocaleString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Nenhuma alteração registrada
                    </p>
                  )}
                </CardContent>
              </Card>

              {selectedCheckIn?.location && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium uppercase tracking-wide text-xs font-bold">
                      Informações do Check-in
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Distância do Hub:
                        </span>
                        <span className="text-sm font-medium">
                          {calculateDistance(
                            selectedCheckIn.location.latitude,
                            selectedCheckIn.location.longitude,
                            hubLocation.latitude,
                            hubLocation.longitude,
                          ).toFixed(2)}{" "}
                          km
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Precisão:</span>
                        <span className="text-sm font-medium">
                          {selectedCheckIn.location.accuracy
                            ? `±${selectedCheckIn.location.accuracy.toFixed(0)}m`
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setMapDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
