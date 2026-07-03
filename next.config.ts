import type { NextConfig } from "next";

/** @type {NextConfig} */
const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("node-ssh", "ssh2");
    }
    return config;
  },
  turbopack: {
    resolveAlias: {
      yjs: "./node_modules/yjs", // or just "yjs" if not relocating path
    },
  },
  serverExternalPackages: ['node-ssh', 'ssh2'], // <— add any Node-only packages here
  // Configure headers for cross-origin isolation (required for WebContainer)
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          // {
          //   key: 'Cross-Origin-Embedder-Policy',
          //   value: 'require-corp'
          // },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          // Alternative: Use CSP instead of X-Frame-Options
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://cognix.live https://*.dokku-ocean.cognix.live",
          },
        ]
      }
    ];
  }
};

export default nextConfig;