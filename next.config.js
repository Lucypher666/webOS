/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,

  async headers() {
    return [
      {
        // Allow any external website to call the GraphQL API
        source: '/api/graphql',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, x-api-key' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    // Allow all remote images in development only
    ...(process.env.NODE_ENV === 'development' && {
      remotePatterns: [{ protocol: 'https', hostname: '**' }],
    }),
  },
}

module.exports = nextConfig
