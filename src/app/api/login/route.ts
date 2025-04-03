import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createHash } from "crypto";

// Create a Supabase client for database operations only (not auth)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Constants for security settings
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const SESSION_DURATION_HOURS = 24;

/**
 * Creates a session object with expiration time
 * @param userData The user data to include in the session
 * @returns A session object with user data and expiration timestamp
 */
const createSession = (userData: any) => ({
  user: userData,
  expires_at: Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000,
});

/**
 * Sets secure cookies for authentication
 * @param userData The user data to store in the session
 * @returns The created session object
 */
const setSecureCookies = (userData: any) => {
  const session = createSession(userData);
  const isProduction = process.env.NODE_ENV === "production";
  const maxAgeSeconds = 60 * 60 * SESSION_DURATION_HOURS;

  // Common cookie options
  const commonOptions = {
    path: "/",
    maxAge: maxAgeSeconds,
    sameSite: "lax" as const,
    secure: isProduction,
  };

  // Set the main session cookie (httpOnly for security)
  cookies().set({
    name: "session",
    value: JSON.stringify(session),
    httpOnly: true,
    ...commonOptions,
  });

  // Set a non-httpOnly cookie as a fallback for client-side detection
  cookies().set({
    name: "auth_status",
    value: "authenticated",
    httpOnly: false,
    ...commonOptions,
  });

  return session;
};

/**
 * Handles failed login attempts and account lockout
 * @param userData The user data to update
 * @returns True if the account is now locked, false otherwise
 */
const handleFailedLogin = async (userData: any) => {
  const now = new Date();
  const newAttempts = (userData.failed_login_attempts || 0) + 1;
  const updateData: any = {
    failed_login_attempts: newAttempts,
    last_failed_login: now.toISOString(),
  };

  // Lock account if max attempts reached
  if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
    const lockoutTime = new Date();
    lockoutTime.setMinutes(lockoutTime.getMinutes() + LOCKOUT_DURATION_MINUTES);
    updateData.account_locked_until = lockoutTime.toISOString();
  }

  await supabase.from("users").update(updateData).eq("id", userData.id);

  return newAttempts >= MAX_LOGIN_ATTEMPTS;
};

export async function POST(request: NextRequest) {
  try {
    const { driverId, password } = await request.json();

    // Input validation
    if (!driverId || !password) {
      return NextResponse.json(
        { error: "Driver ID e senha são obrigatórios" },
        { status: 400 },
      );
    }

    // Sanitize inputs
    const sanitizedDriverId = String(driverId).trim();
    const sanitizedPassword = String(password).trim();

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("driver_id", sanitizedDriverId)
      .single();

    // Handle user not found
    if (userError || !userData) {
      return NextResponse.json(
        { error: "Driver ID não encontrado. Verifique suas credenciais." },
        { status: 404 },
      );
    }

    // Check if account is locked
    if (userData.account_locked_until) {
      const lockoutTime = new Date(userData.account_locked_until);
      if (lockoutTime > new Date()) {
        const minutesLeft = Math.ceil(
          (lockoutTime.getTime() - Date.now()) / 60000,
        );
        return NextResponse.json(
          {
            error: `Conta temporariamente bloqueada devido a múltiplas tentativas de login. Tente novamente em ${minutesLeft} minutos.`,
            lockedUntil: lockoutTime.toISOString(),
          },
          { status: 403 },
        );
      }
    }

    // Special case for admin user with hardcoded credentials (should be removed in production)
    const isAdmin = sanitizedDriverId === "admin";
    const isValidAdminPassword =
      isAdmin &&
      (sanitizedPassword === "admin" || sanitizedPassword === "1234");

    // Validate password for regular users (last 4 digits of phone number or test password)
    const phone = userData.phone || "";
    const last4Digits = phone.replace(/\D/g, "").slice(-4);
    const isValidUserPassword =
      sanitizedPassword === last4Digits || sanitizedPassword === "4567";

    // If password is invalid
    if (!(isAdmin && isValidAdminPassword) && !isValidUserPassword) {
      const isLocked = await handleFailedLogin(userData);
      const errorMessage = isLocked
        ? `Conta bloqueada por ${LOCKOUT_DURATION_MINUTES} minutos devido a múltiplas tentativas de login.`
        : "Senha incorreta. Use os últimos 4 dígitos do seu telefone.";

      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }

    // Reset failed login attempts and update last login time
    await supabase
      .from("users")
      .update({
        updated_at: new Date().toISOString(),
        failed_login_attempts: 0,
        account_locked_until: null,
      })
      .eq("id", userData.id);

    // Set secure cookies
    setSecureCookies(userData);

    // Return user data with a redirect URL
    const redirectUrl =
      userData.permissions === "admin" ? "/dashboard/admin" : "/dashboard";

    // Set a header to indicate successful authentication
    const response = NextResponse.json({
      user: userData,
      redirectUrl,
      success: true,
    });

    response.headers.set("X-Auth-Redirect", redirectUrl);
    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro inesperado. Tente novamente mais tarde." },
      { status: 500 },
    );
  }
}
