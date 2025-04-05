import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/utils/session";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client for database operations only (not auth)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Get cities for a specific hub
export async function GET(request: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Get the URL parameters
    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get("hub_id");

    if (!hubId) {
      return NextResponse.json(
        { error: "Hub ID is required" },
        { status: 400 },
      );
    }

    // Get the cities from the database
    const { data, error } = await supabase
      .from("cities")
      .select("*")
      .eq("hub_id", hubId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching cities:", error);
      return NextResponse.json(
        { error: "Error fetching cities" },
        { status: 500 },
      );
    }

    return NextResponse.json({ cities: data });
  } catch (error) {
    console.error("Unexpected error fetching cities:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
