/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    domains: ["images.unsplash.com"],
  },
  // Enhanced webpack configuration to prevent ENOENT errors
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Disable caching in development mode
      config.cache = false;

      // Add fallback for missing build manifest
      config.watchOptions = {
        ...config.watchOptions,
        ignored: /node_modules/,
        poll: 1000, // Check for changes every second
      };
    }

    // Create empty fallback files for missing manifests
    if (isServer) {
      const fs = require("fs");
      const path = require("path");
      const dir = path.join(process.cwd(), ".next");

      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const fallbackManifest = path.join(dir, "fallback-build-manifest.json");
        if (!fs.existsSync(fallbackManifest)) {
          fs.writeFileSync(fallbackManifest, "{}", "utf8");
        }
      } catch (err) {
        console.warn("Warning: Failed to create fallback manifest:", err);
      }
    }

    return config;
  },
  // Disable persistent caching
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 15 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Disable strict mode temporarily to avoid double rendering issues
  reactStrictMode: false,
  // Improve error handling and fix routing conflicts
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: [],
  },
};

if (process.env.NEXT_PUBLIC_TEMPO) {
  nextConfig["experimental"] = {
    // NextJS 14.1.0:
    swcPlugins: [[require.resolve("tempo-devtools/swc/0.86"), {}]],
    // Disable JIT compilation for SWC
    swcMinify: false,
  };
}

module.exports = nextConfig;
