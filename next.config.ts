import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Setiap kali frontend Next.js memanggil URL yang berawalan /api-proxy/...
        source: '/api-proxy/:path*',
        
        // ...secara diam-diam teruskan (proxy) ke server backend asli Anda
        destination: 'https://dev.katib.cloud/:path*', 
      },
    ];
  },
};

export default nextConfig;