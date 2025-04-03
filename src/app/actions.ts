"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Create a Supabase client for database operations only (not auth)
const createDbClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
};

export const signUpAction = async (formData: FormData) => {
  const password = formData.get("password")?.toString();
  const driverId = formData.get("driver_id")?.toString();
  const name = formData.get("name")?.toString() || `Entregador ${driverId}`;
  const phone = formData.get("phone")?.toString() || "";
  const hubId = formData.get("hub_id")?.toString() || "";

  const supabase = createDbClient();

  if (!password || !driverId || !phone || !hubId) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Todos os campos são obrigatórios",
    );
  }

  // Check if driver ID already exists
  const { data: existingDriver } = await supabase
    .from("users")
    .select("driver_id")
    .eq("driver_id", driverId)
    .single();

  if (existingDriver) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Este Driver ID já está cadastrado",
    );
  }

  // Generate a unique ID for the user
  const userId = crypto.randomUUID();

  try {
    // Insert the new user directly into the users table
    const { error: insertError } = await supabase.from("users").insert({
      id: userId,
      name: name,
      driver_id: parseInt(driverId),
      phone: phone,
      hub_id: hubId,
      permissions: "USER", // Default permission
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Error creating user:", insertError);
      return encodedRedirect(
        "error",
        "/sign-up",
        "Erro ao criar usuário: " + insertError.message,
      );
    }
  } catch (err) {
    console.error("Error in user creation:", err);
    return encodedRedirect(
      "error",
      "/sign-up",
      "Erro inesperado ao criar usuário.",
    );
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Cadastro realizado com sucesso!",
  );
};

export const signInAction = async (formData: FormData) => {
  const driverId = formData.get("driverId") as string;
  const password = formData.get("password") as string;
  const supabase = createDbClient();

  if (!driverId || !password) {
    return { error: "Driver ID e senha são obrigatórios" };
  }

  try {
    console.log("Attempting login with Driver ID:", driverId);

    // Special case for admin user
    if (driverId === "admin" && password === "admin") {
      // Check if admin user exists
      const { data: adminData, error: adminError } = await supabase
        .from("users")
        .select("*")
        .eq("driver_id", "admin")
        .single();

      if (adminError || !adminData) {
        console.error("Admin user not found:", adminError?.message);
        return { error: "Usuário administrador não encontrado." };
      }

      // Set a session cookie
      cookies().set({
        name: "session",
        value: JSON.stringify({
          user: adminData,
          expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        }),
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      console.log("Admin login successful, redirecting to dashboard");
      return redirect("/dashboard");
    }

    // Regular user authentication
    // Check if the user exists in the users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("driver_id", driverId)
      .single();

    if (userError || !userData) {
      console.error("No user found with this Driver ID:", userError?.message);
      return { error: "Driver ID não encontrado. Verifique suas credenciais." };
    }

    // Validate password (last 4 digits of phone number)
    const phone = userData.phone || "";
    const last4Digits = phone.replace(/\D/g, "").slice(-4);

    if (password !== last4Digits) {
      console.error("Invalid password for user");
      return {
        error: "Senha incorreta. Use os últimos 4 dígitos do seu telefone.",
      };
    }

    // Set a session cookie
    cookies().set({
      name: "session",
      value: JSON.stringify({
        user: userData,
        expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      }),
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // Successfully authenticated
    console.log("Login successful, redirecting to dashboard");
    console.log("User permissions:", userData.permissions);

    // Use Next.js redirect for server-side redirect
    return redirect("/dashboard");
  } catch (err: any) {
    console.error("Unexpected error during login:", err);

    // Check if it's a redirect error (which is actually expected behavior)
    if (err.message === "NEXT_REDIRECT") {
      throw err; // Let Next.js handle the redirect
    }

    return { error: "Ocorreu um erro inesperado. Tente novamente mais tarde." };
  }
};

export const forgotPasswordAction = async (formData: FormData) => {
  // This would need to be reimplemented with a custom password reset flow
  // For now, we'll just return an error
  return encodedRedirect(
    "error",
    "/forgot-password",
    "Funcionalidade não disponível no momento.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  // This would need to be reimplemented with a custom password reset flow
  // For now, we'll just return an error
  return encodedRedirect(
    "error",
    "/protected/reset-password",
    "Funcionalidade não disponível no momento.",
  );
};

export const signOutAction = async () => {
  // Clear the session cookie
  cookies().delete("session");
  return redirect("/sign-in");
};
