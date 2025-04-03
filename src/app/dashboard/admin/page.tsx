"use client";

import { useEffect, useState } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import AdminDashboard from "@/components/AdminDashboard";
import { getCurrentUser } from "@/utils/auth";

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log("Fetching user data for admin dashboard");

        // Tentar obter usuário da API primeiro
        const response = await fetch("/api/user", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          console.log("User data from API:", data.user);

          if (data.user) {
            // Verificar se o usuário é admin
            if (data.user.permissions !== "admin") {
              console.log("Non-admin user attempting to access admin page");
              window.location.replace("/dashboard");
              return;
            }

            setUser(data.user);
            setIsLoading(false);
            return;
          }
        }

        // Fallback: tentar obter do localStorage
        const currentUser = getCurrentUser();
        console.log("Current user from localStorage:", currentUser);

        if (!currentUser) {
          console.log("No user found in session, redirecting to sign-in");
          window.location.replace("/sign-in");
          return;
        }

        // Verificar se o usuário é admin
        if (currentUser.permissions !== "admin") {
          console.log("Non-admin user attempting to access admin page");
          window.location.replace("/dashboard");
          return;
        }

        setUser(currentUser);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        window.location.replace("/sign-in");
      }
    };

    fetchUserData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shopee-orange"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <AdminDashboard user={user} />
      </main>
    </>
  );
}
