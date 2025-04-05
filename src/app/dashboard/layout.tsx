import DashboardNavbar from "@/components/dashboard-navbar";
import { getServerSession } from "@/utils/session";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the current user from the session
  const session = await getServerSession();

  // If there's no session, redirect to the login page
  if (!session) {
    redirect("/sign-in");
  }

  // Check if user is admin
  const isAdmin = session?.user?.permissions === "admin";

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAdmin && <DashboardNavbar />}
      <div className={!isAdmin ? "pt-16" : ""}>{children}</div>
    </div>
  );
}
