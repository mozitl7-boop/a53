/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    unoptimized: true,
  },

  allowedDevOrigins: ['192.168.1.8', '192.168.137.1'],
}

export default nextConfig