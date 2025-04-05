import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/utils/session";
import { isValidUUID, isValidCoordinate } from "@/utils/utils";
import fs from "fs";
import path from "path";
import { supabase } from "@/lib/supabase";

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 30;
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Rate limiting middleware function
// Import the database utility functions
import {
  insertHubLocationHistory,
  tableExists,
  updateHubLocation,
} from "@/utils/database";

// Function to ensure the hub_location_history table exists and insert a record
async function ensureHubLocationHistoryTable(
  hubId: string,
  userId: string,
  latitude: number,
  longitude: number,
  radius: number,
  action: string,
) {
  try {
    // First check if the table exists
    const exists = await tableExists("hub_location_history");

    if (!exists) {
      console.log(
        "Table does not exist, creating hub_location_history table directly...",
      );

      // Create the table directly with SQL
      try {
        // Create a simple insert with proper error handling
        const { data, error } = await supabase
          .from("hub_location_history")
          .insert([
            {
              hub_id: hubId,
              user_id: userId,
              latitude: parseFloat(String(latitude)),
              longitude: parseFloat(String(longitude)),
              radius: parseInt(String(radius)),
              action: action,
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) {
          if (error.code === "42P01") {
            // Table doesn't exist
            console.log(
              "Table doesn't exist, will need to be created via Supabase migrations",
            );
            return null;
          } else {
            console.error("Error inserting hub location history:", error);
            return null;
          }
        }

        return data;
      } catch (error) {
        console.error("Error in table creation process:", error);
        return null;
      }
    }

    // If table exists, use the utility function to insert the record
    const historyData = await insertHubLocationHistory(
      hubId,
      userId,
      latitude,
      longitude,
      radius,
      action,
    );

    if (!historyData) {
      console.error("Failed to insert hub location history record");
      return null;
    }

    console.log("Successfully inserted hub location history record");
    return historyData;
  } catch (error) {
    console.error("Unexpected error in ensureHubLocationHistoryTable:", error);
    return null;
  }
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const requestData = requestCounts.get(ip) || {
    count: 0,
    resetTime: now + RATE_LIMIT_WINDOW,
  };

  // Reset count if the window has expired
  if (now > requestData.resetTime) {
    requestData.count = 1;
    requestData.resetTime = now + RATE_LIMIT_WINDOW;
  } else {
    requestData.count += 1;
  }

  requestCounts.set(ip, requestData);
  return requestData.count <= MAX_REQUESTS_PER_WINDOW;
}

// Helper function to validate hubId
function validateHubId(hubId: string) {
  // First check if it's a valid UUID
  if (isValidUUID(hubId)) {
    return null;
  }

  // Then check if it's a valid number
  if (!isNaN(Number(hubId)) && hubId.trim() !== "") {
    return null;
  }

  // If neither, return error
  return NextResponse.json(
    { error: "Formato de ID do hub inválido" },
    { status: 400 },
  );
}

// GET endpoint to fetch hub location history
export async function GET(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      console.log(`Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente mais tarde." },
        { status: 429 },
      );
    }

    // Verify user is authenticated and is admin
    try {
      const user = await getServerUser();
      if (!user) {
        console.log("Authentication failed: No user found in session");
        return NextResponse.json(
          { error: "Não autorizado. Faça login novamente." },
          { status: 401 },
        );
      }

      if (user.permissions !== "admin") {
        console.log(`Permission denied: User ${user.id} is not an admin`);
        return NextResponse.json(
          {
            error:
              "Permissão negada. Apenas administradores podem acessar o histórico de localização.",
          },
          { status: 403 },
        );
      }
    } catch (authError) {
      console.error("Authentication error:", authError);
      return NextResponse.json(
        { error: "Erro de autenticação. Faça login novamente." },
        { status: 401 },
      );
    }

    // Get query parameters
    let url;
    try {
      url = new URL(request.url);
    } catch (urlError) {
      console.error("Invalid URL in request:", urlError);
      return NextResponse.json(
        { error: "URL de requisição inválida" },
        { status: 400 },
      );
    }

    const hubId = url.searchParams.get("hubId");
    const limitParam = url.searchParams.get("limit");

    if (!hubId) {
      console.log("Missing hubId parameter in request");
      return NextResponse.json(
        { error: "ID do hub não fornecido" },
        { status: 400 },
      );
    }

    // Validate hubId format
    const validationError = validateHubId(hubId);
    if (validationError) {
      console.log(`Invalid hubId format: ${hubId}`);
      return validationError;
    }

    // Validate and cap limit
    let limit;
    try {
      limit = limitParam ? parseInt(limitParam) : 20;
      if (isNaN(limit)) {
        console.log(`Invalid limit parameter: ${limitParam}`);
        limit = 20; // Default to 20 if parsing fails
      }
    } catch (parseError) {
      console.error("Error parsing limit parameter:", parseError);
      limit = 20; // Default to 20 on error
    }

    const validLimit = Math.min(Math.max(1, limit), 100); // Between 1 and 100

    // First, get the current hub data
    try {
      const { data: hubData, error: hubError } = await supabase
        .from("hubs")
        .select("*")
        .eq("id", hubId)
        .single();

      if (hubError && hubError.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        console.error(`Error fetching hub data for hubId ${hubId}:`, hubError);
        return NextResponse.json(
          { error: "Erro ao buscar dados do hub", details: hubError.message },
          { status: 500 },
        );
      }

      // Query hub location history
      const { data: historyData, error: historyError } = await supabase
        .from("hub_location_history")
        .select("*")
        .eq("hub_id", hubId)
        .order("created_at", { ascending: false })
        .limit(validLimit);

      // Separately fetch user names if needed
      let usersMap = {};
      if (historyData && historyData.length > 0) {
        try {
          const userIds = [
            ...new Set(historyData.map((item) => item.user_id)),
          ].filter(Boolean);

          if (userIds.length > 0) {
            const { data: users, error: usersError } = await supabase
              .from("users")
              .select("id, name")
              .in("id", userIds);

            if (usersError) {
              console.error("Error fetching user names:", usersError);
              // Continue without user names, not a critical error
            }

            if (users) {
              usersMap = users.reduce((acc, user) => {
                acc[user.id] = user.name;
                return acc;
              }, {});
            }
          }
        } catch (userMapError) {
          console.error("Error processing user map:", userMapError);
          // Continue without user names, not a critical error
        }
      }

      if (historyError) {
        console.error(
          `Error fetching hub location history for hubId ${hubId}:`,
          historyError,
        );
        return NextResponse.json(
          {
            error: "Erro ao buscar histórico de localização",
            details: historyError.message,
          },
          { status: 500 },
        );
      }

      // Format the response data
      const formattedHistory = historyData.map((entry) => ({
        id: entry.id,
        hubId: entry.hub_id,
        userId: entry.user_id,
        adminName: usersMap[entry.user_id] || "Usuário Desconhecido",
        latitude: entry.latitude,
        longitude: entry.longitude,
        radius: entry.radius,
        action: entry.action,
        timestamp: entry.created_at,
      }));

      // If we have hub data but no history, create a default history entry
      if (hubData && (!historyData || historyData.length === 0)) {
        const user = await getServerUser(); // Get user again to ensure we have the latest data
        const defaultHistory = {
          id: "default",
          hubId: hubData.id,
          userId: user.id,
          adminName: user.name || "Administrador",
          latitude: hubData.latitude || -23.5505,
          longitude: hubData.longitude || -46.6333,
          radius: hubData.check_in_radius || 500,
          action: "Configuração inicial",
          timestamp: hubData.created_at || new Date().toISOString(),
        };
        formattedHistory.push(defaultHistory);
      }

      return NextResponse.json({
        hub: hubData || null,
        history: formattedHistory,
      });
    } catch (dbError) {
      console.error(`Database operation error for hubId ${hubId}:`, dbError);
      return NextResponse.json(
        { error: "Erro ao acessar o banco de dados", details: dbError.message },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Unexpected error in hub location GET API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro interno do servidor", details: errorMessage },
      { status: 500 },
    );
  }
}

// POST endpoint to save hub location changes
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      console.log(`Rate limit exceeded for IP: ${ip} in POST request`);
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente mais tarde." },
        { status: 429 },
      );
    }

    // Verify user is authenticated and is admin
    let user;
    try {
      user = await getServerUser();
      if (!user) {
        console.log("Authentication failed in POST: No user found in session");
        return NextResponse.json(
          { error: "Não autorizado. Faça login novamente." },
          { status: 401 },
        );
      }

      if (user.permissions !== "admin") {
        console.log(
          `Permission denied in POST: User ${user.id} is not an admin`,
        );
        return NextResponse.json(
          {
            error:
              "Permissão negada. Apenas administradores podem atualizar a localização do hub.",
          },
          { status: 403 },
        );
      }
    } catch (authError) {
      console.error("Authentication error in POST:", authError);
      return NextResponse.json(
        {
          error: "Erro de autenticação. Faça login novamente.",
          details: authError.message,
        },
        { status: 401 },
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        {
          error: "Formato de requisição inválido",
          details: "O corpo da requisição deve ser um JSON válido",
        },
        { status: 400 },
      );
    }

    const { hubId, latitude, longitude, radius, action } = body;

    // Validate required fields
    if (
      !hubId ||
      latitude === undefined ||
      longitude === undefined ||
      !radius ||
      !action
    ) {
      console.log("Incomplete data for location update:", body);
      return NextResponse.json(
        {
          error: "Dados incompletos para atualização de localização",
          details:
            "Todos os campos (hubId, latitude, longitude, radius, action) são obrigatórios",
        },
        { status: 400 },
      );
    }

    // Log the incoming request data for debugging
    console.log("Processing hub location update:", {
      hubId,
      latitude,
      longitude,
      radius,
      action,
      userId: user.id,
    });

    // Validate hubId format
    const validationError = validateHubId(hubId);
    if (validationError) {
      console.log(`Invalid hubId format in POST: ${hubId}`);
      return validationError;
    }

    // Validate coordinates
    if (
      !isValidCoordinate(String(latitude)) ||
      !isValidCoordinate(String(longitude))
    ) {
      console.log(`Invalid coordinates: lat=${latitude}, lng=${longitude}`);
      return NextResponse.json(
        {
          error: "Coordenadas inválidas",
          details: "Latitude e longitude devem ser números válidos",
        },
        { status: 400 },
      );
    }

    // Validate radius
    if (isNaN(Number(radius)) || Number(radius) <= 0) {
      console.log(`Invalid radius: ${radius}`);
      return NextResponse.json(
        {
          error: "Raio inválido",
          details: "O raio deve ser um número positivo",
        },
        { status: 400 },
      );
    }

    try {
      // Check if hub exists
      const { data: hubExists, error: hubCheckError } = await supabase
        .from("hubs")
        .select("id")
        .eq("id", hubId)
        .maybeSingle();

      if (hubCheckError) {
        console.error(
          `Error checking hub existence for hubId ${hubId}:`,
          hubCheckError,
        );
        return NextResponse.json(
          {
            error: "Erro ao verificar existência do hub",
            details: hubCheckError.message,
          },
          { status: 500 },
        );
      }

      // If hub doesn't exist, create it
      if (!hubExists) {
        console.log(`Hub ${hubId} does not exist, creating new hub...`);
        try {
          const { error: createHubError } = await supabase.from("hubs").insert([
            {
              id: hubId,
              name: "Hub " + hubId,
              latitude: parseFloat(String(latitude)),
              longitude: parseFloat(String(longitude)),
              check_in_radius: parseInt(String(radius)),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);

          if (createHubError) {
            console.error(`Error creating hub ${hubId}:`, createHubError);
            return NextResponse.json(
              { error: "Erro ao criar hub", details: createHubError.message },
              { status: 500 },
            );
          }
          console.log(`Successfully created new hub ${hubId}`);
        } catch (createError) {
          console.error(`Exception creating hub ${hubId}:`, createError);
          return NextResponse.json(
            { error: "Erro ao criar hub", details: createError.message },
            { status: 500 },
          );
        }
      } else {
        console.log(`Hub ${hubId} exists, proceeding with location update`);
      }

      // Insert hub location history record
      let historyData;
      try {
        // First, ensure the table exists
        console.log(
          "Ensuring hub_location_history table exists and inserting record...",
        );
        historyData = await ensureHubLocationHistoryTable(
          hubId,
          user.id,
          latitude,
          longitude,
          radius,
          action,
        );

        if (!historyData) {
          console.error(
            `Failed to create hub location history record for hubId ${hubId}`,
          );
          return NextResponse.json(
            {
              error: "Erro ao registrar histórico de localização",
              details: "Falha ao criar registro de histórico",
            },
            { status: 500 },
          );
        }
        console.log(
          `Successfully created hub location history record for hubId ${hubId}`,
        );
      } catch (historyError) {
        console.error(
          `Unexpected error in hub location history creation for hubId ${hubId}:`,
          historyError,
        );
        return NextResponse.json(
          {
            error: "Erro ao registrar histórico de localização",
            details: historyError.message,
          },
          { status: 500 },
        );
      }

      // Update hub location in hubs table
      try {
        const { error: hubUpdateError } = await supabase
          .from("hubs")
          .update({
            latitude: parseFloat(String(latitude)),
            longitude: parseFloat(String(longitude)),
            check_in_radius: parseInt(String(radius)),
            updated_at: new Date().toISOString(),
          })
          .eq("id", hubId);

        if (hubUpdateError) {
          console.error(
            `Error updating hub location for hubId ${hubId}:`,
            hubUpdateError,
          );
          return NextResponse.json(
            {
              error: "Erro ao atualizar localização do hub",
              details: hubUpdateError.message,
            },
            { status: 500 },
          );
        }
      } catch (updateError) {
        console.error(
          `Exception updating hub location for hubId ${hubId}:`,
          updateError,
        );
        return NextResponse.json(
          {
            error: "Erro ao atualizar localização do hub",
            details: updateError.message,
          },
          { status: 500 },
        );
      }

      // Get the user's name for the response
      let adminName = "Administrador";
      try {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("name")
          .eq("id", user.id)
          .single();

        if (!userError && userData) {
          adminName = userData.name || "Administrador";
        } else if (userError) {
          console.warn(
            `Error fetching user name for userId ${user.id}:`,
            userError,
          );
          // Continue with default name, not a critical error
        }
      } catch (userError) {
        console.warn(
          `Exception fetching user name for userId ${user.id}:`,
          userError,
        );
        // Continue with default name, not a critical error
      }

      return NextResponse.json({
        success: true,
        history: {
          id: historyData.id,
          hubId: historyData.hub_id,
          userId: historyData.user_id,
          adminName: adminName,
          latitude: historyData.latitude,
          longitude: historyData.longitude,
          radius: historyData.radius,
          action: historyData.action,
          timestamp: historyData.created_at,
        },
      });
    } catch (dbError) {
      console.error(`Database operation error for hubId ${hubId}:`, dbError);
      return NextResponse.json(
        { error: "Erro ao acessar o banco de dados", details: dbError.message },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Unexpected error in hub location POST API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro interno do servidor", details: errorMessage },
      { status: 500 },
    );
  }
}
