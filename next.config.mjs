/** @type {import('next').NextConfig} */
function normalizeUrl(value) {
  const url = value?.trim();
  if (!url) return null;

  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

// next-auth/react parses NEXTAUTH_URL as soon as a client module is imported.
// An environment variable that exists but is empty bypasses next-auth's Vercel
// fallback and makes static generation fail with `new URL("")`.
const nextAuthUrl =
  normalizeUrl(process.env.NEXTAUTH_URL) ??
  normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  normalizeUrl(process.env.VERCEL_URL) ??
  "http://localhost:3000";

const nextConfig = {
  env: {
    NEXTAUTH_URL: nextAuthUrl,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.utfs.io" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};
export default nextConfig;
