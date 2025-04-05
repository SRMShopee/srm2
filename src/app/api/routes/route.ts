import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/utils/session";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client for database operations only (not auth)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Get routes for the current user
export async function GET(request: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Get the URL parameters
    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get("hub_id");
    const shift = searchParams.get("shift");
    const status = searchParams.get("status");
    const filterByAvailability =
      searchParams.get("filterByAvailability") === "true";

    // If we need to filter by user availability, fetch the user's availability first
    let userAvailability = null;
    if (filterByAvailability) {
      const { data: availabilityData, error: availabilityError } =
        await supabase
          .from("disp")
          .select("turno, disp")
          .eq("user_id", session.user.id)
          .single();

      if (availabilityError && availabilityError.code !== "PGRST116") {
        console.error("Error fetching user availability:", availabilityError);
        return NextResponse.json(
          { error: "Error fetching user availability" },
          { status: 500 },
        );
      }

      // If user has availability and it's active, store it
      if (availabilityData && availabilityData.disp && availabilityData.turno) {
        userAvailability = availabilityData.turno;
      } else {
        // If user has no availability or it's not active, return empty routes
        return NextResponse.json({ routes: [], hasAvailability: false });
      }
    }

    // Build the query
    let query = supabase.from("routes").select("*");

    // Add filters if provided
    if (hubId) {
      query = query.eq("hub_id", hubId);
    }

    if (shift) {
      query = query.eq("shift", shift);
    } else if (userAvailability) {
      // If no specific shift is requested but we have user availability, filter by it
      query = query.eq("shift", userAvailability);
    }

    if (status) {
      query = query.eq("status", status);
    }

    // Execute the query
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching routes:", error);
      return NextResponse.json(
        { error: "Error fetching routes" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      routes: data,
      hasAvailability: userAvailability !== null,
    });
  } catch (error) {
    console.error("Unexpected error fetching routes:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Express interest in a route
export async function POST(request: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { routeId, loading_time } = body;

    // If we have a loading_time, we're updating a route
    if (loading_time !== undefined) {
      // Validate loading_time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(loading_time)) {
        return NextResponse.json(
          { error: "Invalid loading time format. Use HH:MM" },
          { status: 400 },
        );
      }

      // Update the route with the new loading time
      const { data, error } = await supabase
        .from("routes")
        .update({ loading_time })
        .eq("id", routeId)
        .select()
        .single();

      if (error) {
        console.error("Error updating route loading time:", error);
        return NextResponse.json(
          { error: "Error updating route loading time" },
          { status: 500 },
        );
      }

      return NextResponse.json({ route: data });
    }

    // If no loading_time, we're expressing interest in a route
    if (!routeId) {
      return NextResponse.json(
        { error: "Route ID is required" },
        { status: 400 },
      );
    }

    // Check if the user has already expressed interest in this route
    const { data: existingInterest } = await supabase
      .from("route_interests")
      .select("*")
      .eq("route_id", routeId)
      .eq("user_id", session.user.id)
      .single();

    if (existingInterest) {
      return NextResponse.json(
        { error: "Already expressed interest in this route" },
        { status: 400 },
      );
    }

    // Express interest in the route
    const { data, error } = await supabase
      .from("route_interests")
      .insert({
        route_id: routeId,
        user_id: session.user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error expressing interest in route:", error);
      return NextResponse.json(
        { error: "Error expressing interest in route" },
        { status: 500 },
      );
    }

    return NextResponse.json({ interest: data });
  } catch (error) {
    console.error("Unexpected error processing route request:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
