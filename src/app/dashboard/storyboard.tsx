"use client";

import { useEffect, useState } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import DriverDashboard from "@/components/DriverDashboard";
import AdminDashboard from "@/components/AdminDashboard";

export default function DashboardStoryboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Simular um usuário para o storyboard
    const mockUser = {
      id: "storyboard-user",
      name: "Usuário de Demonstração",
      driver_id: 12345,
      hub_id: "SINOSPLEX",
      permissions: "USER",
      phone: "51999999999",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setUser(mockUser);
    setIsAdmin(false);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shopee-orange"></div>
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        {isAdmin ? (
          <AdminDashboard user={user} />
        ) : (
          <DriverDashboard user={user} />
        )}
      </main>
    </>
  );
}
