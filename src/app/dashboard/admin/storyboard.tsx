"use client";

import { useEffect, useState } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import AdminDashboard from "@/components/AdminDashboard";

export default function AdminDashboardStoryboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Simular um usuário admin para o storyboard
    const mockAdminUser = {
      id: "admin-storyboard",
      name: "Administrador",
      driver_id: "admin",
      hub_id: "SINOSPLEX",
      permissions: "admin",
      phone: "51999999999",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setUser(mockAdminUser);
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
        <AdminDashboard user={user} />
      </main>
    </>
  );
}
