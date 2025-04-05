import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/utils/session";
import { supabase, supabaseAdmin } from "@/lib/supabase";

// If supabaseAdmin is null, create a fallback that uses the regular client
const adminClient = supabaseAdmin || supabase;

// Get user preferences
export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Get the user preferences from the database using admin client
    const { data: preferences, error: preferencesError } = await adminClient
      .from("user_preferences")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (preferencesError && preferencesError.code !== "PGRST116") {
      // PGRST116 is the error code for no rows returned
      console.error("Error fetching user preferences:", preferencesError);
      return NextResponse.json(
        { error: "Error fetching user preferences" },
        { status: 500 },
      );
    }

    // Get the user availability from the disp table using admin client
    const { data: availability, error: availabilityError } = await adminClient
      .from("disp")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (availabilityError && availabilityError.code !== "PGRST116") {
      console.error("Error fetching user availability:", availabilityError);
      return NextResponse.json(
        { error: "Error fetching user availability" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      preferences: preferences || null,
      availability: availability || null,
    });
  } catch (error) {
    console.error("Unexpected error fetching user data:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Update user preferences
export async function POST(request: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Use the user ID directly from the session
    const userId = session.user.id;

    // Check if this is an availability update
    if (data.availability !== undefined) {
      const { turno, disp } = data.availability;

      // First check if user has set region preferences using admin client
      const { data: userPreferences, error: preferencesError } =
        await adminClient
          .from("user_preferences")
          .select("primary_regions")
          .eq("user_id", userId)
          .maybeSingle();

      // If user is trying to set availability to true, verify they have region preferences
      if (
        disp &&
        (!userPreferences ||
          !userPreferences.primary_regions ||
          (Array.isArray(userPreferences.primary_regions) &&
            userPreferences.primary_regions.length === 0))
      ) {
        return NextResponse.json(
          {
            error:
              "Você precisa definir suas preferências de região antes de marcar disponibilidade.",
          },
          { status: 400 },
        );
      }

      // Get user information using admin client
      const { data: userData, error: userError } = await adminClient
        .from("users")
        .select("name, hub_id, vehicle")
        .eq("id", userId)
        .maybeSingle();

      if (userError) {
        console.error("Error fetching user data:", userError);
        return NextResponse.json(
          { error: "Error fetching user data" },
          { status: 500 },
        );
      }

      // Default vehicle type if not available in the database
      const defaultVehicleType = "PASSEIO";
      const vehicleType = userData?.vehicle || defaultVehicleType;

      // Check if the user already has an availability record using admin client
      const { data: existingAvailability, error: checkError } =
        await adminClient
          .from("disp")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

      // If user is trying to set availability to true but already has an active availability for a different period,
      // they must cancel it first
      if (
        disp &&
        existingAvailability &&
        existingAvailability.disp &&
        existingAvailability.turno !== turno
      ) {
        return NextResponse.json(
          {
            error:
              "Você já possui uma disponibilidade ativa para outro período. Cancele-a antes de marcar uma nova.",
            currentAvailability: existingAvailability,
          },
          { status: 400 },
        );
      }

      let availabilityResult;

      if (existingAvailability) {
        // Update existing availability using admin client
        availabilityResult = await adminClient
          .from("disp")
          .update({
            disp: disp,
            turno: turno,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .select()
          .maybeSingle();
      } else {
        // Create new availability using admin client
        availabilityResult = await adminClient
          .from("disp")
          .insert([
            {
              user_id: userId,
              name: userData?.name || "",
              hub_id: userData?.hub_id || null, // Store hub_id from users table
              vehicle: vehicleType, // Use the vehicle type from user data
              disp: disp,
              turno: turno,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .maybeSingle();
      }

      if (availabilityResult.error) {
        console.error(
          "Error updating user availability:",
          availabilityResult.error,
        );
        return NextResponse.json(
          { error: "Error updating user availability" },
          { status: 500 },
        );
      }

      // Log the availability change for auditing purposes
      console.log(
        `User ${userId} ${disp ? "set" : "cancelled"} availability for period ${turno}`,
      );

      return NextResponse.json({ availability: availabilityResult.data });
    }

    // Handle regular preferences update
    const primaryRegions = data.primary_regions || [];
    const backupRegions = data.backup_regions || [];
    const hubId = data.hub_id;

    // Validate that primary_regions and backup_regions contain integers, not strings
    const validateRegions = (regions: any[]) => {
      return regions.every(
        (region) => typeof region === "number" || !isNaN(parseInt(region)),
      );
    };

    if (!validateRegions(primaryRegions) || !validateRegions(backupRegions)) {
      return NextResponse.json(
        { error: "Region IDs must be integers" },
        { status: 400 },
      );
    }

    // Convert any string numbers to actual integers
    const normalizedPrimaryRegions = primaryRegions.map((r) =>
      typeof r === "string" ? parseInt(r, 10) : r,
    );

    const normalizedBackupRegions = backupRegions.map((r) =>
      typeof r === "string" ? parseInt(r, 10) : r,
    );

    if (!hubId) {
      return NextResponse.json(
        { error: "Hub ID is required" },
        { status: 400 },
      );
    }

    // Check if the user already has preferences using admin client
    const { data: existingPreferences, error: checkError } = await adminClient
      .from("user_preferences")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking user preferences:", checkError);
      return NextResponse.json(
        { error: "Error checking user preferences" },
        { status: 500 },
      );
    }

    let result;

    if (existingPreferences) {
      // Update existing preferences using admin client
      result = await adminClient
        .from("user_preferences")
        .update({
          primary_regions: normalizedPrimaryRegions,
          backup_regions: normalizedBackupRegions,
          hub_id: hubId,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select()
        .maybeSingle();
    } else {
      // Create new preferences using admin client
      result = await adminClient
        .from("user_preferences")
        .insert([
          {
            primary_regions: normalizedPrimaryRegions,
            backup_regions: normalizedBackupRegions,
            user_id: userId,
            hub_id: hubId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .maybeSingle();
    }

    if (result.error) {
      console.error("Error updating user preferences:", result.error);
      return NextResponse.json(
        { error: "Error updating user preferences" },
        { status: 500 },
      );
    }

    return NextResponse.json({ preferences: result.data });
  } catch (error) {
    console.error("Unexpected error updating user data:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
