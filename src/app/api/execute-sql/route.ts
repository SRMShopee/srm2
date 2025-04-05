import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerUser } from "@/utils/session";

// Create a Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/**
 * API endpoint to execute SQL commands directly
 * This is used for administrative tasks like creating tables
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated and is admin
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login novamente." },
        { status: 401 },
      );
    }

    if (user.permissions !== "admin") {
      return NextResponse.json(
        {
          error: "Permissão negada. Apenas administradores podem executar SQL.",
        },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { sql } = body;

    if (!sql) {
      return NextResponse.json(
        { error: "Comando SQL não fornecido" },
        { status: 400 },
      );
    }

    // Execute the SQL command using RPC
    // Note: This requires a SQL function to be created in Supabase
    // that allows executing arbitrary SQL
    const { data, error } = await supabase.rpc("execute_sql", { sql });
    
    // If the function doesn't exist, create it
    if (error && error.message && error.message.includes("function "execute_sql" does not exist")) {
      console.log("Creating execute_sql function...");
      
      // Create the function that allows executing arbitrary SQL
      const createFunctionSql = `
        CREATE OR REPLACE FUNCTION execute_sql(sql text)
        RETURNS SETOF json
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $
        BEGIN
          RETURN QUERY EXECUTE sql;
        END;
        $;
      `;
      
      // Execute the function creation directly
      const { error: createError } = await supabase.rpc("execute_sql", { sql: createFunctionSql });
      
      if (createError) {
        console.error("Error creating execute_sql function:", createError);
        return NextResponse.json(
          { error: `Erro ao criar função execute_sql: ${createError.message}` },
          { status: 500 },
        );
      }
      
      // Try executing the original SQL again
      const { data: retryData, error: retryError } = await supabase.rpc("execute_sql", { sql });
      
      if (retryError) {
        console.error("Error executing SQL after creating function:", retryError);
        return NextResponse.json(
          { error: `Erro ao executar SQL após criar função: ${retryError.message}` },
          { status: 500 },
        );
      }
      
      return NextResponse.json({ success: true, data: retryData });
    }

    if (error) {
      console.error("Error executing SQL:", error);
      return NextResponse.json(
        { error: `Erro ao executar SQL: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Unexpected error in execute-sql API:", error);
    return NextResponse.json(
      { error: `Erro interno do servidor: ${error.message}` },
      { status: 500 },
    );
  }
}
