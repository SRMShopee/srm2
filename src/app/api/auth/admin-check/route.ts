import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/utils/session";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json(
        { authenticated: false, error: "Não autenticado" },
        { status: 401 },
      );
    }

    if (user.permissions !== "admin") {
      return NextResponse.json(
        { authenticated: false, error: "Permissão negada" },
        { status: 403 },
      );
    }

    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    console.error("Error checking admin authentication:", error);
    return NextResponse.json(
      { authenticated: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
