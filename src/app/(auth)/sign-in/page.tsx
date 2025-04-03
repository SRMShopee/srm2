"use client";

import { FormMessage, Message } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { signIn, isAuthenticated, getCurrentUser } from "@/utils/auth";

// Dynamically import icons to prevent hydration mismatch
const Package = dynamic(
  () => import("lucide-react").then((mod) => mod.Package),
  { ssr: false },
);
const Truck = dynamic(() => import("lucide-react").then((mod) => mod.Truck), {
  ssr: false,
});
const Lock = dynamic(() => import("lucide-react").then((mod) => mod.Lock), {
  ssr: false,
});
const Eye = dynamic(() => import("lucide-react").then((mod) => mod.Eye), {
  ssr: false,
});
const EyeOff = dynamic(() => import("lucide-react").then((mod) => mod.EyeOff), {
  ssr: false,
});
const Moon = dynamic(() => import("lucide-react").then((mod) => mod.Moon), {
  ssr: false,
});
const Sun = dynamic(() => import("lucide-react").then((mod) => mod.Sun), {
  ssr: false,
});
const User = dynamic(() => import("lucide-react").then((mod) => mod.User), {
  ssr: false,
});
const MapPin = dynamic(() => import("lucide-react").then((mod) => mod.MapPin), {
  ssr: false,
});

interface LoginProps {
  searchParams: {
    error?: string;
    success?: string;
    message?: string;
    redirect?: string;
  };
}

export default function SignInPage({ searchParams }: LoginProps) {
  const router = useRouter();
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set mounted to true after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Add a listener for storage events to handle cross-tab authentication
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "session" && event.newValue) {
        console.log(
          "Session storage changed in another tab, checking authentication",
        );
        if (isAuthenticated()) {
          const user = getCurrentUser();
          if (user?.permissions === "admin") {
            window.location.replace("/dashboard/admin");
          } else {
            window.location.replace("/dashboard");
          }
        }
      }
    };

    // Add listener for the custom authentication event
    const handleAuthSuccess = (e: CustomEvent) => {
      console.log("Auth success event detected", e.detail);
      if (e.detail && e.detail.redirectPath) {
        console.log("Redirecting via event to:", e.detail.redirectPath);
        window.location.replace(e.detail.redirectPath);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "authSuccess" as any,
      handleAuthSuccess as EventListener,
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "authSuccess" as any,
        handleAuthSuccess as EventListener,
      );
    };
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      console.log("Checking session...");

      // Check for login success flag in sessionStorage
      const loginSuccess = sessionStorage.getItem("loginSuccess");
      const userPermissions = sessionStorage.getItem("userPermissions");

      if (loginSuccess === "true" && userPermissions) {
        console.log(
          "Found login success flag, redirecting based on permissions:",
          userPermissions,
        );
        // Clear the flag
        sessionStorage.removeItem("loginSuccess");
        sessionStorage.removeItem("userPermissions");

        // Redirect based on permissions
        if (userPermissions === "admin") {
          window.location.replace("/dashboard/admin");
        } else {
          window.location.replace("/dashboard");
        }
        return;
      }

      if (isMounted && isAuthenticated() && typeof window !== "undefined") {
        console.log("User already logged in, redirecting to dashboard");
        const user = getCurrentUser();
        if (user?.permissions === "admin") {
          window.location.replace("/dashboard/admin");
        } else {
          window.location.replace("/dashboard");
        }
      }
    };

    // Only run once when component mounts
    const hasRun = sessionStorage.getItem("sessionCheckRun");
    if (!hasRun) {
      sessionStorage.setItem("sessionCheckRun", "true");
      checkSession();

      // Clear the flag after a short delay to allow for page navigation
      setTimeout(() => {
        sessionStorage.removeItem("sessionCheckRun");
      }, 2000);
    }

    return () => {
      isMounted = false;
    };
  }, []); // Remove router dependency to prevent re-runs

  // Convert searchParams to Message type for FormMessage component
  const message: Message = loginError
    ? { error: loginError }
    : searchParams.error
      ? { error: searchParams.error }
      : searchParams.success
        ? { success: searchParams.success }
        : searchParams.message
          ? { message: searchParams.message }
          : {};

  // Check if we have any message to display
  const hasMessage = Object.keys(message).length > 0;

  // Handle redirect from action - using client-side script
  const redirectUrl = searchParams.redirect;
  if (redirectUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shopee-orange mx-auto mb-4"></div>
          <p>Redirecionando...</p>
          <script
            dangerouslySetInnerHTML={{
              __html: `window.location.href = "${redirectUrl}"`,
            }}
          />
        </div>
      </div>
    );
  }

  // Handle login form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Clear previous errors
    setLoginError("");

    // Get form data
    const formData = new FormData(e.currentTarget);
    const driverId = formData.get("driverId") as string;
    const password = formData.get("password") as string;

    // Validate inputs
    if (!driverId?.trim() || !password?.trim()) {
      setLoginError("Driver ID e senha são obrigatórios");
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("Iniciando processo de login...");
      // Attempt login
      const result = await signIn(driverId.trim(), password.trim());

      // Handle error case
      if (result.error) {
        console.log("Erro no login:", result.error);
        setLoginError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Handle successful login
      if (result.user) {
        console.log("Login bem-sucedido, preparando redirecionamento...");
        // Set timeout to reset submission state if navigation fails
        const timeoutId = setTimeout(() => setIsSubmitting(false), 5000);

        try {
          // Determine redirect path based on user permissions
          const redirectPath =
            result.user.permissions === "admin"
              ? "/dashboard/admin"
              : "/dashboard";

          console.log("Redirecionando para:", redirectPath);

          // Store redirect path for potential fallback mechanisms
          sessionStorage.setItem("forceRedirect", redirectPath);
          localStorage.setItem("lastLoginTime", Date.now().toString());

          // Multi-layered redirection approach
          // 1. First try router.push
          router.push(redirectPath);

          // 2. If after a short period we're still on the login page, use window.location.replace
          setTimeout(() => {
            if (window.location.pathname.includes("sign-in")) {
              console.log("Fallback: using window.location.replace");
              window.location.replace(redirectPath);
            }
          }, 500);

          // 3. Last resort after a longer delay
          setTimeout(() => {
            if (window.location.pathname.includes("sign-in")) {
              console.log("Last resort: using window.location.href");
              window.location.href = redirectPath;
            }
          }, 1000);

          // Clear the timeout if we're redirecting
          clearTimeout(timeoutId);
        } catch (navError) {
          console.error("Error during redirection:", navError);
          setLoginError("Erro ao redirecionar. Por favor, tente novamente.");
          setIsSubmitting(false);
        }
      } else {
        setLoginError("Erro ao recuperar dados do usuário. Tente novamente.");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Unexpected error during login:", err);
      setLoginError(
        "Erro inesperado ao fazer login. Tente novamente mais tarde.",
      );
      setIsSubmitting(false);
    }
  };

  // Animated background elements
  const renderBackgroundElements = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      {renderBackgroundElements()}

      {/* Floating icons */}
      {mounted && (
        <>
          <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 text-orange-300 opacity-10 dark:opacity-5">
            <Truck className="h-20 w-20 animate-float" />
          </div>
          <div className="absolute bottom-1/4 right-1/4 transform translate-x-1/2 translate-y-1/2 text-orange-300 opacity-10 dark:opacity-5">
            <Package className="h-16 w-16 animate-float animation-delay-2000" />
          </div>
        </>
      )}

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-full shadow-xl border border-orange-200 dark:border-gray-700 bg-gradient-to-br from-white to-orange-50">
              <Package className="h-14 w-14 text-shopee-orange" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-shopee-orange drop-shadow-md">
            SRM
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
            Sistema de Gerenciamento de Rotas
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-gray-700 shadow-2xl overflow-hidden backdrop-blur-sm bg-opacity-95 dark:bg-opacity-90">
          <div className="p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md">
            <div className="flex items-center gap-3">
              <Truck className="h-6 w-6" />
              <h2 className="text-xl font-semibold">Login do Entregador</h2>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-6 dark:text-gray-200"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="driverId"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <User className="h-4 w-4 text-shopee-orange" />
                  Driver ID
                </Label>
                <Input
                  id="driverId"
                  name="driverId"
                  type="text"
                  placeholder="Digite seu Driver ID"
                  required
                  className="w-full border-orange-200 focus:border-orange-500 focus:ring-orange-500 transition-all duration-300"
                  defaultValue=""
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Lock className="h-4 w-4 text-shopee-orange" />
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Digite sua senha"
                    required
                    className="w-full border-orange-200 focus:border-orange-500 focus:ring-orange-500 pr-10 transition-all duration-300"
                    defaultValue=""
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70 transform hover:-translate-y-1"
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>

            <div className="pt-4">
              {hasMessage && <FormMessage message={message} />}
            </div>

            {/* Only render theme toggle button after hydration */}
            {mounted && (
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 text-sm transform hover:scale-105"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4 text-yellow-400" />
                      Modo Claro
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 text-gray-700" />
                      Modo Escuro
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Utilize o Driver ID e os últimos 4 dígitos do seu telefone</p>
        </div>
      </div>
    </div>
  );
}
