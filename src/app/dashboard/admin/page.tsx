import { redirect } from "next/navigation";
import { getServerSession } from "@/utils/session";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPage() {
  try {
    const session = await getServerSession();

    if (!session) {
      redirect("/sign-in");
      return null; // This line won't execute due to redirect, but helps TypeScript
    }

    if (session.user.permissions !== "admin") {
      redirect("/dashboard");
      return null; // This line won't execute due to redirect, but helps TypeScript
    }

    return <AdminDashboard user={session.user} />;
  } catch (error) {
    console.error("Error in admin page:", error);
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      // This is an expected redirect, don't handle it
      throw error;
    }
    redirect(
      "/sign-in?error=" +
        encodeURIComponent("Erro ao carregar painel administrativo"),
    );
    return null; // This line won't execute due to redirect, but helps TypeScript
  }
}
