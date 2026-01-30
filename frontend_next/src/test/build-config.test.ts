/**
 * Tests for build configuration utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getBuildConfig,
  shouldPolyfill,
  getCSSConfig,
  getJSConfig,
  getWebpackConfig,
  buildFeatures
} from '../lib/build-config';

describe('Build Configuration', () => {
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('getBuildConfig', () => {
    it('should return development config in development mode', () => {
      process.env.NODE_ENV = 'development';

      const config = getBuildConfig();

      expect(config.environment).toBe('development');
      expect(config.browserSupport.modernBrowsers).toBe(false);
      expect(config.browserSupport.legacySupport).toBe(true);
      expect(config.features.bundleOptimization).toBe(false);
    });

    it('should return production config in production mode', () => {
      process.env.NODE_ENV = 'production';

      const config = getBuildConfig();

      expect(config.environment).toBe('production');
      expect(config.browserSupport.modernBrowsers).toBe(true);
      expect(config.browserSupport.legacySupport).toBe(true);
      expect(config.features.bundleOptimization).toBe(true);
    });

    it('should return test config in test mode', () => {
      process.env.NODE_ENV = 'test';

      const config = getBuildConfig();

      expect(config.environment).toBe('test');
      expect(config.browserSupport.modernBrowsers).toBe(false);
      expect(config.features.bundleOptimization).toBe(false);
    });

    it('should include target browsers', () => {
      const config = getBuildConfig();

      expect(config.browserSupport.targetBrowsers).toContain('Chrome >= 80');
      expect(config.browserSupport.targetBrowsers).toContain('Firefox >= 78');
      expect(config.browserSupport.targetBrowsers).toContain('Safari >= 12');
      expect(config.browserSupport.targetBrowsers).toContain('Edge >= 79');
    });

    it('should enable all compatibility features', () => {
      const config = getBuildConfig();

      expect(config.features.autoprefixer).toBe(true);
      expect(config.features.customProperties).toBe(true);
      expect(config.features.polyfills).toBe(true);
    });
  });

  describe('shouldPolyfill', () => {
    it('should return true in development mode', () => {
      process.env.NODE_ENV = 'development';

      expect(shouldPolyfill('fetch')).toBe(true);
      expect(shouldPolyfill('promises')).toBe(true);
    });

    it('should return true in production with legacy support', () => {
      process.env.NODE_ENV = 'production';

      expect(shouldPolyfill('fetch')).toBe(true);
      expect(shouldPolyfill('promises')).toBe(true);
    });
  });

  describe('getCSSConfig', () => {
    it('should return autoprefixer configuration', () => {
      const config = getCSSConfig();

      expect(config.autoprefixer.enabled).toBe(true);
      expect(config.autoprefixer.options.flexbox).toBe('no-2009');
      expect(config.autoprefixer.options.grid).toBe('autoplace');
      expect(Array.isArray(config.autoprefixer.options.overrideBrowserslist)).toBe(true);
    });

    it('should return custom properties configuration', () => {
      const config = getCSSConfig();

      expect(config.customProperties.enabled).toBe(true);
      expect(config.customProperties.options.preserve).toBe(true);
    });

    it('should return preset-env configuration', () => {
      const config = getCSSConfig();

      expect(config.presetEnv.enabled).toBe(true);
      expect(config.presetEnv.options.stage).toBe(2);
      expect(config.presetEnv.options.features['custom-properties'].preserve).toBe(true);
      expect(config.presetEnv.options.features['nesting-rules']).toBe(true);
    });
  });

  describe('getJSConfig', () => {
    it('should return babel configuration', () => {
      const config = getJSConfig();

      expect(config.babel.presets).toContain('next/babel');
      expect(config.babel.presets[1][0]).toBe('@babel/preset-env');
      expect(config.babel.presets[1][1].useBuiltIns).toBe('usage');
      expect(config.babel.presets[1][1].corejs.version).toBe(3);
    });

    it('should include transform-runtime plugin', () => {
      const config = getJSConfig();

      expect(config.babel.plugins[0][0]).toBe('@babel/plugin-transform-runtime');
      expect(config.babel.plugins[0][1].corejs).toBe(3);
      expect(config.babel.plugins[0][1].helpers).toBe(true);
    });

    it('should enable polyfills configuration', () => {
      const config = getJSConfig();

      expect(config.polyfills.enabled).toBe(true);
      expect(config.polyfills.coreJs).toBe(3);
      expect(Array.isArray(config.polyfills.targets)).toBe(true);
    });
  });

  describe('getWebpackConfig', () => {
    it('should return optimization configuration in production', () => {
      process.env.NODE_ENV = 'production';

      const config = getWebpackConfig();

      expect(config.optimization.enabled).toBe(true);
      expect(config.optimization.splitChunks.polyfills.name).toBe('polyfills');
      expect(config.optimization.splitChunks.vendor.name).toBe('vendor');
    });

    it('should return resolve fallbacks', () => {
      const config = getWebpackConfig();

      expect(config.resolve.fallbacks.fs).toBe(false);
      expect(config.resolve.fallbacks.net).toBe(false);
      expect(config.resolve.fallbacks.crypto).toBe(false);
    });
  });

  describe('buildFeatures', () => {
    it('should provide CSS feature flags', () => {
      expect(typeof buildFeatures.cssCustomProperties).toBe('boolean');
      expect(typeof buildFeatures.cssAutoprefixer).toBe('boolean');
    });

    it('should provide JavaScript feature flags', () => {
      expect(typeof buildFeatures.jsPolyfills).toBe('boolean');
      expect(typeof buildFeatures.bundleOptimization).toBe('boolean');
    });

    it('should provide browser support flags', () => {
      expect(typeof buildFeatures.modernBrowsers).toBe('boolean');
      expect(typeof buildFeatures.legacySupport).toBe('boolean');
    });

    it('should provide environment flags', () => {
      expect(typeof buildFeatures.isDevelopment).toBe('boolean');
      expect(typeof buildFeatures.isProduction).toBe('boolean');
      expect(typeof buildFeatures.isTest).toBe('boolean');
    });

    it('should have correct environment detection', () => {
      process.env.NODE_ENV = 'development';
      expect(buildFeatures.isDevelopment).toBe(true);
      expect(buildFeatures.isProduction).toBe(false);
      expect(buildFeatures.isTest).toBe(false);

      process.env.NODE_ENV = 'production';
      expect(buildFeatures.isDevelopment).toBe(false);
      expect(buildFeatures.isProduction).toBe(true);
      expect(buildFeatures.isTest).toBe(false);

      process.env.NODE_ENV = 'test';
      expect(buildFeatures.isDevelopment).toBe(false);
      expect(buildFeatures.isProduction).toBe(false);
      expect(buildFeatures.isTest).toBe(true);
    });
  });

  describe('Configuration Consistency', () => {
    it('should have consistent target browsers across configs', () => {
      const buildConfig = getBuildConfig();
      const cssConfig = getCSSConfig();
      const jsConfig = getJSConfig();

      expect(buildConfig.browserSupport.targetBrowsers).toEqual(
        cssConfig.autoprefixer.options.overrideBrowserslist
      );
      expect(buildConfig.browserSupport.targetBrowsers).toEqual(
        jsConfig.babel.presets[1][1].targets.browsers
      );
    });

    it('should enable features consistently', () => {
      const buildConfig = getBuildConfig();
      const cssConfig = getCSSConfig();
      const jsConfig = getJSConfig();

      expect(buildConfig.features.autoprefixer).toBe(cssConfig.autoprefixer.enabled);
      expect(buildConfig.features.customProperties).toBe(cssConfig.customProperties.enabled);
      expect(buildConfig.features.polyfills).toBe(jsConfig.polyfills.enabled);
    });
  });
});