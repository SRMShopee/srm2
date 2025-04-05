"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { useForm } from "react-hook-form";
import * as XLSX from "xlsx";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileUp,
  FileSpreadsheet,
  Loader2,
  AlertTriangle,
  Check,
} from "lucide-react";
import { useToast } from "../components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

// Create a Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface IForm {
  file: FileList;
}

// Function to convert Excel to JSON with optimized options
const convertExcelToJson = (buffer: ArrayBuffer) => {
  try {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to array with numeric headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "", // Default value for empty cells
      raw: false, // Don't convert values
    }) as any[][];

    console.log("Dados convertidos do Excel:", jsonData.slice(0, 3)); // Log first 3 rows for debug
    return jsonData;
  } catch (error) {
    console.error("Erro ao converter Excel para JSON:", error);
    throw new Error("Falha ao processar arquivo Excel. Formato inválido.");
  }
};

// Function to process Excel data and extract route information
const processExcelData = (data: any[][]) => {
  if (data.length <= 1) return null; // No data or only header

  // Skip header
  const neighborhoods = new Set<string>();
  let city = "";
  let totalPackages = 0; // Will accumulate all packages
  let maxDistance = 0;

  // Process all rows to extract information
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 9) continue;

    // Specific indices as informed by the user
    // Index 6: Full address
    // Index 7: City
    // Index 8: Neighborhood
    const cityValue = row[7] ? String(row[7]).trim() : "";
    const neighborhood = row[8] ? String(row[8]).trim() : "";

    // Package count (index 2)
    const packages = row[2] ? parseInt(String(row[2]).trim()) : 0;
    totalPackages += packages;

    // Distance (index 3)
    const distanceStr = row[3] ? String(row[3]).trim() : "0";
    const distance = parseFloat(
      distanceStr.replace(/[^\d.,]/g, "").replace(",", "."),
    );
    maxDistance = distance;

    // Collect unique neighborhoods
    if (neighborhood) {
      neighborhoods.add(neighborhood);
    }

    // Get the first valid city found
    if (!city && cityValue) {
      city = cityValue;
    }
  }

  return {
    neighborhoods: Array.from(neighborhoods),
    city,
    packages: totalPackages,
    distance: maxDistance,
  };
};

interface RouteImportProps {
  user: any;
}

const RouteImport = ({ user }: RouteImportProps) => {
  const { toast } = useToast();

  // Function to add notification to the system
  const addNotification = (title: string, message: string) => {
    const newNotification = {
      id: Date.now().toString(),
      title,
      message,
      time: new Date().toISOString(),
      read: false,
    };

    // Get existing notifications
    const savedNotifications = localStorage.getItem("adminNotifications");
    const existingNotifications = savedNotifications
      ? JSON.parse(savedNotifications)
      : [];

    // Add new notification at the beginning and limit to 20
    const updatedNotifications = [
      newNotification,
      ...existingNotifications.slice(0, 19),
    ];

    // Save to localStorage
    localStorage.setItem(
      "adminNotifications",
      JSON.stringify(updatedNotifications),
    );

    // Dispatch event to update other tabs/windows
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "adminNotifications",
        newValue: JSON.stringify(updatedNotifications),
      }),
    );
  };

  // Function to dispatch route update event
  const dispatchRouteUpdateEvent = () => {
    try {
      console.log("Disparando evento de atualização de rota");
      // Use a custom event to notify other components
      window.dispatchEvent(new CustomEvent("routes-updated"));

      // Force update of localStorage as well
      const savedRoutes = localStorage.getItem("importedRoutes");
      if (savedRoutes) {
        // Just to force a storage event
        localStorage.setItem("importedRoutes", savedRoutes);
      }

      // Dispatch storage event for compatibility
      try {
        // Create a new storage event manually
        const storageEvent = new StorageEvent("storage");
        // Set properties manually
        Object.defineProperty(storageEvent, "key", { value: "importedRoutes" });
        Object.defineProperty(storageEvent, "newValue", { value: savedRoutes });

        window.dispatchEvent(storageEvent);
        console.log("Evento de armazenamento disparado");
      } catch (storageError) {
        console.error(
          "Erro ao disparar evento de armazenamento:",
          storageError,
        );
        // Ignore storage event errors
      }
    } catch (error) {
      console.error("Erro ao disparar evento de atualização:", error);
      // Fail silently if unable to dispatch event
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedShift, setSelectedShift] = useState<"AM" | "PM" | "OUROBOROS">(
    "AM",
  );
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [loadingTime, setLoadingTime] = useState("08:00");
  const [excelData, setExcelData] = useState<any[][]>([]);
  const [previewData, setPreviewData] = useState<{
    neighborhoods: string[];
    city: string;
    packages: number;
    distance: number;
  } | null>(null);

  // Using react-hook-form to manage the file
  const { register, watch, reset } = useForm<IForm>();
  const file = watch("file");

  // Process the file when selected
  useEffect(() => {
    if (file && file.length > 0) {
      // Check if all files are Excel
      for (let i = 0; i < file.length; i++) {
        const fileName = file[i].name.toLowerCase();
        if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
          setError(
            `O arquivo "${file[i].name}" não é um arquivo Excel válido. Por favor, selecione apenas arquivos Excel (.xlsx, .xls)`,
          );
          return;
        }
      }

      // Process the first file (for preview)
      file[0].arrayBuffer().then((buffer) => {
        try {
          const data = convertExcelToJson(buffer);
          setExcelData(data);

          // Extract data for preview using the refactored function
          const processedData = processExcelData(data);
          if (processedData) {
            setPreviewData(processedData);
          }

          setError(null);
        } catch (err) {
          console.error("Erro ao processar arquivo Excel:", err);
          setError(
            `Erro ao processar o arquivo "${file[0].name}". Verifique se o formato é válido.`,
          );
          setPreviewData(null);
        }
      });
    }
  }, [file]);

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "";
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error, dateString);
      return dateString || "";
    }
  };

  const handleImport = async () => {
    if (!file || file.length === 0) {
      setError("Por favor, selecione pelo menos um arquivo");
      return;
    }

    if (excelData.length === 0) {
      setError("Não foi possível processar os dados do arquivo");
      return;
    }

    // Check again if all files are Excel
    for (let i = 0; i < file.length; i++) {
      const fileName = file[i].name.toLowerCase();
      if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
        setError(
          `O arquivo "${file[i].name}" não é um arquivo Excel válido. Por favor, selecione apenas arquivos Excel (.xlsx, .xls)`,
        );
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Process each selected file
      const importPromises = [];

      for (let fileIndex = 0; fileIndex < file.length; fileIndex++) {
        const currentFile = file[fileIndex];

        // Create a promise to process each file
        const processFilePromise = new Promise(async (resolve, reject) => {
          try {
            const buffer = await currentFile.arrayBuffer();
            const fileData = convertExcelToJson(buffer);

            // Skip the first row (header)
            const dataRows = fileData.slice(1);

            console.log(
              `Iniciando processamento da rota ${fileIndex + 1}/${file.length}`,
              `Linhas encontradas: ${dataRows.length}`,
            );

            // Structure to store route data
            const routeData = {
              file_name: currentFile.name,
              city: "",
              neighborhoods: new Set<string>(),
              total_distance: 0,
              sequence: 0, // Total packages
              route_name: "",
              shift: selectedShift,
              created_at: new Date().toISOString(),
              raw_data: fileData, // Store complete data
            };

            // Process each row to extract data
            for (let i = 0; i < dataRows.length; i++) {
              const row = dataRows[i];
              if (!row || row.length < 9) continue;

              // Specific indices as informed by the user
              // Index 6: Full address
              // Index 7: City
              // Index 8: Neighborhood
              const address = row[6] ? String(row[6]).trim() : "";
              const cityValue = row[7] ? String(row[7]).trim() : "";
              const neighborhood = row[8] ? String(row[8]).trim() : "";

              // Package count (index 2)
              const packages = row[2] ? parseInt(String(row[2]).trim()) : 0;

              // Distance (index 3)
              const distanceStr = row[3] ? String(row[3]).trim() : "0";
              const distance = parseFloat(
                distanceStr.replace(/[^\d.,]/g, "").replace(",", "."),
              );

              // Increment package count
              if (!isNaN(packages) && packages > 0) {
                routeData.sequence += packages;
              }

              // Update total distance (get the largest)
              if (!isNaN(distance) && distance > routeData.total_distance) {
                routeData.total_distance = distance;
              }

              // Set city (first found)
              if (!routeData.city && cityValue) {
                routeData.city = cityValue;
              }

              // Add neighborhood to the set
              if (neighborhood) {
                routeData.neighborhoods.add(neighborhood);
              }

              // Route name (index 15, if available)
              if (row.length > 15 && row[15] && !routeData.route_name) {
                routeData.route_name = String(row[15]).trim();
              }
            }

            // If route name not found, use file name
            if (!routeData.route_name) {
              routeData.route_name = currentFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
            }

            // If city not found, use "Not specified"
            if (!routeData.city) {
              routeData.city = "Cidade não especificada";
            }

            // Ensure sequence has a minimum value
            if (routeData.sequence <= 0) {
              routeData.sequence = dataRows.length;
            }

            // Generate a unique ID for the route
            const routeId = uuidv4();

            // Finalize data processing
            const finalRouteData = {
              id: routeId,
              file_name: routeData.route_name || currentFile.name,
              city: routeData.city,
              neighborhoods: Array.from(routeData.neighborhoods),
              total_distance: routeData.total_distance || 0,
              sequence: routeData.sequence || dataRows.length,
              shift: selectedShift,
              created_at: new Date().toISOString(),
              raw_data: fileData, // Store complete data
            };

            console.log(`ID da rota gerado para ${currentFile.name}:`, routeId);
            console.log(
              `Dados finais para importação de ${currentFile.name}:`,
              {
                ...finalRouteData,
                neighborhoods:
                  finalRouteData.neighborhoods.length > 0
                    ? finalRouteData.neighborhoods.slice(0, 5) +
                      (finalRouteData.neighborhoods.length > 5
                        ? ` e mais ${finalRouteData.neighborhoods.length - 5}`
                        : "")
                    : "Nenhum bairro encontrado",
              },
            );

            // Check if a route with the same name, shift and date already exists
            try {
              // First check if a similar route already exists
              const { data: existingRoutes, error: checkError } = await supabase
                .from("routes")
                .select("id, file_name, shift")
                .eq("file_name", finalRouteData.file_name)
                .eq("shift", finalRouteData.shift);

              if (checkError) {
                console.error(
                  `Erro ao verificar rotas existentes para ${currentFile.name}:`,
                  checkError,
                );
                // Continue even with verification error
                console.log(
                  `Continuando mesmo com erro de verificação para ${currentFile.name}`,
                );
              }

              // If a similar route already exists, show warning and skip this file
              if (existingRoutes && existingRoutes.length > 0) {
                // Show toast warning to user
                toast({
                  title: "Rota duplicada",
                  description: `Uma rota com o nome ${
                    finalRouteData.file_name
                  } para o turno ${finalRouteData.shift} já existe.`,
                  variant: "warning",
                });

                // Add notification to system
                addNotification(
                  "Rota duplicada",
                  `A rota ${finalRouteData.file_name} para o turno ${
                    finalRouteData.shift
                  } já existe e não foi importada novamente.`,
                );

                resolve({
                  success: false,
                  fileName: currentFile.name,
                  error: "Rota duplicada",
                  message: `Uma rota com o nome ${
                    finalRouteData.file_name
                  } para o turno ${finalRouteData.shift} já existe.`,
                });
                return;
              }

              // Get the admin's hub_id
              const { data: adminData, error: adminError } = await supabase
                .from("users")
                .select("hub_id")
                .eq("id", user.id)
                .single();

              if (adminError) {
                console.error("Error fetching admin hub_id:", adminError);
                throw new Error(
                  "Não foi possível obter o hub_id do administrador",
                );
              }

              // Buscar a cidade pelo nome e hub_id
              const { data: cityData, error: cityError } = await supabase
                .from("cities")
                .select("id")
                .eq("name", finalRouteData.city.toUpperCase())
                .eq("hub_id", adminData.hub_id);

              if (cityError) {
                console.error("Error fetching city:", cityError);
                throw new Error("Erro ao buscar cidade no banco de dados");
              }

              // Se a cidade não for encontrada, não podemos criar uma rota
              if (!cityData || cityData.length === 0) {
                console.error(
                  `Cidade ${finalRouteData.city} não encontrada para o hub ${adminData.hub_id}`,
                );
                throw new Error(
                  `A cidade ${finalRouteData.city} não está cadastrada no sistema. Por favor, cadastre a cidade antes de importar a rota.`,
                );
              }

              // Usar o ID da primeira cidade encontrada
              const cityId = cityData[0].id;

              // Prepare data for insertion into Supabase
              const supabaseRouteData = {
                id: finalRouteData.id,
                hub_id: adminData.hub_id,
                city_id: cityId,
                name: finalRouteData.file_name,
                neighborhoods: finalRouteData.neighborhoods.join(", "),
                distance: finalRouteData.total_distance.toString(),
                packages: finalRouteData.sequence,
                shift: finalRouteData.shift,
                content: JSON.stringify(finalRouteData.raw_data),
              };

              console.log(`Salvando no Supabase para ${currentFile.name}:`, {
                ...supabaseRouteData,
                neighborhoods:
                  supabaseRouteData.neighborhoods.length > 0
                    ? supabaseRouteData.neighborhoods.slice(0, 5) +
                      (supabaseRouteData.neighborhoods.length > 5
                        ? ` e mais ${
                            supabaseRouteData.neighborhoods.length - 5
                          }`
                        : "")
                    : "Nenhum bairro encontrado",
                content: "[Dados completos omitidos para log]",
              });

              const { data, error } = await supabase
                .from("routes")
                .insert([supabaseRouteData])
                .select();

              console.log(`Resposta do Supabase para ${currentFile.name}:`, {
                data: data ? "Dados recebidos" : "Sem dados",
                error,
              });

              // If there's an error in Supabase
              if (error) {
                console.error(
                  `Erro ao salvar no Supabase para ${currentFile.name}:`,
                  error,
                );
                console.error(
                  "Detalhes do erro:",
                  error.details,
                  error.hint,
                  error.message,
                );

                // Show error notification
                toast({
                  title: "Erro ao salvar rota",
                  description: `Não foi possível salvar a rota ${finalRouteData.file_name} no banco de dados. Erro: ${error.message}`,
                  variant: "destructive",
                });

                // Add notification to system
                addNotification(
                  "Erro ao importar rota",
                  `Ocorreu um erro ao importar a rota ${finalRouteData.file_name}. Erro: ${error.message}`,
                );

                resolve({
                  success: false,
                  fileName: currentFile.name,
                  error: error.message,
                });
              } else {
                // Success saving to Supabase
                if (data && data.length > 0) {
                  const route = data[0];

                  // Add notification for successfully imported route
                  addNotification(
                    "Rota importada",
                    `A rota ${route.name} (${
                      route.file_name
                    }) foi importada com sucesso para o turno ${route.shift}.`,
                  );

                  // Dispatch event to update other parts of the application
                  dispatchRouteUpdateEvent();
                }

                resolve({
                  success: true,
                  fileName: currentFile.name,
                  local: false,
                });
              }
            } catch (dbError) {
              console.error(
                `Erro ao salvar no banco de dados para ${currentFile.name}:`,
                dbError,
              );

              // Show error notification
              toast({
                title: "Erro ao salvar rota",
                description: `Não foi possível salvar a rota ${finalRouteData.file_name} no banco de dados. Erro: ${dbError.message}`,
                variant: "destructive",
              });

              // Add notification to system
              addNotification(
                "Erro ao importar rota",
                `Ocorreu um erro ao importar a rota ${finalRouteData.file_name}. Erro: ${dbError.message}`,
              );

              resolve({
                success: false,
                fileName: currentFile.name,
                error: dbError.message,
              });
            }
          } catch (processError) {
            console.error(
              `Erro ao processar arquivo ${currentFile.name}:`,
              processError,
            );
            reject({
              success: false,
              fileName: currentFile.name,
              error: processError.message,
            });
          }
        });

        importPromises.push(processFilePromise);
      }

      // Wait for all imports to complete
      const results = await Promise.allSettled(importPromises);
      console.log("Resultados de todas as importações:", results);

      // Check results
      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value && r.value.success,
      ).length;
      const failed = results.filter(
        (r) =>
          r.status === "rejected" ||
          (r.status === "fulfilled" && r.value && !r.value.success),
      ).length;

      console.log("Import results:", {
        successful,
        failed,
        results: results.map((r) =>
          r.status === "fulfilled" ? r.value : r.reason,
        ),
      });

      if (successful > 0 || results.length === 0) {
        setSuccess(true);

        // Show success notification with toast
        toast({
          title: `${successful} ${
            successful === 1 ? "rota importada" : "rotas importadas"
          } com sucesso`,
          description: `${successful} ${
            successful === 1 ? "rota foi importada" : "rotas foram importadas"
          } para o turno ${selectedShift}.${
            failed > 0
              ? ` ${failed} ${failed === 1 ? "arquivo falhou" : "arquivos falharam"}.`
              : ""
          }`,
          variant: "default",
        });

        // Close window immediately after successful import
        setIsOpen(false);
        reset(); // Clear form
        setExcelData([]);
        setSuccess(false);
        // Don't apply filters automatically after import
      } else if (failed > 0) {
        // If all failed, show error
        setError(
          `Falha ao importar ${failed} ${
            failed === 1 ? "arquivo" : "arquivos"
          }. Verifique os logs para mais detalhes.`,
        );

        // Show error notification
        toast({
          title: "Erro ao importar rotas",
          description: `Ocorreu um erro ao importar as rotas. Por favor, verifique os arquivos e tente novamente.`,
          variant: "destructive",
        });
      }

      // Notifications are handled above for each case
    } catch (err) {
      console.error("Erro ao importar rotas:", err);
      setError("Erro ao importar rotas. Por favor, tente novamente.");

      // Show error notification
      toast({
        title: "Erro ao importar rota",
        description:
          "Ocorreu um erro ao importar a rota. Por favor, verifique o arquivo e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] rounded-full px-5 py-6">
          <FileUp className="h-5 w-5" />
          Importar Rotas
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[600px] bg-white dark:bg-gray-900 rounded-xl border-orange-200"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl text-orange-700">
            <FileSpreadsheet className="h-7 w-7 text-orange-500" />
            Importar Rotas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Turno</Label>
              <Select
                value={selectedShift}
                onValueChange={(value: "AM" | "PM" | "OUROBOROS") =>
                  setSelectedShift(value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM (3:30 - 7:30)</SelectItem>
                  <SelectItem value="PM">PM (11:00 - 13:30)</SelectItem>
                  <SelectItem value="OUROBOROS">
                    OUROBOROS (15:00 - 17:30)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Data</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Horário de Carregamento
              </Label>
              <Input
                type="time"
                value={loadingTime}
                onChange={(e) => setLoadingTime(e.target.value)}
                className="w-full"
                placeholder="HH:MM"
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-orange-200 dark:border-orange-700 rounded-xl bg-gradient-to-b from-orange-50 to-white dark:bg-gray-800/50 transition-all duration-300 hover:border-orange-500 dark:hover:border-orange-600 shadow-sm">
            <FileSpreadsheet className="h-16 w-16 text-orange-500 mb-4" />
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 text-center">
              Selecione um ou mais arquivos Excel (.xlsx, .xls) contendo os
              dados das rotas.
              <br />
              <span className="text-xs text-orange-600 dark:text-orange-400 block mt-2 font-medium">
                Extrairemos: Quantidade de Pacotes, Distância Total, Cidade,
                Bairros e Nome da Rota
              </span>
            </p>
            <Label
              htmlFor="file-upload"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-5 rounded-full cursor-pointer transition-all duration-200 hover:shadow-md flex items-center gap-2 font-medium"
            >
              <FileUp className="h-5 w-5" />
              Selecionar Arquivos
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              multiple
              className="hidden"
              {...register("file")}
            />
          </div>

          {file && file.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {file.length}{" "}
                  {file.length === 1
                    ? "arquivo selecionado"
                    : "arquivos selecionados"}
                </span>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {Array.from(file).map((f, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800/30 shadow-sm"
                  >
                    <FileSpreadsheet className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-orange-700 dark:text-orange-300 block truncate">
                        {f.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {(f.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {previewData && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-green-50/50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/30 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 p-2 rounded-full">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Arquivo processado com sucesso!
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 bg-white p-2 rounded-md border border-green-100">
                <p className="flex justify-between mb-1">
                  <span>Cidade:</span>
                  <span className="font-medium text-green-700">
                    {previewData.city || "Não identificada"}
                  </span>
                </p>
                <p className="flex justify-between mb-1">
                  <span>Pacotes:</span>
                  <span className="font-medium text-green-700">
                    {previewData.packages}
                  </span>
                </p>
                <p className="flex justify-between mb-1">
                  <span>Distância:</span>
                  <span className="font-medium text-green-700">
                    {previewData.distance.toFixed(2)} km
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>Bairros encontrados:</span>
                  <span className="font-medium text-green-700">
                    {previewData.neighborhoods.length}
                  </span>
                </p>
                {previewData.neighborhoods.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">
                      Primeiros bairros:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {previewData.neighborhoods
                        .slice(0, 5)
                        .map((neighborhood, index) => (
                          <span
                            key={index}
                            className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full"
                          >
                            {neighborhood}
                          </span>
                        ))}
                      {previewData.neighborhoods.length > 5 && (
                        <span className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                          +{previewData.neighborhoods.length - 5} mais
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-red-50/50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800/30 shadow-sm">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
              </div>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-50/50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800/30 shadow-sm">
              <div className="bg-green-100 p-2 rounded-full">
                <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
              </div>
              <div>
                <span className="text-sm font-medium block">
                  Rotas importadas com sucesso!
                </span>
                <span className="text-xs text-gray-600">
                  A rota já está disponível para visualização
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              reset();
              setExcelData([]);
              setPreviewData(null);
              setError(null);
            }}
            disabled={isLoading}
            className="rounded-full border-gray-200 hover:bg-gray-50 transition-all duration-200"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={isLoading || !file || file.length === 0}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-all duration-300 rounded-full shadow-md"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <FileUp className="h-5 w-5 mr-2" />
                Importar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RouteImport;
