import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("session");

  // Check if session cookie exists
  if (sessionCookie) {
    // Se o cookie de sessão existe, redireciona para o dashboard
    // A verificação JWT será feita no middleware
    return redirect("/dashboard");
  }

  // If not authenticated, redirect to sign-in page
  return redirect("/sign-in");
}
