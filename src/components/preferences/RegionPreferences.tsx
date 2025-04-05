"use client";

import { useState, useEffect } from "react";
import { User } from "@/utils/auth";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { AlertCircle, CheckCircle2, MapPin, Search } from "lucide-react";
import { City } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

interface RegionPreferencesProps {
  user: User;
}

export default function RegionPreferences({ user }: RegionPreferencesProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [primaryCity, setPrimaryCity] = useState<number | null>(null);
  const [backupCities, setBackupCities] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (!user?.hub_id) return;

      setLoading(true);
      try {
        // Fetch cities for the user's hub
        const response = await fetch(`/api/cities?hub_id=${user.hub_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch cities");
        }

        const data = await response.json();
        setCities(data.cities || []);

        // Fetch user preferences
        const prefsResponse = await fetch(`/api/preferences`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (prefsResponse.ok) {
          const prefsData = await prefsResponse.json();

          if (prefsData.preferences) {
            // Convert from JSONB to array if necessary
            const primaryRegions = Array.isArray(
              prefsData.preferences.primary_regions,
            )
              ? prefsData.preferences.primary_regions
              : JSON.parse(prefsData.preferences.primary_regions || "[]");

            const backupRegions = Array.isArray(
              prefsData.preferences.backup_regions,
            )
              ? prefsData.preferences.backup_regions
              : JSON.parse(prefsData.preferences.backup_regions || "[]");

            if (primaryRegions.length > 0) {
              setPrimaryCity(primaryRegions[0]);
            }
            setBackupCities(backupRegions);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Erro ao carregar dados. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchData();
    }
  }, [user]);

  const handlePrimaryCityChange = (cityId: number) => {
    // If city is already in backup cities, remove it
    if (backupCities.includes(cityId)) {
      setBackupCities(backupCities.filter((c) => c !== cityId));
    }
    setPrimaryCity(cityId);
    setError(null);
    setSuccess(null);
  };

  const handleBackupCityChange = (cityId: number, checked: boolean) => {
    if (checked) {
      // Don't allow more than 3 backup cities
      if (backupCities.length >= 3) {
        setError("Você não pode selecionar mais de 3 regiões de backup");
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
    setSuccess(null);
  };

  const savePreferences = async () => {
    if (!primaryCity || !user) {
      setError("Selecione uma região principal");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Save preferences to the database using city IDs (integers)
      const response = await fetch(`/api/preferences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          primary_regions: [primaryCity], // Send the ID (integer) not the name
          backup_regions: backupCities, // Send array of IDs (integers) not names
          hub_id: user.hub_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save preferences");
      }

      setSuccess("Preferências salvas com sucesso!");
    } catch (err: any) {
      console.error("Error saving preferences:", err);
      setError(`Erro ao salvar preferências: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Filter cities based on search term
  const filteredCities = cities.filter((city) =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shopee-orange"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="border-orange-100 dark:border-orange-900 shadow-md bg-white dark:bg-gray-800">
        <CardHeader className="bg-orange-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Atualizar Regiões
          </CardTitle>
          <p className="text-sm text-orange-100">
            Selecione sua região principal e até 3 regiões de backup onde você
            está disponível para trabalhar
          </p>
        </CardHeader>

        <CardContent className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-md flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-md flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              {success}
            </div>
          )}

          {cities.length === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-5 w-5" />
              <p>Não atendemos nenhuma cidade em seu hub no momento.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2 dark:text-white">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  Região Principal
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Esta é sua principal região de trabalho.
                </p>

                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Buscar cidade..."
                    className="pl-10 border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md dark:border-gray-700">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <div
                        key={`primary-${city.id}`}
                        className="flex items-center space-x-2 p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-colors"
                      >
                        <input
                          type="radio"
                          id={`primary-${city.id}`}
                          name="primaryCity"
                          checked={primaryCity === city.id}
                          onChange={() => handlePrimaryCityChange(city.id)}
                          className="text-orange-500 focus:ring-orange-500 h-4 w-4"
                        />
                        <Label
                          htmlFor={`primary-${city.id}`}
                          className="text-sm cursor-pointer dark:text-gray-200"
                        >
                          {city.name}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 p-4 text-center text-gray-500 dark:text-gray-400">
                      Nenhuma cidade encontrada
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2 dark:text-white">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  Regiões de Backup
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Selecione até 3 regiões de backup:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md dark:border-gray-700">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <div
                        key={`backup-${city.id}`}
                        className={`flex items-center space-x-2 p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-colors ${primaryCity === city.id ? "opacity-50" : ""}`}
                      >
                        <Checkbox
                          id={`backup-${city.id}`}
                          checked={backupCities.includes(city.id)}
                          onCheckedChange={(checked) =>
                            handleBackupCityChange(city.id, checked as boolean)
                          }
                          disabled={primaryCity === city.id}
                          className="text-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                        <Label
                          htmlFor={`backup-${city.id}`}
                          className={`text-sm cursor-pointer ${primaryCity === city.id ? "text-gray-400 dark:text-gray-600" : "dark:text-gray-200"}`}
                        >
                          {city.name}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 p-4 text-center text-gray-500 dark:text-gray-400">
                      Nenhuma cidade encontrada
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={savePreferences}
                disabled={saving || !primaryCity}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                {saving ? "Salvando..." : "Salvar Preferências de Região"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
