/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  generateBuildId: async () => {
    // Force unique build ID to bust cache
    return `build-${Date.now()}`
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: 'https://agentassist-1.onrender.com',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://agentassist-1.onrender.com/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
