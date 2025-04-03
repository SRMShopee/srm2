import { createClient } from "@supabase/supabase-js";

// Create a Supabase client for database operations only (not auth)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export interface User {
  id: string;
  name: string;
  driver_id: string | number | null;
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

/**
 * Stores the user session in localStorage
 * @param session The session object to store
 */
export const storeSession = (session: Session) => {
  if (typeof window !== "undefined") {
    try {
      // Clear any existing session first
      localStorage.removeItem("session");
      // Store the new session
      localStorage.setItem("session", JSON.stringify(session));
    } catch (error) {
      console.error("Error storing session:", error);
    }
  }
};

/**
 * Retrieves and validates the user session from localStorage
 * @returns The session object if valid, null otherwise
 */
export const getSession = (): Session | null => {
  if (typeof window !== "undefined") {
    try {
      const session = localStorage.getItem("session");
      if (!session) return null;

      const parsedSession = JSON.parse(session) as Session;

      // Check if the session has expired
      if (parsedSession.expires_at < Date.now()) {
        localStorage.removeItem("session");
        return null;
      }

      // Verify the user object is complete
      if (!parsedSession.user || !parsedSession.user.id) {
        localStorage.removeItem("session");
        return null;
      }

      return parsedSession;
    } catch (error) {
      console.error("Error parsing session from localStorage:", error);
      localStorage.removeItem("session"); // Clear invalid session
      return null;
    }
  }
  return null;
};

// Remove the session from localStorage
export const removeSession = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("session");
  }
};

// Check if the user is authenticated
export const isAuthenticated = (): boolean => {
  return getSession() !== null;
};

// Get the current user
export const getCurrentUser = (): User | null => {
  const session = getSession();
  return session ? session.user : null;
};

// Sign in with driver ID and password
export const signIn = async (
  driverId: string,
  password: string,
): Promise<{
  user: User | null;
  error: string | null;
  redirectUrl?: string;
  lockedUntil?: string;
}> => {
  try {
    // Validate inputs
    if (!driverId || !password) {
      return {
        user: null,
        error: "Driver ID e senha são obrigatórios",
      };
    }

    // Call the API to set the server-side session cookie
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ driverId, password }),
      credentials: "include", // Important for cookies
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        user: null,
        error: data.error || "Erro ao fazer login",
        lockedUntil: data.lockedUntil,
      };
    }

    // If the login was successful, store the session in localStorage
    if (data.user) {
      // Create a session for the user
      const session: Session = {
        user: data.user as User,
        expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
      };

      // Store the session
      storeSession(session);

      // Set session flags for redirection
      if (typeof window !== "undefined") {
        const redirectPath =
          data.user.permissions === "admin" ? "/dashboard/admin" : "/dashboard";

        // Store redirection data
        sessionStorage.setItem("loginSuccess", "true");
        sessionStorage.setItem(
          "userPermissions",
          data.user.permissions || "USER",
        );
        sessionStorage.setItem("redirectPath", redirectPath);
        sessionStorage.setItem("loginTimestamp", Date.now().toString());
        sessionStorage.setItem("forceRedirect", redirectPath);

        // Dispatch a custom event for redirection
        try {
          const authSuccessEvent = new CustomEvent("authSuccess", {
            detail: {
              user: data.user,
              redirectPath: redirectPath,
              timestamp: Date.now(),
            },
          });
          window.dispatchEvent(authSuccessEvent);
          console.log("Auth success event dispatched", redirectPath);
        } catch (eventError) {
          console.error("Error dispatching auth event:", eventError);
        }
      }

      return {
        user: data.user as User,
        error: null,
        redirectUrl: data.redirectUrl,
      };
    }

    return { user: null, error: "Erro ao recuperar dados do usuário" };
  } catch (err: any) {
    console.error("Unexpected error during login:", err);
    return {
      user: null,
      error: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
    };
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  // Remove the session from localStorage
  removeSession();

  // Also call the API to clear the server-side session cookie
  try {
    await fetch("/api/logout", { method: "POST" });
  } catch (err) {
    console.error("Error clearing server session:", err);
  }
};
