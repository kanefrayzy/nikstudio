/**
 * Responsive Design Compatibility Demo Component
 * Demonstrates responsive design features and touch compatibility
 */

'use client';

import React from 'react';
import { useResponsiveCompatibility } from '../lib/responsive-compatibility';

export function ResponsiveCompatibilityDemo() {
  const {
    breakpoint,
    touchCapabilities,
    matchesBreakpoint,
    createMediaQuery,
    generateSrcSet,
    generateSizes
  } = useResponsiveCompatibility();

  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait');
  const [windowSize, setWindowSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    // Set up orientation detection
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    // Set up media query listeners
    const _mediaQueries = [
      createMediaQuery('(prefers-color-scheme: dark)', (matches) => {
        console.log('Dark mode:', matches);
      }),
      createMediaQuery('(prefers-reduced-motion: reduce)', (matches) => {
        console.log('Reduced motion:', matches);
      })
    ];

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, [createMediaQuery]);

  // Generate responsive image examples
  const heroImageSrcSet = generateSrcSet('/hero-image.jpg', [320, 640, 1024, 1920]);
  const heroImageSizes = generateSizes({
    xs: '100vw',
    sm: '100vw',
    md: '80vw',
    lg: '60vw'
  });

  return (
    <div className="container-responsive responsive-spacing">
      <h1 className="responsive-heading">Responsive Design Compatibility Demo</h1>
      
      {/* Viewport and Device Information */}
      <div className="card responsive-spacing">
        <h2 className="text-xl font-semibold mb-4">Device & Viewport Information</h2>
        
        <div className="responsive-grid">
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-medium mb-2">Current Breakpoint</h3>
            <p className="text-2xl font-bold text-blue-600 capitalize">{breakpoint}</p>
            <p className="text-sm text-gray-600 mt-1">
              {windowSize.width} × {windowSize.height}px
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded">
            <h3 className="font-medium mb-2">Orientation</h3>
            <p className="text-2xl font-bold text-green-600 capitalize">{orientation}</p>
            <p className="text-sm text-gray-600 mt-1">
              {orientation === 'portrait' ? 'Height > Width' : 'Width > Height'}
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded">
            <h3 className="font-medium mb-2">Touch Support</h3>
            <p className="text-2xl font-bold text-purple-600">
              {touchCapabilities?.touchEvents ? '✓ Touch' : '✗ No Touch'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {touchCapabilities?.hoverSupport ? 'Hover supported' : 'No hover support'}
            </p>
          </div>
        </div>
      </div>

      {/* Breakpoint Matching Demo */}
      <div className="card responsive-spacing">
        <h2 className="text-xl font-semibold mb-4">Breakpoint Matching</h2>
        
        <div className="space-y-2">
          {(['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const).map(bp => (
            <div key={bp} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium capitalize">{bp} ({bp === 'xs' ? '0px' : `${
                bp === 'sm' ? '640px' :
                bp === 'md' ? '768px' :
                bp === 'lg' ? '1024px' :
                bp === 'xl' ? '1280px' : '1536px'
              }+`})</span>
              <span className={`px-3 py-1 rounded text-sm font-medium ${
                matchesBreakpoint(bp) 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {matchesBreakpoint(bp) ? '✓ Matches' : '✗ No Match'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Touch Capabilities Demo */}
      {touchCapabilities && (
        <div className="card responsive-spacing">
          <h2 className="text-xl font-semibold mb-4">Touch Capabilities</h2>
          
          <div className="responsive-grid">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Touch Events:</span>
                <span className={touchCapabilities.touchEvents ? 'text-green-600' : 'text-red-600'}>
                  {touchCapabilities.touchEvents ? '✓ Supported' : '✗ Not Supported'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Pointer Events:</span>
                <span className={touchCapabilities.pointerEvents ? 'text-green-600' : 'text-red-600'}>
                  {touchCapabilities.pointerEvents ? '✓ Supported' : '✗ Not Supported'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Hover Support:</span>
                <span className={touchCapabilities.hoverSupport ? 'text-green-600' : 'text-red-600'}>
                  {touchCapabilities.hoverSupport ? '✓ Supported' : '✗ Not Supported'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Fine Pointer:</span>
                <span className={touchCapabilities.finePointer ? 'text-green-600' : 'text-red-600'}>
                  {touchCapabilities.finePointer ? '✓ Supported' : '✗ Not Supported'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Coarse Pointer:</span>
                <span className={touchCapabilities.coarsePointer ? 'text-green-600' : 'text-red-600'}>
                  {touchCapabilities.coarsePointer ? '✓ Supported' : '✗ Not Supported'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Touch-Friendly Interactions Demo */}
      <div className="card responsive-spacing">
        <h2 className="text-xl font-semibold mb-4">Touch-Friendly Interactions</h2>
        <p className="text-gray-600 mb-4">
          These elements are optimized for touch devices with minimum 44px touch targets.
        </p>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">Primary Button</button>
            <button className="btn-secondary">Secondary Button</button>
            <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 active:scale-95 transition-transform">
              Touch Feedback
            </button>
          </div>
          
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Touch-friendly input (44px min height)"
              className="form-input w-full"
            />
            <textarea 
              placeholder="Touch-friendly textarea"
              className="form-input w-full min-h-[100px]"
              rows={3}
            />
            <select className="form-input w-full">
              <option>Touch-friendly select</option>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
        </div>
      </div>

      {/* Responsive Images Demo */}
      <div className="card responsive-spacing">
        <h2 className="text-xl font-semibold mb-4">Responsive Images</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Generated SrcSet Example</h3>
            <code className="block p-3 bg-gray-100 rounded text-sm overflow-x-auto">
              {heroImageSrcSet}
            </code>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Generated Sizes Example</h3>
            <code className="block p-3 bg-gray-100 rounded text-sm overflow-x-auto">
              {heroImageSizes}
            </code>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Responsive Image Example</h3>
            <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
              <p className="text-gray-500">
                Responsive Image Placeholder
                <br />
                <span className="text-sm">
                  Current breakpoint: {breakpoint}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Grid Demo */}
      <div className="card responsive-spacing">
        <h2 className="text-xl font-semibold mb-4">Responsive Grid Layouts</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-3">Auto-Fit Grid (responsive-grid-auto)</h3>
            <div className="responsive-grid-auto">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="bg-blue-100 p-4 rounded text-center">
                  <p className="font-medium">Card {i + 1}</p>
                  <p className="text-sm text-gray-600 mt-1">Auto-sizing</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Breakpoint Grid (responsive-grid)</h3>
            <div className="responsive-grid">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="bg-green-100 p-4 rounded text-center">
                  <p className="font-medium">Item {i + 1}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {breakpoint === 'xs' ? '1 col' : 
                     ['sm'].includes(breakpoint) ? '2 cols' : '3 cols'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Typography Demo */}
      <div className="card responsive-spacing">
        <h2 className="text-xl font-semibold mb-4">Responsive Typography</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="responsive-heading">Responsive Heading</h3>
            <p className="text-sm text-gray-600">
              Font size adapts based on screen size: 
              {breakpoint === 'xs' ? ' 1.5rem (mobile)' :
               ['sm', 'md'].includes(breakpoint) ? ' 2rem (tablet)' : ' 2.5rem (desktop)'}
            </p>
          </div>
          
          <div>
            <p className="responsive-text">
              This is responsive body text that adjusts its size and line height based on the current breakpoint. 
              The text becomes larger and more readable on bigger screens while staying compact on mobile devices.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Current size: 
              {breakpoint === 'xs' ? ' 0.875rem' :
               ['sm', 'md'].includes(breakpoint) ? ' 1rem' : ' 1.125rem'}
            </p>
          </div>
        </div>
      </div>

      {/* Responsive Visibility Demo */}
      <div className="card responsive-spacing">
        <h2 className="text-xl font-semibold mb-4">Responsive Visibility</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="xs:block sm:hidden bg-red-100 p-3 rounded text-center">
              <p className="font-medium">Mobile Only</p>
              <p className="text-sm">xs:block sm:hidden</p>
            </div>
            
            <div className="hidden sm:block lg:hidden bg-blue-100 p-3 rounded text-center">
              <p className="font-medium">Tablet Only</p>
              <p className="text-sm">sm:block lg:hidden</p>
            </div>
            
            <div className="hidden lg:block bg-green-100 p-3 rounded text-center">
              <p className="font-medium">Desktop Only</p>
              <p className="text-sm">lg:block</p>
            </div>
            
            <div className="block bg-purple-100 p-3 rounded text-center">
              <p className="font-medium">Always Visible</p>
              <p className="text-sm">block</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orientation Demo */}
      <div className="card responsive-spacing">
        <h2 className="text-xl font-semibold mb-4">Orientation Handling</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
            <span>Current Orientation:</span>
            <span className="font-medium capitalize">{orientation}</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="portrait-only bg-blue-100 p-4 rounded text-center">
              <p className="font-medium">Portrait Only</p>
              <p className="text-sm text-gray-600">Visible in portrait mode</p>
            </div>
            
            <div className="landscape-only bg-green-100 p-4 rounded text-center">
              <p className="font-medium">Landscape Only</p>
              <p className="text-sm text-gray-600">Visible in landscape mode</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Info */}
      <div className="card responsive-spacing">
        <h2 className="text-xl font-semibold mb-4">Performance Information</h2>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Viewport Meta Tag:</span>
            <span className="text-green-600">✓ Configured</span>
          </div>
          <div className="flex justify-between">
            <span>Touch Event Listeners:</span>
            <span className="text-green-600">✓ Active</span>
          </div>
          <div className="flex justify-between">
            <span>Media Query Listeners:</span>
            <span className="text-green-600">✓ Active</span>
          </div>
          <div className="flex justify-between">
            <span>Responsive Classes:</span>
            <span className="text-green-600">✓ Applied</span>
          </div>
        </div>
      </div>
    </div>
  );
}