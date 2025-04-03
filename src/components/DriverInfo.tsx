"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  AlertCircle,
  Car,
  MapPin,
  User,
  Building,
  Phone,
  Mail,
  CheckCircle2,
} from "lucide-react";

interface DriverData {
  id: string;
  name: string;
  driver_id: number;
  email: string;
  phone: string;
  hub_id: string;
  hub?: {
    name: string;
    city: string;
  };
}

interface City {
  id: number;
  name: string;
  hub_id: string;
}

interface DriverRegion {
  id: number;
  user_id: string;
  city_id: number;
  is_primary: boolean;
  created_at: string;
}

const AVAILABLE_CITIES = [
  "ARARICA",
  "BOM PRINCIPIO",
  "CAMPO BOM",
  "CAPELA DE SANTANA",
  "DOIS IRMAOS",
  "ESTANCIA VELHA",
  "ESTEIO",
  "HARMONIA",
  "IGREJINHA",
  "IVOTI",
  "LINDOLFO COLLOR",
  "MONTENEGRO",
  "MORRO REUTER",
  "NOVA HARTZ",
  "NOVO HAMBURGO",
  "PARECI NOVO",
  "PAROBE",
  "PICADA CAFE",
  "PORTAO",
  "PRESIDENTE LUCENA",
  "RIOZINHO",
  "ROLANTE",
  "SANTA MARIA DO HERVAL",
  "SAO JOSE DO HORTENCIO",
  "SAO LEOPOLDO",
  "SAO SEBASTIAO DO CAI",
  "SAPIRANGA",
  "SAPUCAIA DO SUL",
  "TAQUARA",
  "TRES COROAS",
];

export default function DriverInfo() {
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [primaryCity, setPrimaryCity] = useState<number | null>(null);
  const [backupCities, setBackupCities] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDriverData() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch driver data
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*, hub:hub_id(name, city)")
          .eq("id", user.id)
          .single();

        if (userError) {
          console.error("Error fetching user data:", userError);
        } else if (userData) {
          setDriverData(userData as DriverData);
        }

        // Fetch cities for the user's hub
        if (userData) {
          const { data: citiesData, error: citiesError } = await supabase
            .from("cities")
            .select("*")
            .eq("hub_id", userData.hub_id);

          if (citiesError) {
            console.error("Error fetching cities:", citiesError);
          } else if (citiesData) {
            setCities(citiesData as City[]);
          }

          // Fetch driver regions
          const { data: regionsData, error: regionsError } = await supabase
            .from("driver_regions")
            .select("*")
            .eq("user_id", user.id);

          if (regionsError) {
            console.error("Error fetching driver regions:", regionsError);
          } else if (regionsData && regionsData.length > 0) {
            // Find primary city
            const primary = regionsData.find((region) => region.is_primary);
            if (primary) {
              setPrimaryCity(primary.city_id);
            }

            // Set backup cities (non-primary regions)
            const backups = regionsData
              .filter((region) => !region.is_primary)
              .map((region) => region.city_id);
            setBackupCities(backups);
          }
        }
      }

      setLoading(false);
    }

    fetchDriverData();
  }, [supabase]);

  const handlePrimaryCityChange = (cityId: number) => {
    // If city is already in backup cities, remove it
    if (backupCities.includes(cityId)) {
      setBackupCities(backupCities.filter((c) => c !== cityId));
    }
    setPrimaryCity(cityId);
  };

  const handleBackupCityChange = (cityId: number, checked: boolean) => {
    if (checked) {
      // Don't allow more than 2 backup cities
      if (backupCities.length >= 2) {
        setError("Você não pode selecionar mais de 2 regiões de backup");
        return;
      }
      // Don't allow total of more than 3 cities (primary + backup)
      if (primaryCity && backupCities.length >= 2) {
        setError("Você não pode selecionar mais de 3 regiões no total");
        return;
      }
      // Don't allow primary city to be selected as backup
      if (cityId === primaryCity) {
        setError(
          "Você não pode selecionar a mesma região como principal e backup",
        );
        return;
      }
      setBackupCities([...backupCities, cityId]);
    } else {
      setBackupCities(backupCities.filter((c) => c !== cityId));
    }
    setError(null);
  };

  const saveCities = async () => {
    if (!driverData || !primaryCity) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Delete existing driver regions
      await supabase
        .from("driver_regions")
        .delete()
        .eq("user_id", driverData.id);

      // Insert primary city
      await supabase.from("driver_regions").insert({
        user_id: driverData.id,
        city_id: primaryCity,
        is_primary: true,
      });

      // Insert backup cities
      for (const cityId of backupCities) {
        await supabase.from("driver_regions").insert({
          user_id: driverData.id,
          city_id: cityId,
          is_primary: false,
        });
      }

      // Refresh driver regions
      const { data: regionsData } = await supabase
        .from("driver_regions")
        .select("*")
        .eq("user_id", driverData.id);

      if (regionsData) {
        // Update state with new data
        const primary = regionsData.find((region) => region.is_primary);
        if (primary) {
          setPrimaryCity(primary.city_id);
        } else {
          setPrimaryCity(null);
        }

        const backups = regionsData
          .filter((region) => !region.is_primary)
          .map((region) => region.city_id);
        setBackupCities(backups);
      }

      setSuccess("Regiões salvas com sucesso!");
    } catch (err) {
      console.error("Error saving cities:", err);
      setError("Erro ao salvar regiões. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shopee-orange"></div>
      </div>
    );
  }

  if (!driverData) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium">
          Erro ao carregar dados do entregador
        </h3>
        <p className="text-gray-500">Por favor, tente novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="regions" className="w-full">
        <TabsList className="grid w-full grid-cols-1 mb-8">
          <TabsTrigger value="regions" className="text-base py-3">
            <MapPin className="mr-2 h-4 w-4" />
            Regiões de Atuação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="regions" className="space-y-6">
          <Card className="border-orange-100 shadow-md">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Preferências de Regiões
              </CardTitle>
              <CardDescription className="text-orange-100">
                Selecione sua região principal e até 2 regiões de backup (máximo
                de 3 regiões no total)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  {success}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-shopee-orange" />
                    Região Principal
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {cities.map((city) => (
                      <div
                        key={`primary-${city.id}`}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="radio"
                          id={`primary-${city.id}`}
                          name="primaryCity"
                          checked={primaryCity === city.id}
                          onChange={() => handlePrimaryCityChange(city.id)}
                          className="text-shopee-orange focus:ring-shopee-orange h-4 w-4"
                        />
                        <Label
                          htmlFor={`primary-${city.id}`}
                          className="text-sm"
                        >
                          {city.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-shopee-orange" />
                    Regiões de Backup (máximo 2, total de 3 regiões)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {cities.map((city) => (
                      <div
                        key={`backup-${city.id}`}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`backup-${city.id}`}
                          checked={backupCities.includes(city.id)}
                          onCheckedChange={(checked) =>
                            handleBackupCityChange(city.id, checked as boolean)
                          }
                          disabled={primaryCity === city.id}
                          className="text-shopee-orange data-[state=checked]:bg-shopee-orange data-[state=checked]:border-shopee-orange"
                        />
                        <Label
                          htmlFor={`backup-${city.id}`}
                          className={`text-sm ${primaryCity === city.id ? "text-gray-400" : ""}`}
                        >
                          {city.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={saveCities}
                  disabled={saving || !primaryCity}
                  className="bg-shopee-orange hover:bg-orange-600 text-white mt-4"
                >
                  {saving ? "Salvando..." : "Salvar Regiões"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
