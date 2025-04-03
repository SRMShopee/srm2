import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client for database operations only (not auth)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export interface User {
  id: string;
  name: string;
  driver_id: number | null;
  hub_id: string;
  permissions: string | null;
  phone: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface Session {
  user: User;
  expires_at: number;
}

// Get the session from the cookie
export const getServerSession = async (): Promise<Session | null> => {
  const sessionCookie = cookies().get("session");

  if (!sessionCookie) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value) as Session;

    // Check if the session has expired
    if (session.expires_at < Date.now()) {
      cookies().delete("session");
      return null;
    }

    return session;
  } catch (error) {
    console.error("Error parsing session cookie:", error);
    return null;
  }
};

// Get the current user from the session
export const getServerUser = async (): Promise<User | null> => {
  const session = await getServerSession();
  return session ? session.user : null;
};

// Check if the user has admin permissions
export const isAdmin = async (): Promise<boolean> => {
  const user = await getServerUser();
  return user?.permissions === "admin";
};

// Verify user permissions against the database
export const verifyUserPermissions = async (
  userId: string,
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("permissions")
      .eq("id", userId)
      .single();

    if (error || !data) {
      console.error("Error verifying user permissions:", error?.message);
      return null;
    }

    return data.permissions;
  } catch (error) {
    console.error("Unexpected error verifying user permissions:", error);
    return null;
  }
};
