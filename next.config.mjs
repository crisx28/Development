/** @type {import('next').NextConfig} */

// For GitHub Pages project sites the app is served from /<repo>/, so the
// workflow passes PAGES_BASE_PATH (e.g. "/development"). Locally it's empty.
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  output: "export", // fully static — no Node server needed to host
  basePath,
  // Expose the base path to client components (SW registration, asset URLs).
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
