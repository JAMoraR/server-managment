/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizar compilación
  reactStrictMode: true,
  
  // Optimizar imports de lucide-react para reducir bundle size
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      skipDefaultConversion: true
    }
  },

  // Optimizar fuentes
  optimizeFonts: true,

  // Comprimir imágenes
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mlnmgmwstrczomfreeqm.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Experimental features para mejor rendimiento
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
    scrollRestoration: true,
  },

  // Comprimir salida
  compress: true,

  // Reducir tamaño de página
  poweredByHeader: false,

  // Configurar caching
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
}

module.exports = nextConfig
