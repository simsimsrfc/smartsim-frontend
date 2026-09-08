/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Logos d'équipes API-Football + autres
    remotePatterns: [
      { protocol: "https", hostname: "media.api-sports.io" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};
module.exports = nextConfig;
