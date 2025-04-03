"use client";

import { useEffect, useState } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import DriverDashboard from "@/components/DriverDashboard";
import { getCurrentUser } from "@/utils/auth";

export default function Dashboard() {
  // const [user, setUser] = useState<any>(null);
  // const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   /**
  //    * Fetches user data and handles authentication/authorization
  //    */
  //   const fetchUserData = async () => {
  //     try {
  //       // Try to get user from API first
  //       const response = await fetch("/api/user", {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         credentials: "include",
  //         cache: "no-store",
  //       });

  //       if (response.ok) {
  //         const data = await response.json();

  //         if (data.user) {
  //           // Check if user is admin (should be on admin dashboard)
  //           if (data.user.permissions === "admin") {
  //             window.location.replace("/dashboard/admin");
  //             return;
  //           }

  //           setUser(data.user);
  //           setIsLoading(false);
  //           return;
  //         }
  //       }

  //       // Fallback: try to get from localStorage
  //       const currentUser = getCurrentUser();

  //       if (!currentUser) {
  //         window.location.replace("/sign-in");
  //         return;
  //       }

  //       // Check if user is admin (should be on admin dashboard)
  //       if (currentUser.permissions === "admin") {
  //         window.location.replace("/dashboard/admin");
  //         return;
  //       }

  //       setUser(currentUser);
  //       setIsLoading(false);
  //     } catch (error) {
  //       console.error("Error fetching user data:", error);
  //       window.location.replace("/sign-in");
  //     }
  //   };

  //   fetchUserData();
  // }, []);

  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shopee-orange"></div>
  //     </div>
  //   );
  // }

  // if (!user) {
  //   return null;
  // }

  return (
    <>
      // <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        // <DriverDashboard user={user} />
      </main>
    </>
  );
}
