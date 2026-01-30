/**
 * Simple test for BrowserCompatibilityInfo component
 */

import { describe, it, expect } from 'vitest';
import { BrowserCompatibilityInfo } from '../components/BrowserCompatibilityInfo';

describe('BrowserCompatibilityInfo Component', () => {
  it('should be defined and exportable', () => {
    expect(BrowserCompatibilityInfo).toBeDefined();
    expect(typeof BrowserCompatibilityInfo).toBe('function');
  });

  // Note: Full rendering tests would require proper DOM setup
  // For now, we just verify the component can be imported
});