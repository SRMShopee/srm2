import { NextResponse } from "next/server";
import { checkSupabaseConnection } from "@/lib/supabase";

export async function GET() {
  try {
    const isConnected = await checkSupabaseConnection();

    if (isConnected) {
      return NextResponse.json({
        status: "connected",
        message: "Successfully connected to Supabase",
      });
    } else {
      return NextResponse.json(
        { status: "error", message: "Failed to connect to Supabase" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error checking connection:", error);
    return NextResponse.json(
      { status: "error", message: "Unexpected error checking connection" },
      { status: 500 },
    );
  }
}
