import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/utils/session";
import { isValidHubId } from "@/utils/utils";
import { supabase } from "@/lib/supabase";

// Get hub information by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const hubId = params.id;

    if (!hubId) {
      return NextResponse.json(
        { error: "Hub ID is required" },
        { status: 400 },
      );
    }

    // Validate hub ID format using the utility function
    if (!isValidHubId(hubId)) {
      return NextResponse.json(
        { error: "Invalid hub ID format" },
        { status: 400 },
      );
    }

    // Get the hub information from the database
    const { data, error } = await supabase
      .from("hubs")
      .select("id, code, name, latitude, longitude, check_in_radius")
      .eq("id", hubId)
      .single();

    if (error) {
      console.error("Error fetching hub information:", error);
      return NextResponse.json(
        { error: "Error fetching hub information" },
        { status: 500 },
      );
    }

    // If no hub found, return a default response
    if (!data) {
      return NextResponse.json({
        hub: {
          id: hubId,
          code: "SINOSPLEX",
          name: "Sinosplex Logistics",
          latitude: -23.5505, // Default latitude (São Paulo)
          longitude: -46.6333, // Default longitude (São Paulo)
          check_in_radius: 100, // Default radius in meters
        },
      });
    }

    // Ensure location data exists, use defaults if missing
    if (data && (data.latitude === null || data.longitude === null)) {
      data.latitude = data.latitude || -23.5505; // Default latitude if missing
      data.longitude = data.longitude || -46.6333; // Default longitude if missing
      data.check_in_radius = data.check_in_radius || 100; // Default radius if missing
    }

    return NextResponse.json({ hub: data });
  } catch (error) {
    console.error("Unexpected error fetching hub information:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
