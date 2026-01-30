/**
 * Demo component showcasing cross-browser event handling compatibility
 */

'use client';

import { useEffect, useState } from 'react';
import { useEventCompatibility } from '@/hooks/useEventCompatibility';

export function EventCompatibilityDemo() {
  const [events, setEvents] = useState<string[]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const eventHandler = useEventCompatibility<HTMLDivElement>();

  const addEvent = (eventType: string, details?: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const eventMessage = `${timestamp}: ${eventType}${details ? ` - ${details}` : ''}`;
    setEvents(prev => [eventMessage, ...prev.slice(0, 9)]); // Keep last 10 events
  };

  useEffect(() => {
    // Basic event listeners using the simplified API
    eventHandler.addEventListener('touchstart', (event) => {
      addEvent('Touch Start', `${event.touches?.length || 0} touch(es)`);
    });

    eventHandler.addEventListener('touchend', (event) => {
      addEvent('Touch End', `${event.changedTouches?.length || 0} touch(es)`);
    });

    // Keyboard events
    eventHandler.addEventListener('keydown', (event) => {
      addEvent('Key Down', `Key: ${event.which || event.keyCode}`);
    });

    // Mouse events
    eventHandler.addEventListener('click', (event) => {
      addEvent('Mouse Click', `Button: ${event.button}, Position: ${event.clientX},${event.clientY}`);
    });

    eventHandler.addEventListener('dblclick', (event) => {
      addEvent('Double Click', `Position: ${event.clientX},${event.clientY}`);
    });

    eventHandler.addEventListener('contextmenu', (event) => {
      addEvent('Right Click', 'Context menu');
      event.preventDefault();
    });

    eventHandler.addEventListener('wheel', (event) => {
      addEvent('Mouse Wheel', `Delta: ${(event as any).deltaY || 0}`);
    });

    // Basic drag functionality
    eventHandler.addEventListener('mousedown', (event) => {
      setIsDragging(true);
      setPosition({ x: event.clientX || 0, y: event.clientY || 0 });
      addEvent('Drag Start', `Position: ${event.clientX},${event.clientY}`);
    });

    eventHandler.addEventListener('mousemove', (event) => {
      if (isDragging) {
        setPosition({ x: event.clientX || 0, y: event.clientY || 0 });
      }
    });

    eventHandler.addEventListener('mouseup', (event) => {
      if (isDragging) {
        setIsDragging(false);
        addEvent('Drag End', `Position: ${event.clientX},${event.clientY}`);
      }
    });

    // Hover effects
    eventHandler.addEventListener('mouseenter', (_event) => addEvent('Mouse Enter', 'Hover started'));
    eventHandler.addEventListener('mouseleave', (_event) => addEvent('Mouse Leave', 'Hover ended'));

    // Basic accessibility handled by standard events
  }, [eventHandler, isDragging]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Cross-Browser Event Handling Demo</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Interactive Area */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Interactive Area</h3>
          <div
            ref={eventHandler.ref}
            className={`
              w-full h-64 border-2 border-dashed border-gray-300 rounded-lg
              flex items-center justify-center cursor-pointer
              transition-colors duration-200
              hover:border-blue-400 hover:bg-blue-50
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${isDragging ? 'bg-green-100 border-green-400' : ''}
            `}
            tabIndex={0}
          >
            <div className="text-center">
              <p className="text-gray-600 mb-2">
                Try different interactions:
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Click or tap</li>
                <li>• Double-click</li>
                <li>• Right-click</li>
                <li>• Drag (mouse down + move)</li>
                <li>• Swipe (touch)</li>
                <li>• Keyboard focus (Tab)</li>
                <li>• Press keys</li>
                <li>• Try Ctrl+C</li>
                <li>• Mouse wheel</li>
              </ul>
              {isDragging && (
                <p className="mt-2 text-green-600 font-semibold">
                  Dragging at: {position.x}, {position.y}
                </p>
              )}
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Touch Support:</strong> {'ontouchstart' in window ? 'Yes' : 'No'}</p>
            <p><strong>Browser:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').pop() : 'Unknown'}</p>
          </div>
        </div>

        {/* Event Log */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Event Log</h3>
            <button
              onClick={() => setEvents([])}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
            >
              Clear
            </button>
          </div>
          <div className="h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50">
            {events.length === 0 ? (
              <p className="text-gray-500 text-sm">No events yet. Try interacting with the area above.</p>
            ) : (
              <div className="space-y-1">
                {events.map((event, index) => (
                  <div
                    key={index}
                    className={`text-xs p-2 rounded ${
                      index === 0 ? 'bg-blue-100 border border-blue-200' : 'bg-white'
                    }`}
                  >
                    {event}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature Support Info */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Browser Compatibility Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-1">Event Normalization:</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Cross-browser event listener attachment</li>
              <li>• Consistent event object properties</li>
              <li>• Legacy IE support (attachEvent)</li>
              <li>• Automatic cleanup</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">Touch Compatibility:</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Touch event detection</li>
              <li>• Mouse fallbacks for non-touch devices</li>
              <li>• Gesture recognition (tap, swipe)</li>
              <li>• Touch-friendly styling</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">Keyboard Support:</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Key code normalization</li>
              <li>• Key combination detection</li>
              <li>• Accessibility features</li>
              <li>• Focus management</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">Mouse Enhancement:</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Button detection normalization</li>
              <li>• Double-click with fallback</li>
              <li>• Drag and drop support</li>
              <li>• Mouse wheel compatibility</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}