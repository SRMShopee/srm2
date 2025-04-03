"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { User } from "@/utils/auth";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { AlertCircle, CheckCircle2, MapPin } from "lucide-react";
import { City } from "@/types";

interface RegionPreferencesProps {
  user: User;
}

// Create a Supabase client for database operations only (not auth)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function RegionPreferences({ user }: RegionPreferencesProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [primaryCity, setPrimaryCity] = useState<number | null>(null);
  const [backupCities, setBackupCities] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user?.hub_id) return;

      setLoading(true);
      try {
        // Fetch cities for the user's hub
        const { data: citiesData, error: citiesError } = await supabase
          .from("cities")
          .select("*")
          .eq("hub_id", user.hub_id);

        if (citiesError) throw citiesError;
        setCities(citiesData || []);

        // Fetch user preferences
        const { data: prefsData, error: prefsError } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (prefsError && prefsError.code !== "PGRST116") throw prefsError;

        if (prefsData) {
          // Convert from JSONB to array if necessary
          const primaryRegions = Array.isArray(prefsData.primary_regions)
            ? prefsData.primary_regions
            : JSON.parse(prefsData.primary_regions || "[]");

          const backupRegions = Array.isArray(prefsData.backup_regions)
            ? prefsData.backup_regions
            : JSON.parse(prefsData.backup_regions || "[]");

          if (primaryRegions.length > 0) {
            setPrimaryCity(primaryRegions[0]);
          }
          setBackupCities(backupRegions);
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
      // Don't allow more than 2 backup cities
      if (backupCities.length >= 2) {
        setError("Você não pode selecionar mais de 2 regiões de backup");
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
      // Save preferences to the database
      const { error } = await supabase.from("user_preferences").upsert({
        user_id: user.id,
        primary_regions: [primaryCity],
        backup_regions: backupCities,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setSuccess("Preferências salvas com sucesso!");
    } catch (err: any) {
      console.error("Error saving preferences:", err);
      setError(`Erro ao salvar preferências: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shopee-orange"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow-md">
      <div className="p-4 border-b bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Preferências de Regiões
        </h2>
        <p className="text-sm text-orange-100">
          Selecione sua região principal e até 2 regiões de backup
        </p>
      </div>

      <div className="p-6">
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
                  <Label htmlFor={`primary-${city.id}`} className="text-sm">
                    {city.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-shopee-orange" />
              Regiões de Backup (máximo 2)
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
            onClick={savePreferences}
            disabled={saving || !primaryCity}
            className="w-full bg-shopee-orange hover:bg-orange-600 text-white"
          >
            {saving ? "Salvando..." : "Salvar Preferências"}
          </Button>
        </div>
      </div>
    </div>
  );
}
