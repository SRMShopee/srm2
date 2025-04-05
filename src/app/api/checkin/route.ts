import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/utils/session";
import { sanitizeInput, isValidUUID } from "@/utils/utils";
import { supabase } from "@/lib/supabase";

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 30;
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Rate limiting middleware function
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

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente mais tarde." },
        { status: 429 },
      );
    }

    // Verify user is authenticated
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login novamente." },
        { status: 401 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId, driverId, password, hubId, timestamp, vehicle, period } =
      body;

    // Validate required fields
    if (!userId || !password || !hubId) {
      return NextResponse.json(
        { error: "Dados incompletos para check-in" },
        { status: 400 },
      );
    }

    // Validate UUID format
    if (!isValidUUID(userId) || !isValidUUID(hubId)) {
      return NextResponse.json(
        { error: "Formato de ID inválido" },
        { status: 400 },
      );
    }

    // Sanitize inputs
    const sanitizedDriverId = sanitizeInput(driverId || "");
    const sanitizedPassword = sanitizeInput(password);
    const sanitizedVehicle = sanitizeInput(vehicle || "");
    const sanitizedPeriod = sanitizeInput(period || "");

    // Verify user ID matches authenticated user
    if (userId !== user.id) {
      return NextResponse.json(
        { error: "ID de usuário inválido" },
        { status: 403 },
      );
    }

    // Validate OWNFLEET password format
    if (!sanitizedPassword.startsWith("OWNFLEET-")) {
      return NextResponse.json(
        { error: "Formato de senha inválido" },
        { status: 400 },
      );
    }

    // Create check-in record in database
    const { data: checkInData, error: checkInError } = await supabase
      .from("checkins")
      .insert([
        {
          user_id: userId,
          driver_id: sanitizedDriverId,
          password: sanitizedPassword,
          hub_id: hubId,
          timestamp: new Date(timestamp).toISOString(),
          status: "pending",
          vehicle: sanitizedVehicle,
          period: sanitizedPeriod,
        },
      ])
      .select()
      .single();

    if (checkInError) {
      console.error("Error creating check-in:", checkInError);
      return NextResponse.json(
        { error: "Erro ao registrar check-in" },
        { status: 500 },
      );
    }

    // Get route information for this driver
    const { data: routeData, error: routeError } = await supabase
      .from("routes")
      .select("id, shift, city, neighborhoods, vehicle, loading_time")
      .eq("driver_id", sanitizedDriverId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1);

    if (routeError) {
      console.error("Error fetching route data:", routeError);
    }

    // Use actual route data if available, otherwise use fallback data
    const route = routeData && routeData.length > 0 ? routeData[0] : null;

    return NextResponse.json({
      success: true,
      checkInId: checkInData.id,
      routeId: route ? route.id : "R12345",
      routeName: route
        ? `Rota ${route.shift} - ${route.neighborhoods.length} paradas`
        : "Rota AM - SINOSPLEX",
      cityName: route ? route.city : "São Paulo",
      vehicle: route ? route.vehicle : "Van",
      loadingTime: route ? route.loading_time : "08:00",
    });
  } catch (error) {
    console.error("Unexpected error in check-in API:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente mais tarde." },
        { status: 429 },
      );
    }

    // Verify user is authenticated
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login novamente." },
        { status: 401 },
      );
    }

    // Check if user is admin
    const isAdmin = user.permissions === "admin";

    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const status = url.searchParams.get("status");

    // Validate and cap limit
    const validLimit = Math.min(Math.max(1, limit), 100); // Between 1 and 100
    const validOffset = Math.max(0, offset); // At least 0

    // Build query to get check-ins
    let query = supabase
      .from("checkins")
      .select("*")
      .order("timestamp", { ascending: false })
      .range(validOffset, validOffset + validLimit - 1);

    // Apply filters
    if (!isAdmin) {
      query = query.eq("user_id", user.id);
    }

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data: checkIns, error: checkInsError } = await query;

    if (checkInsError) {
      console.error("Error fetching check-ins:", checkInsError);
      return NextResponse.json(
        { error: "Erro ao buscar check-ins" },
        { status: 500 },
      );
    }

    // Get user information for each check-in
    const userIds = [...new Set(checkIns.map((checkIn) => checkIn.user_id))];

    // Only fetch users if there are check-ins
    let usersMap = {};
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, name")
        .in("id", userIds);

      if (usersError) {
        console.error("Error fetching users:", usersError);
      } else if (users) {
        // Create a map of user_id to user name for quick lookup
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = user.name;
          return acc;
        }, {});
      }
    }

    // Format the response data
    const formattedCheckIns = checkIns.map((checkIn) => ({
      ...checkIn,
      user_name: usersMap[checkIn.user_id] || null,
    }));

    // Get total count for pagination
    let countQuery = supabase
      .from("checkins")
      .select("*", { count: "exact", head: true });

    if (!isAdmin) {
      countQuery = countQuery.eq("user_id", user.id);
    }

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      countQuery = countQuery.eq("status", status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("Error counting check-ins:", countError);
    }

    return NextResponse.json({
      checkIns: formattedCheckIns,
      pagination: {
        total: count || 0,
        limit: validLimit,
        offset: validOffset,
      },
    });
  } catch (error) {
    console.error("Unexpected error in check-in API:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// Add PATCH endpoint for updating check-in status
export async function PATCH(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente mais tarde." },
        { status: 429 },
      );
    }

    // Verify user is authenticated and is admin
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login novamente." },
        { status: 401 },
      );
    }

    if (user.permissions !== "admin") {
      return NextResponse.json(
        {
          error:
            "Permissão negada. Apenas administradores podem atualizar check-ins.",
        },
        { status: 403 },
      );
    }

    // Parse URL to get check-in ID
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const checkInId = pathParts[pathParts.length - 1];

    if (!checkInId || !isValidUUID(checkInId)) {
      return NextResponse.json(
        { error: "ID de check-in inválido" },
        { status: 400 },
      );
    }

    // Parse request body
    const { status } = await request.json();

    // Validate status
    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status inválido. Use 'approved' ou 'rejected'." },
        { status: 400 },
      );
    }

    // Update check-in status
    const { data, error } = await supabase
      .from("checkins")
      .update({
        status,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("id", checkInId)
      .select()
      .single();

    if (error) {
      console.error("Error updating check-in:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar check-in" },
        { status: 500 },
      );
    }

    // Log the status change
    await supabase.from("checkin_logs").insert([
      {
        checkin_id: checkInId,
        user_id: user.id,
        action: `Status changed to ${status}`,
        timestamp: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({
      success: true,
      checkIn: data,
    });
  } catch (error) {
    console.error("Unexpected error in check-in API:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
