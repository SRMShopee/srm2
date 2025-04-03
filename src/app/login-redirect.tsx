"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Constants
const REDIRECT_TIMEOUT_MS = 10000; // 10 seconds
const FALLBACK_DELAY_MS = 300; // 300 milliseconds
const RETRY_DELAY_MS = 500; // 500 milliseconds

/**
 * Component that handles post-login redirection
 * Uses multiple redirection strategies for reliability
 */
export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    /**
     * Handles the redirection logic using data from sessionStorage
     */
    const handleRedirection = () => {
      // Get redirection data from sessionStorage
      const redirectPath = sessionStorage.getItem("redirectPath");
      const loginSuccess = sessionStorage.getItem("loginSuccess");
      const loginTimestamp = sessionStorage.getItem("loginTimestamp");
      const forceRedirect = sessionStorage.getItem("forceRedirect");

      // Validate redirection data
      if (!redirectPath && !forceRedirect) {
        return;
      }

      // Determine which path to use
      const finalRedirectPath = redirectPath || forceRedirect;

      // Check if the redirect is recent when using loginTimestamp
      if (loginTimestamp) {
        const timestamp = parseInt(loginTimestamp, 10);
        const isRecent =
          !isNaN(timestamp) && Date.now() - timestamp < REDIRECT_TIMEOUT_MS;

        if (!isRecent) {
          return;
        }
      }

      // Clear redirection data
      sessionStorage.removeItem("redirectPath");
      sessionStorage.removeItem("loginSuccess");
      sessionStorage.removeItem("loginTimestamp");
      sessionStorage.removeItem("forceRedirect");

      try {
        // First try router.push
        router.push(finalRedirectPath!);

        // If we're still here after a short delay, try window.location
        setTimeout(() => {
          if (window.location.pathname.includes("/sign-in")) {
            window.location.replace(finalRedirectPath!);
          }
        }, FALLBACK_DELAY_MS);
      } catch (error) {
        console.error("Redirection error:", error);
        // Last resort
        window.location.href = finalRedirectPath!;
      }
    };

    // Execute redirection logic
    handleRedirection();

    // Set up a timer to check again after a short delay
    const timer = setTimeout(handleRedirection, RETRY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [router]); // Include router in dependencies

  // This component doesn't render anything
  return null;
}
