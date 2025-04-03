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

    // Build the query
    let query = supabase.from("routes").select("*");

    // Add filters if provided
    if (hubId) {
      query = query.eq("hub_id", hubId);
    }

    if (shift) {
      query = query.eq("shift", shift);
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

    return NextResponse.json({ routes: data });
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
    const { routeId } = await request.json();

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
    console.error("Unexpected error expressing interest in route:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
