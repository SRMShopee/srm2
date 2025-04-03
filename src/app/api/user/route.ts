import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/utils/session";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Create a Supabase client for database operations only (not auth)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Get the current user
export async function GET() {
  try {
    // Primeiro, tentar obter a sessão do servidor
    const session = await getServerSession();
    console.log("Server session found:", !!session);

    if (session) {
      // Get the latest user data from the database
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
        return NextResponse.json(
          { error: "Error fetching user data" },
          { status: 500 },
        );
      }

      console.log("User data fetched successfully:", data);
      return NextResponse.json({ user: data });
    }

    // Se não houver sessão do servidor, verificar o cookie de sessão diretamente
    const sessionCookie = cookies().get("session");
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        if (sessionData && sessionData.user && sessionData.user.id) {
          // Get the latest user data from the database
          const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", sessionData.user.id)
            .single();

          if (error) {
            console.error("Error fetching user data from cookie:", error);
            return NextResponse.json(
              { error: "Error fetching user data" },
              { status: 500 },
            );
          }

          console.log("User data fetched from cookie successfully:", data);
          return NextResponse.json({ user: data });
        }
      } catch (parseError) {
        console.error("Error parsing session cookie:", parseError);
      }
    }

    // Se chegamos aqui, não há sessão válida
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  } catch (error) {
    console.error("Unexpected error fetching user data:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Update user data
export async function PATCH(request: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const userData = await request.json();

    // Update the user data in the database
    const { data, error } = await supabase
      .from("users")
      .update({
        ...userData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user data:", error);
      return NextResponse.json(
        { error: "Error updating user data" },
        { status: 500 },
      );
    }

    // Update the session with the new user data
    const newSession = {
      ...session,
      user: data,
    };

    // Set the updated session cookie
    cookies().set({
      name: "session",
      value: JSON.stringify(newSession),
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("Unexpected error updating user data:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
