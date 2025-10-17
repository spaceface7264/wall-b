/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    turbo: {
      root: '/Users/rami/Desktop/html/Proj/proj'
    }
  }
}

module.exports = nextConfig