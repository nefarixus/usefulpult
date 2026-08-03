/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  // Next's static export defaults to absolute asset paths ("/_next/...")
  // which work fine served over http, but resolve to the filesystem root
  // (not the "out" folder) when the HTML is opened via file:// — exactly
  // what Electron does. Relative paths fix that.
  assetPrefix: "./",
  trailingSlash: true,
};

export default nextConfig;
