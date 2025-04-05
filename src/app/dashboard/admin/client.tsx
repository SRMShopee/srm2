"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import { User } from "@/utils/auth";

export default function AdminDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchAdminUser() {
      try {
        const response = await fetch("/api/auth/admin-check", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          router.push(
            "/sign-in?error=" +
              encodeURIComponent("Acesso restrito a administradores"),
          );
          return;
        }

        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          router.push("/sign-in");
        }
      } catch (error) {
        console.error("Error fetching admin user:", error);
        router.push(
          "/sign-in?error=" +
            encodeURIComponent("Erro ao verificar autenticação"),
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAdminUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return <AdminDashboard user={user} />;
}
