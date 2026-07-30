/** @type {import('next').NextConfig} */

// GitHub Pages serves project sites from https://<user>.github.io/<repo>/, so
// every asset/link needs that repo name as a base path. GITHUB_REPOSITORY is
// set automatically by GitHub Actions ("owner/repo"); NEXT_PUBLIC_BASE_PATH
// lets you override it locally or for a custom domain (set it to "").
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (repoName ? `/${repoName}` : "");

const nextConfig = {
  output: "export",
  reactStrictMode: true,
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    // Static export has no image optimization server; ship images as-is.
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default nextConfig;
