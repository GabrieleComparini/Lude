/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'res.cloudinary.com', // Allow Cloudinary images 
      'lh3.googleusercontent.com' // Allow Google profile images
    ],
  },
  env: {
    // Public environment variables can be accessed via process.env
    // in both the client and server
    APP_NAME: 'Lude',
    APP_DESCRIPTION: 'Track your rides and connect with other enthusiasts',
  }
};

module.exports = nextConfig; 