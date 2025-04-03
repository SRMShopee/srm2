"use client";

import { useEffect } from "react";

/**
 * Componente de depuração para ajudar a diagnosticar problemas de redirecionamento
 * Adicione este componente ao layout principal para logs detalhados
 */
export default function DebugRedirect() {
  useEffect(() => {
    // Função para verificar o estado da autenticação
    const checkAuthState = () => {
      try {
        const session = localStorage.getItem("session");
        const authStatus = document.cookie.includes("auth_status");
        const sessionCookie = document.cookie.includes("session=");
        const forceRedirect = sessionStorage.getItem("forceRedirect");
        const loginSuccess = sessionStorage.getItem("loginSuccess");

        console.group("Estado de Autenticação");
        console.log("Sessão no localStorage:", !!session);
        console.log("Cookie auth_status:", authStatus);
        console.log("Cookie session:", sessionCookie);
        console.log("forceRedirect em sessionStorage:", forceRedirect);
        console.log("loginSuccess em sessionStorage:", loginSuccess);
        console.log("URL atual:", window.location.href);
        console.log("Pathname:", window.location.pathname);
        console.groupEnd();

        // Verificar se estamos na página de login mas deveríamos estar redirecionando
        if (
          window.location.pathname.includes("/sign-in") &&
          (!!session || authStatus || sessionCookie) &&
          (forceRedirect || loginSuccess)
        ) {
          console.warn("Possível problema de redirecionamento detectado!");
          console.log("Tentando redirecionamento de emergência...");

          // Determinar para onde redirecionar
          let redirectTo = forceRedirect || "/dashboard";

          // Tentar redirecionamento de emergência
          setTimeout(() => {
            if (window.location.pathname.includes("/sign-in")) {
              console.log(
                "Executando redirecionamento de emergência para",
                redirectTo,
              );
              window.location.replace(redirectTo);
            }
          }, 1500);
        }
      } catch (error) {
        console.error("Erro ao verificar estado de autenticação:", error);
      }
    };

    // Verificar estado inicial
    checkAuthState();

    // Verificar novamente após um curto período
    const timer = setTimeout(checkAuthState, 1000);

    return () => clearTimeout(timer);
  }, []);

  return null; // Componente não renderiza nada visualmente
}
