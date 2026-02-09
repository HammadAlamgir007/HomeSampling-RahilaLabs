/** @type {import('next').NextConfig} */
// Force fresh deployment - no standalone mode
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

}

export default nextConfig