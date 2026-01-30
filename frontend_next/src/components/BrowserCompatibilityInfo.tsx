/**
 * Example component demonstrating browser detection usage
 */

'use client';

import React from 'react';
import { useBrowserDetection } from '../lib/browser-detection';

export function BrowserCompatibilityInfo() {
  const {
    browserInfo,
    supportsModernJS,
    supportsModernCSS,
    supportsFileUpload,
    supportsModernMedia,
    getRequiredPolyfills
  } = useBrowserDetection();

  if (!browserInfo) {
    return <div>Detecting browser...</div>;
  }

  const requiredPolyfills = getRequiredPolyfills();

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-3">Browser Compatibility Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Browser Details</h4>
          <ul className="space-y-1 text-sm">
            <li><strong>Browser:</strong> {browserInfo.name}</li>
            <li><strong>Version:</strong> {browserInfo.version}</li>
            <li>
              <strong>Supported:</strong> 
              <span className={browserInfo.isSupported ? 'text-green-600' : 'text-red-600'}>
                {browserInfo.isSupported ? ' ✓ Yes' : ' ✗ No'}
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium mb-2">Feature Support</h4>
          <ul className="space-y-1 text-sm">
            <li>
              <strong>Modern JavaScript:</strong>
              <span className={supportsModernJS() ? 'text-green-600' : 'text-red-600'}>
                {supportsModernJS() ? ' ✓' : ' ✗'}
              </span>
            </li>
            <li>
              <strong>Modern CSS:</strong>
              <span className={supportsModernCSS() ? 'text-green-600' : 'text-red-600'}>
                {supportsModernCSS() ? ' ✓' : ' ✗'}
              </span>
            </li>
            <li>
              <strong>File Upload:</strong>
              <span className={supportsFileUpload() ? 'text-green-600' : 'text-red-600'}>
                {supportsFileUpload() ? ' ✓' : ' ✗'}
              </span>
            </li>
            <li>
              <strong>Modern Media:</strong>
              <span className={supportsModernMedia() ? 'text-green-600' : 'text-red-600'}>
                {supportsModernMedia() ? ' ✓' : ' ✗'}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {requiredPolyfills.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Required Polyfills</h4>
          <div className="flex flex-wrap gap-2">
            {requiredPolyfills.map(polyfill => (
              <span 
                key={polyfill}
                className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs"
              >
                {polyfill}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <h4 className="font-medium mb-2">Detailed Feature Support</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {Object.entries(browserInfo.features).map(([feature, supported]) => (
            <div key={feature} className="flex justify-between">
              <span>{feature}:</span>
              <span className={supported ? 'text-green-600' : 'text-red-600'}>
                {supported ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}