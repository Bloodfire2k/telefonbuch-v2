/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output für Docker
  output: 'standalone',
  
  // Experimentelle Features
  experimental: {
    // App Router ist jetzt standardmäßig aktiviert
  },
  
  // Bilder-Optimierung
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig 