"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { MapPin, Save, Loader2, AlertCircle } from "lucide-react";

interface HubLocationMapProps {
  hubId: string;
  onLocationSaved?: () => void;
}

export default function HubLocationMap({
  hubId,
  onLocationSaved,
}: HubLocationMapProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [radius, setRadius] = useState(500); // Default radius in meters
  const [history, setHistory] = useState<any[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      // Define the callback function globally before creating the script
      window.initMap = initializeMap;

      const existingScript = document.getElementById("google-maps-script");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "google-maps-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBnkc_0-vCe-RU-V47O4zFj-QrI3ySPVpM&libraries=places&callback=initMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      } else if (window.google && window.google.maps) {
        // If script already exists and API is loaded, initialize map directly
        initializeMap();
      } else {
        // Script exists but API not loaded yet, wait for it
        setTimeout(initializeMap, 200);
      }
    };

    loadGoogleMapsAPI();

    return () => {
      // Clean up the global callback when component unmounts
      window.initMap = undefined;
    };
  }, []);

  // Initialize map
  const initializeMap = () => {
    if (!window.google || !mapRef.current) {
      // If Google Maps API isn't loaded yet or map ref isn't available,
      // retry after a short delay
      setTimeout(initializeMap, 200);
      return;
    }

    // Fetch hub location data
    fetchHubLocationData();
  };

  // Fetch hub location data
  const fetchHubLocationData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false); // Reset success state when fetching new data

      const response = await fetch(`/api/hub-location?hubId=${hubId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch hub location data");
      }

      const data = await response.json();

      // Set initial location from hub data or history
      if (data.hub && data.hub.latitude && data.hub.longitude) {
        setLatitude(data.hub.latitude);
        setLongitude(data.hub.longitude);
        setRadius(data.hub.check_in_radius || 500);
      } else if (data.history && data.history.length > 0) {
        const latestLocation = data.history[0];
        setLatitude(latestLocation.latitude);
        setLongitude(latestLocation.longitude);
        setRadius(latestLocation.radius || 500);
      } else {
        // Default to São Paulo coordinates if no data available
        setLatitude(-23.5505);
        setLongitude(-46.6333);
        setRadius(500);
      }

      // Set history data
      setHistory(data.history || []);

      // Initialize map with the location after a short delay
      // to ensure all state updates have been processed
      setTimeout(createMap, 100);
    } catch (err) {
      console.error("Error fetching hub location data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar dados de localização do hub",
      );
      // Initialize map with default location
      setLatitude(-23.5505);
      setLongitude(-46.6333);
      setTimeout(createMap, 100);
    } finally {
      setLoading(false);
    }
  };

  // Create map with current location
  const createMap = () => {
    if (
      !window.google ||
      !mapRef.current ||
      latitude === null ||
      longitude === null
    ) {
      // If any required elements are missing, retry after a short delay
      setTimeout(createMap, 200);
      return;
    }

    const mapOptions = {
      center: { lat: latitude, lng: longitude },
      zoom: 15,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    };

    // Create map instance
    const map = new window.google.maps.Map(mapRef.current, mapOptions);
    mapInstanceRef.current = map;

    // Create marker
    const marker = new window.google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map,
      draggable: true,
      title: "Hub Location",
      animation: window.google.maps.Animation.DROP,
    });
    markerRef.current = marker;

    // Create circle to represent radius
    const circle = new window.google.maps.Circle({
      map,
      center: { lat: latitude, lng: longitude },
      radius: radius,
      fillColor: "#FF9800",
      fillOpacity: 0.2,
      strokeColor: "#FF9800",
      strokeOpacity: 0.8,
      strokeWeight: 2,
    });
    circleRef.current = circle;

    // Add event listener for marker drag end
    marker.addListener("dragend", () => {
      const position = marker.getPosition();
      if (position) {
        setLatitude(position.lat());
        setLongitude(position.lng());
        circle.setCenter(position);
      }
    });

    // Add click event to map to move marker
    map.addListener("click", (event: any) => {
      marker.setPosition(event.latLng);
      circle.setCenter(event.latLng);
      setLatitude(event.latLng.lat());
      setLongitude(event.latLng.lng());
    });
  };

  // Update circle radius when radius changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius);
    }
  }, [radius]);

  // Save hub location
  const saveHubLocation = async () => {
    if (latitude === null || longitude === null || !radius) {
      setError("Localização ou raio inválidos");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch("/api/hub-location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hubId,
          latitude,
          longitude,
          radius,
          action: "Hub location updated by admin",
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save hub location");
      }

      const data = await response.json();
      setSuccess(true);

      // Add new history item to the list
      setHistory([data.history, ...history]);

      // Call the callback if provided
      if (onLocationSaved) {
        onLocationSaved();
      }
    } catch (err) {
      console.error("Error saving hub location:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao salvar localização do hub",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-orange-100 dark:border-orange-900 shadow-lg bg-white dark:bg-gray-800 overflow-hidden">
      <CardHeader className="pb-2 border-b dark:border-gray-700">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-orange-500" />
          <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-transparent bg-clip-text">
            Configurar Localização do Hub
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>Localização do hub salva com sucesso!</span>
          </div>
        )}

        <div className="space-y-4">
          <div
            ref={mapRef}
            className="w-full h-[400px] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {loading && (
              <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="latitude" className="text-sm font-medium">
                Latitude
              </Label>
              <Input
                id="latitude"
                type="text"
                value={latitude !== null ? latitude.toString() : ""}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    setLatitude(value);
                    if (markerRef.current && circleRef.current) {
                      const position = new window.google.maps.LatLng(
                        value,
                        longitude || 0,
                      );
                      markerRef.current.setPosition(position);
                      circleRef.current.setCenter(position);
                      mapInstanceRef.current.panTo(position);
                    }
                  }
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="longitude" className="text-sm font-medium">
                Longitude
              </Label>
              <Input
                id="longitude"
                type="text"
                value={longitude !== null ? longitude.toString() : ""}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    setLongitude(value);
                    if (markerRef.current && circleRef.current) {
                      const position = new window.google.maps.LatLng(
                        latitude || 0,
                        value,
                      );
                      markerRef.current.setPosition(position);
                      circleRef.current.setCenter(position);
                      mapInstanceRef.current.panTo(position);
                    }
                  }
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="radius" className="text-sm font-medium">
                Raio de Check-in (metros)
              </Label>
              <Input
                id="radius"
                type="number"
                min="50"
                max="5000"
                value={radius}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value > 0) {
                    setRadius(value);
                  }
                }}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={saveHubLocation}
              disabled={
                saving || latitude === null || longitude === null || !radius
              }
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Localização do Hub
                </>
              )}
            </Button>
          </div>

          {history.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">
                Histórico de Alterações
              </h4>
              <div className="max-h-[200px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Administrador
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Coordenadas
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Raio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {history.map((item, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {new Date(item.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {item.adminName}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {item.latitude.toFixed(6)},{" "}
                          {item.longitude.toFixed(6)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {item.radius}m
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
