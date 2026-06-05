/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static HTML export for Cloudflare Pages.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
