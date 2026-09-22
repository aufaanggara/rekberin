/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.utfs.io" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.sandbox.midtrans.com", pathname: "/v2/**" },
      { protocol: "https", hostname: "api.sandbox.midtrans.com", pathname: "/v4/**" },
      { protocol: "https", hostname: "api.midtrans.com", pathname: "/v2/**" },
      { protocol: "https", hostname: "api.midtrans.com", pathname: "/v4/**" },
    ],
  },
};
export default nextConfig;
