/**
 * CSS Compatibility Demo Component
 * Demonstrates CSS compatibility layers and feature detection
 */

'use client';

import React from 'react';
import { useCSSFeatureDetection } from '../lib/css-feature-detection';

export function CSSCompatibilityDemo() {
  const {
    features,
    strategy,
    supportsModernLayout,
    supportsAdvancedEffects,
    // getFallbackClass
  } = useCSSFeatureDetection();

  if (!features) {
    return <div>Detecting CSS features...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">CSS Compatibility Demo</h2>
      
      {/* Feature Detection Results */}
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">Feature Detection Results</h3>
        </div>
        
        <div className="grid-2-cols gap-4">
          <div>
            <h4 className="font-semibold mb-3">Layout Features</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span>CSS Grid:</span>
                <span className={features.grid ? 'text-green-600' : 'text-red-600'}>
                  {features.grid ? '✓ Supported' : '✗ Not Supported'}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Flexbox:</span>
                <span className={features.flexbox ? 'text-green-600' : 'text-red-600'}>
                  {features.flexbox ? '✓ Supported' : '✗ Not Supported'}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Custom Properties:</span>
                <span className={features.customProperties ? 'text-green-600' : 'text-red-600'}>
                  {features.customProperties ? '✓ Supported' : '✗ Not Supported'}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Sticky Position:</span>
                <span className={features.stickyPosition ? 'text-green-600' : 'text-red-600'}>
                  {features.stickyPosition ? '✓ Supported' : '✗ Not Supported'}
                </span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Visual Effects</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span>Backdrop Filter:</span>
                <span className={features.backdropFilter ? 'text-green-600' : 'text-red-600'}>
                  {features.backdropFilter ? '✓ Supported' : '✗ Not Supported'}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Clip Path:</span>
                <span className={features.clipPath ? 'text-green-600' : 'text-red-600'}>
                  {features.clipPath ? '✓ Supported' : '✗ Not Supported'}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Aspect Ratio:</span>
                <span className={features.aspectRatio ? 'text-green-600' : 'text-red-600'}>
                  {features.aspectRatio ? '✓ Supported' : '✗ Not Supported'}
                </span>
              </li>
              <li className="flex justify-between">
                <span>CSS Masks:</span>
                <span className={features.masks ? 'text-green-600' : 'text-red-600'}>
                  {features.masks ? '✓ Supported' : '✗ Not Supported'}
                </span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <p><strong>Recommended Strategy:</strong> <span className="capitalize font-medium">{strategy}</span></p>
          <p><strong>Modern Layout Support:</strong> {supportsModernLayout ? '✓ Yes' : '✗ No'}</p>
          <p><strong>Advanced Effects Support:</strong> {supportsAdvancedEffects ? '✓ Yes' : '✗ No'}</p>
        </div>
      </div>

      {/* Grid Layout Demo */}
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">CSS Grid with Flexbox Fallback</h3>
          <p className="text-sm text-gray-600 mt-1">
            This layout uses CSS Grid when supported, falls back to Flexbox
          </p>
        </div>
        
        <div className="grid-3-cols">
          <div className="card">
            <h4 className="font-semibold mb-2">Card 1</h4>
            <p className="text-sm text-gray-600">
              This card is part of a responsive grid layout that adapts based on browser support.
            </p>
          </div>
          <div className="card">
            <h4 className="font-semibold mb-2">Card 2</h4>
            <p className="text-sm text-gray-600">
              Modern browsers see CSS Grid, older browsers see Flexbox layout.
            </p>
          </div>
          <div className="card">
            <h4 className="font-semibold mb-2">Card 3</h4>
            <p className="text-sm text-gray-600">
              The layout automatically adjusts to provide the best experience.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Effects Demo */}
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">Visual Effects with Fallbacks</h3>
        </div>
        
        <div className="grid-2-cols gap-6">
          {/* Backdrop Filter Demo */}
          <div className="relative">
            <div className="aspect-video bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg"></div>
            <div className="absolute inset-4 backdrop-blur bg-white/30 rounded-lg flex items-center justify-center">
              <p className="text-center font-medium">
                Backdrop Blur Effect
                <br />
                <span className="text-sm opacity-75">
                  {features.backdropFilter ? 'Using backdrop-filter' : 'Using fallback background'}
                </span>
              </p>
            </div>
          </div>
          
          {/* Clip Path Demo */}
          <div className="flex items-center justify-center">
            <div className="clip-path-circle w-32 h-32 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
              <p className="text-white text-center text-sm font-medium">
                Clip Path
                <br />
                {features.clipPath ? 'CSS' : 'Border Radius'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Aspect Ratio Demo */}
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">Aspect Ratio with Fallback</h3>
          <p className="text-sm text-gray-600 mt-1">
            {features.aspectRatio ? 'Using native aspect-ratio property' : 'Using padding-bottom fallback'}
          </p>
        </div>
        
        <div className="grid-2-cols gap-4">
          <div className="aspect-square bg-gradient-to-br from-pink-400 to-red-500 rounded-lg flex items-center justify-center">
            <p className="text-white font-medium">Square Aspect</p>
          </div>
          <div className="aspect-video bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
            <p className="text-white font-medium">Video Aspect (16:9)</p>
          </div>
        </div>
      </div>

      {/* Animation Demo */}
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">CSS Animations with Vendor Prefixes</h3>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="mixin-fade-in p-4 bg-blue-100 rounded-lg">
            <p className="font-medium">Fade In Animation</p>
          </div>
          <div className="mixin-slide-up p-4 bg-green-100 rounded-lg">
            <p className="font-medium">Slide Up Animation</p>
          </div>
          <div className="mixin-pulse p-4 bg-purple-100 rounded-lg">
            <p className="font-medium">Pulse Animation</p>
          </div>
        </div>
      </div>

      {/* Form Elements Demo */}
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">Form Elements with Compatibility</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Compatible Input</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="This input has cross-browser focus styles"
            />
          </div>
          
          <div className="flex gap-4">
            <button className="btn-primary">Primary Button</button>
            <button className="btn-secondary">Secondary Button</button>
          </div>
        </div>
      </div>

      {/* Responsive Demo */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Responsive Design</h3>
          <p className="text-sm text-gray-600 mt-1">
            Resize your browser to see responsive behavior
          </p>
        </div>
        
        <div className="mixin-responsive-spacing mixin-responsive-text bg-gray-50 rounded-lg">
          <p>
            This content uses responsive spacing and typography that adapts to different screen sizes.
            The padding and font size change based on viewport width using mobile-first responsive design.
          </p>
        </div>
      </div>
    </div>
  );
}

// Utility component to show feature support status
function _FeatureStatus({ supported, label }: { supported: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}:</span>
      <span className={`text-sm font-medium ${supported ? 'text-green-600' : 'text-red-600'}`}>
        {supported ? '✓ Supported' : '✗ Not Supported'}
      </span>
    </div>
  );
}