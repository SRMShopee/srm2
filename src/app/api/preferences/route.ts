import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/utils/session";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client for database operations only (not auth)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Get user preferences
export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Get the user preferences from the database
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is the error code for no rows returned
      console.error("Error fetching user preferences:", error);
      return NextResponse.json(
        { error: "Error fetching user preferences" },
        { status: 500 },
      );
    }

    return NextResponse.json({ preferences: data || null });
  } catch (error) {
    console.error("Unexpected error fetching user preferences:", error);
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
    const preferences = await request.json();

    // Check if the user already has preferences
    const { data: existingPreferences } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    let result;

    if (existingPreferences) {
      // Update existing preferences
      result = await supabase
        .from("user_preferences")
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", session.user.id)
        .select()
        .single();
    } else {
      // Create new preferences
      result = await supabase
        .from("user_preferences")
        .insert({
          ...preferences,
          user_id: session.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
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
    console.error("Unexpected error updating user preferences:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
