import type { NextConfig } from "next";

/**
 * GitHub Pages serves static files only, so the site is exported to `out/`.
 * This is a user site (darshakdharaiya.github.io), served from the domain root,
 * so no basePath or assetPrefix is needed.
 */
const nextConfig: NextConfig = {
  output: "export",
  // Pages has no image optimiser; sources are already sized WebP.
  images: { unoptimized: true },
  // Export directories so every route resolves without server rewrites.
  trailingSlash: true,
};

export default nextConfig;
