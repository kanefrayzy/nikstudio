/**
 * Build Configuration Utilities for Cross-Browser Compatibility
 * Provides runtime configuration based on build-time settings
 */

export interface BuildConfig {
  browserSupport: {
    modernBrowsers: boolean;
    legacySupport: boolean;
    targetBrowsers: string[];
  };
  features: {
    autoprefixer: boolean;
    customProperties: boolean;
    polyfills: boolean;
    bundleOptimization: boolean;
  };
  environment: 'development' | 'production' | 'test';
}

/**
 * Get build configuration based on environment variables
 */
export function getBuildConfig(): BuildConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';

  return {
    browserSupport: {
      modernBrowsers: isProduction,
      legacySupport: true,
      targetBrowsers: [
        '> 0.5%',
        'last 2 versions',
        'not dead',
        'not ie <= 11',
        'Chrome >= 80',
        'Firefox >= 78',
        'Safari >= 12',
        'Edge >= 79'
      ]
    },
    features: {
      autoprefixer: true,
      customProperties: true,
      polyfills: true,
      bundleOptimization: isProduction
    },
    environment: isTest ? 'test' : (isProduction ? 'production' : 'development')
  };
}

/**
 * Check if a specific browser feature should be polyfilled based on build config
 */
export function shouldPolyfill(_feature: string): boolean {
  const config = getBuildConfig();
  
  if (!config.features.polyfills) {
    return false;
  }

  // In development, always load polyfills for testing
  if (config.environment === 'development') {
    return true;
  }

  // In production, use feature detection
  return config.browserSupport.legacySupport;
}

/**
 * Get CSS processing configuration
 */
export function getCSSConfig() {
  const config = getBuildConfig();
  
  return {
    autoprefixer: {
      enabled: config.features.autoprefixer,
      options: {
        flexbox: 'no-2009',
        grid: 'autoplace',
        overrideBrowserslist: config.browserSupport.targetBrowsers
      }
    },
    customProperties: {
      enabled: config.features.customProperties,
      options: {
        preserve: true
      }
    },
    presetEnv: {
      enabled: true,
      options: {
        stage: 2,
        autoprefixer: {
          flexbox: 'no-2009',
          grid: 'autoplace'
        },
        features: {
          'custom-properties': {
            preserve: true
          },
          'nesting-rules': true,
          'custom-media-queries': true,
          'media-query-ranges': true
        }
      }
    }
  };
}

/**
 * Get JavaScript processing configuration
 */
export function getJSConfig() {
  const config = getBuildConfig();
  
  return {
    babel: {
      presets: [
        'next/babel',
        [
          '@babel/preset-env',
          {
            useBuiltIns: 'usage',
            corejs: { version: 3, proposals: true },
            targets: {
              browsers: config.browserSupport.targetBrowsers
            },
            modules: false,
            debug: config.environment === 'development'
          }
        ]
      ],
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            corejs: 3,
            helpers: true,
            regenerator: true,
            useESModules: false
          }
        ]
      ]
    },
    polyfills: {
      enabled: config.features.polyfills,
      coreJs: 3,
      targets: config.browserSupport.targetBrowsers
    }
  };
}

/**
 * Get webpack optimization configuration
 */
export function getWebpackConfig() {
  const config = getBuildConfig();
  
  return {
    optimization: {
      enabled: config.features.bundleOptimization,
      splitChunks: {
        polyfills: {
          name: 'polyfills',
          test: /[\\/]node_modules[\\/](core-js|regenerator-runtime|whatwg-fetch)[\\/]/,
          priority: 10
        },
        vendor: {
          name: 'vendor',
          test: /[\\/]node_modules[\\/]/,
          priority: 5
        }
      }
    },
    resolve: {
      fallbacks: {
        fs: false,
        net: false,
        tls: false,
        crypto: false
      }
    }
  };
}

/**
 * Runtime feature flags based on build configuration
 */
export const buildFeatures = {
  // CSS Features
  get cssCustomProperties() {
    return getBuildConfig().features.customProperties;
  },
  
  get cssAutoprefixer() {
    return getBuildConfig().features.autoprefixer;
  },
  
  // JavaScript Features
  get jsPolyfills() {
    return getBuildConfig().features.polyfills;
  },
  
  get bundleOptimization() {
    return getBuildConfig().features.bundleOptimization;
  },
  
  // Browser Support
  get modernBrowsers() {
    return getBuildConfig().browserSupport.modernBrowsers;
  },
  
  get legacySupport() {
    return getBuildConfig().browserSupport.legacySupport;
  },
  
  // Environment
  get isDevelopment() {
    return getBuildConfig().environment === 'development';
  },
  
  get isProduction() {
    return getBuildConfig().environment === 'production';
  },
  
  get isTest() {
    return getBuildConfig().environment === 'test';
  }
};

/**
 * Debug information for build configuration
 */
export function debugBuildConfig() {
  if (typeof window !== 'undefined' && buildFeatures.isDevelopment) {
    const config = getBuildConfig();
    console.group('🔧 Build Configuration');
    console.log('Environment:', config.environment);
    console.log('Browser Support:', config.browserSupport);
    console.log('Features:', config.features);
    console.log('CSS Config:', getCSSConfig());
    console.log('JS Config:', getJSConfig());
    console.log('Webpack Config:', getWebpackConfig());
    console.groupEnd();
  }
}