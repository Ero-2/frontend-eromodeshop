/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '7220',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '7220',
        pathname: '/uploads/**',
      },
    ],
    // Desactivar optimización de imágenes para localhost en desarrollo
    unoptimized: true,
  },
  // Headers de seguridad más permisivos para desarrollo
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "img-src 'self' https://localhost:7220 http://localhost:7220 data: blob:",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

