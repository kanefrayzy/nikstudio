/**
 * Integration tests for browser detection system
 * Tests the actual functionality without complex mocking
 */

import { describe, it, expect } from 'vitest';
import { browserDetectionService, featureDetection } from '../lib/browser-detection';

describe('Browser Detection Integration', () => {
  it('should provide browser information', () => {
    const browserInfo = browserDetectionService.getBrowserInfo();
    
    expect(browserInfo).toBeDefined();
    expect(browserInfo.name).toBeDefined();
    expect(typeof browserInfo.version).toBe('number');
    expect(typeof browserInfo.isSupported).toBe('boolean');
    expect(browserInfo.features).toBeDefined();
  });

  it('should detect basic features', () => {
    const browserInfo = browserDetectionService.getBrowserInfo();
    
    // These should be available in the test environment
    expect(typeof browserInfo.features.fetch).toBe('boolean');
    expect(typeof browserInfo.features.promises).toBe('boolean');
    expect(typeof browserInfo.features.asyncAwait).toBe('boolean');
    expect(typeof browserInfo.features.cssGrid).toBe('boolean');
    expect(typeof browserInfo.features.cssFlexbox).toBe('boolean');
    expect(typeof browserInfo.features.customProperties).toBe('boolean');
  });

  it('should provide feature detection methods', () => {
    expect(typeof browserDetectionService.supportsFeature).toBe('function');
    expect(typeof browserDetectionService.requiresPolyfill).toBe('function');
    
    // Test with a known feature
    const supportsFetch = browserDetectionService.supportsFeature('fetch');
    const requiresFetchPolyfill = browserDetectionService.requiresPolyfill('fetch');
    
    expect(typeof supportsFetch).toBe('boolean');
    expect(typeof requiresFetchPolyfill).toBe('boolean');
    expect(supportsFetch).toBe(!requiresFetchPolyfill);
  });

  it('should provide utility functions', () => {
    expect(typeof featureDetection.supportsModernJS).toBe('function');
    expect(typeof featureDetection.supportsModernCSS).toBe('function');
    expect(typeof featureDetection.supportsFileUpload).toBe('function');
    expect(typeof featureDetection.supportsModernMedia).toBe('function');
    expect(typeof featureDetection.getRequiredPolyfills).toBe('function');
    
    const requiredPolyfills = featureDetection.getRequiredPolyfills();
    expect(Array.isArray(requiredPolyfills)).toBe(true);
  });

  it('should cache results consistently', () => {
    const info1 = browserDetectionService.getBrowserInfo();
    const info2 = browserDetectionService.getBrowserInfo();
    
    expect(info1).toBe(info2); // Same object reference due to caching
    expect(info1.name).toBe(info2.name);
    expect(info1.version).toBe(info2.version);
  });

  it('should handle feature checks gracefully', () => {
    // Test with non-existent feature
    const supportsNonExistent = browserDetectionService.supportsFeature('nonExistentFeature');
    const requiresNonExistentPolyfill = browserDetectionService.requiresPolyfill('nonExistentFeature');
    
    expect(supportsNonExistent).toBe(false);
    expect(requiresNonExistentPolyfill).toBe(true);
  });

  it('should provide consistent feature detection results', () => {
    const browserInfo = browserDetectionService.getBrowserInfo();
    
    // Check that service methods return same results as browserInfo
    expect(browserDetectionService.supportsFeature('fetch')).toBe(browserInfo.features.fetch);
    expect(browserDetectionService.supportsFeature('promises')).toBe(browserInfo.features.promises);
    expect(browserDetectionService.supportsFeature('cssGrid')).toBe(browserInfo.features.cssGrid);
  });
});