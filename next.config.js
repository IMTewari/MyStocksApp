
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { appDir: true },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark optional native deps of ws as externals to avoid bundling errors
      config.externals = config.externals || [];
      config.externals.push('utf-8-validate', 'bufferutil');
    }
    return config;
  }
}
module.exports = nextConfig
