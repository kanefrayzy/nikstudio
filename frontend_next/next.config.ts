import type { NextConfig } from "next";

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Image optimization configuration
  images: {
    remotePatterns: [
      // Localhost development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      // Production domain
      {
        protocol: 'https',
        hostname: 'nikstudio.pro',
        pathname: '/storage/**',
      },
      // IP address fallback (если нужно)
      {
        protocol: 'http',
        hostname: '109.205.58.5',
        port: '8000',
        pathname: '/storage/**',
      },
      // HTTPS для IP (если SSL настроен)
      {
        protocol: 'https',
        hostname: '109.205.58.5',
        pathname: '/storage/**',
      }
    ],
    // Enable modern image formats with fallbacks
    formats: ['image/webp', 'image/avif'],
    // Optimize for different device sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compiler optimizations for cross-browser compatibility
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
    // Remove data-test attributes in production
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? {
      properties: ['^data-test']
    } : false,
  },



  // Experimental features for better compatibility
  experimental: {
    // Enable modern bundling optimizations
    optimizeCss: true,
  },

  // Webpack configuration for cross-browser compatibility
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add polyfills for older browsers
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Optimize chunks for better browser caching
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Heavy libraries - highest priority
            fullcalendar: {
              test: /[\\/]node_modules[\\/]@fullcalendar[\\/]/,
              name: 'fullcalendar',
              priority: 20,
            },
            apexcharts: {
              test: /[\\/]node_modules[\\/](apexcharts|react-apexcharts)[\\/]/,
              name: 'apexcharts',
              priority: 20,
            },
            carousel: {
              test: /[\\/]node_modules[\\/]swiper[\\/]/,
              name: 'carousel',
              priority: 20,
            },
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-ui',
              priority: 15,
            },
            // Separate polyfills into their own chunk
            polyfills: {
              name: 'polyfills',
              test: /[\\/]node_modules[\\/](core-js|regenerator-runtime|whatwg-fetch)[\\/]/,
              chunks: 'all',
              priority: 10,
            },
            // Separate vendor libraries
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              chunks: 'all',
              priority: 5,
            },
            // Common components
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 1,
            }
          }
        }
      };
    }

    // Add webpack plugins for compatibility
    config.plugins.push(
      // Define environment variables for feature detection
      new webpack.DefinePlugin({
        'process.env.BROWSER_SUPPORT': JSON.stringify({
          MODERN_BROWSERS: process.env.NODE_ENV === 'production',
          LEGACY_SUPPORT: true,
        })
      })
    );

    return config;
  },

  // Headers for better browser compatibility and caching
  async headers() {
    return [
      // Static assets - 1 year cache
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/video/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/:path*.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // Next.js static files - 1 year cache
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // Next.js images - 1 year cache
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // API routes - no cache
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ]
      },
      // HTML pages - no cache (for dynamic content)
      {
        source: '/:path*.html',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      },
      // Default security headers for all routes
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ];
  },

  // Redirects for better SEO and compatibility
  async redirects() {
    return [
      // Add any necessary redirects here
    ];
  },

  // Environment variables
  env: {
    BROWSER_SUPPORT_LEVEL: process.env.NODE_ENV === 'production' ? 'modern' : 'legacy',
  },

  // Output configuration
  output: 'standalone',
  
  // Enable source maps in development for debugging
  productionBrowserSourceMaps: false,
  
  // Optimize for different deployment targets
  target: 'server',

  // Enable compression
  compress: true,

  // Remove X-Powered-By header
  poweredByHeader: false,
};

export default withBundleAnalyzer(nextConfig);