"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { createClient } from "../../../../supabase/client";
import { User } from "@/types";
import RegionPreferences from "@/components/preferences/RegionPreferences";

export default function Preferences() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();

        if (sessionData.session) {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", sessionData.session.user.id)
            .single();

          if (userError) throw userError;
          setUser(userData as User);
        } else {
          // Verificar usuário no localStorage
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            router.push("/sign-in");
          }
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        router.push("/sign-in");
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router, supabase.auth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Navbar />

      <main className="container px-4 py-6 mx-auto">
        <h1 className="mb-6 text-2xl font-bold">Preferências de Região</h1>

        <RegionPreferences userId={user.id} hubId={user.hub_id || ""} />
      </main>
    </>
  );
}
