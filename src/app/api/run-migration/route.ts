import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerUser } from "@/utils/session";

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
          error:
            "Permissão negada. Apenas administradores podem executar migrações.",
        },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { sql, migrationName } = body;

    if (!sql) {
      return NextResponse.json({ error: "SQL não fornecido" }, { status: 400 });
    }

    // Execute the SQL command
    const { data, error } = await supabase.rpc("execute_sql", { sql });

    if (error) {
      console.error(`Error executing migration ${migrationName}:`, error);
      return NextResponse.json(
        { error: `Erro ao executar migração: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Migração ${migrationName || "SQL"} executada com sucesso`,
      data,
    });
  } catch (error: any) {
    console.error("Unexpected error in run-migration API:", error);
    return NextResponse.json(
      { error: `Erro interno do servidor: ${error.message}` },
      { status: 500 },
    );
  }
}
