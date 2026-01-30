/**
 * Compatibility Error Notification Component
 * Displays user-friendly notifications for browser compatibility issues
 */

'use client';

import React from 'react';
import { CompatibilityError } from '../lib/compatibility-error-handler';

interface CompatibilityErrorNotificationProps {
  onDismiss?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  autoHide?: boolean;
  autoHideDelay?: number;
  maxNotifications?: number;
}

interface NotificationData {
  id: string;
  errors: CompatibilityError[];
  message: string;
  severity: CompatibilityError['severity'];
  timestamp: number;
  dismissed: boolean;
}

/**
 * Compatibility Error Notification Component
 */
export function CompatibilityErrorNotification({
  onDismiss,
  position = 'top-right',
  autoHide = true,
  autoHideDelay = 5000,
  maxNotifications = 3
}: CompatibilityErrorNotificationProps) {
  const [notifications, setNotifications] = React.useState<NotificationData[]>([]);

  React.useEffect(() => {
    const handleCompatibilityError = (event: CustomEvent) => {
      const { errors, message, severity } = event.detail;
      
      const notification: NotificationData = {
        id: `compat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        errors,
        message,
        severity,
        timestamp: Date.now(),
        dismissed: false
      };

      setNotifications(prev => {
        const updated = [...prev, notification];
        // Keep only the most recent notifications
        return updated.slice(-maxNotifications);
      });
    };

    window.addEventListener('compatibility-error', handleCompatibilityError as EventListener);

    return () => {
      window.removeEventListener('compatibility-error', handleCompatibilityError as EventListener);
    };
  }, [maxNotifications]);

  React.useEffect(() => {
    if (!autoHide) return;

    const timer = setInterval(() => {
      setNotifications(prev => 
        prev.filter(notification => 
          Date.now() - notification.timestamp < autoHideDelay
        )
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [autoHide, autoHideDelay]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, dismissed: true }
          : notification
      )
    );

    // Remove after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      onDismiss?.();
    }, 300);
  };

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50 flex flex-col gap-2';
    
    switch (position) {
      case 'top-right':
        return `${baseClasses} top-4 right-4`;
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      case 'top-center':
        return `${baseClasses} top-4 left-1/2 transform -translate-x-1/2`;
      case 'bottom-center':
        return `${baseClasses} bottom-4 left-1/2 transform -translate-x-1/2`;
      default:
        return `${baseClasses} top-4 right-4`;
    }
  };

  const getSeverityStyles = (severity: CompatibilityError['severity']) => {
    switch (severity) {
      case 'low':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-400',
          button: 'text-blue-600 hover:text-blue-800'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-400',
          button: 'text-yellow-600 hover:text-yellow-800'
        };
      case 'high':
        return {
          bg: 'bg-orange-50 border-orange-200',
          text: 'text-orange-800',
          icon: 'text-orange-400',
          button: 'text-orange-600 hover:text-orange-800'
        };
      case 'critical':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: 'text-red-400',
          button: 'text-red-600 hover:text-red-800'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          text: 'text-gray-800',
          icon: 'text-gray-400',
          button: 'text-gray-600 hover:text-gray-800'
        };
    }
  };

  const getSeverityIcon = (severity: CompatibilityError['severity']) => {
    switch (severity) {
      case 'low':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'high':
      case 'critical':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={getPositionClasses()}>
      {notifications.map(notification => {
        const styles = getSeverityStyles(notification.severity);
        const icon = getSeverityIcon(notification.severity);
        
        return (
          <div
            key={notification.id}
            className={`
              ${styles.bg} ${styles.text} border rounded-lg shadow-lg p-4 max-w-sm w-full
              transform transition-all duration-300 ease-in-out
              ${notification.dismissed ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
            `}
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start">
              <div className={`flex-shrink-0 ${styles.icon}`}>
                {icon}
              </div>
              
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">
                  {notification.message}
                </p>
                
                {notification.errors.length > 1 && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer hover:underline">
                      Подробности ({notification.errors.length} проблем)
                    </summary>
                    <ul className="mt-1 text-xs space-y-1">
                      {notification.errors.map((error, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1 h-1 bg-current rounded-full mr-2"></span>
                          {error.feature}: {error.type}
                          {error.fallbackApplied && (
                            <span className="ml-1 text-green-600">(исправлено)</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                
                {notification.severity === 'critical' && (
                  <div className="mt-2">
                    <button
                      onClick={() => window.location.reload()}
                      className="text-xs underline hover:no-underline"
                    >
                      Перезагрузить страницу
                    </button>
                  </div>
                )}
              </div>
              
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className={`
                    ${styles.button} hover:bg-white hover:bg-opacity-20 
                    rounded-md p-1.5 inline-flex items-center justify-center 
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
                  `}
                  aria-label="Закрыть уведомление"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Hook to manually trigger compatibility error notifications
 */
export function useCompatibilityNotifications() {
  const showNotification = React.useCallback((
    errors: CompatibilityError[],
    message?: string,
    severity?: CompatibilityError['severity']
  ) => {
    const event = new CustomEvent('compatibility-error', {
      detail: {
        errors,
        message: message || errors[0]?.userMessage || 'Обнаружена проблема совместимости',
        severity: severity || errors[0]?.severity || 'medium'
      }
    });
    
    window.dispatchEvent(event);
  }, []);

  const showSimpleNotification = React.useCallback((
    message: string,
    severity: CompatibilityError['severity'] = 'medium'
  ) => {
    const mockError: CompatibilityError = {
      type: 'feature',
      feature: 'unknown',
      browser: { name: 'unknown', version: 0, isSupported: false, features: {} as any },
      fallbackApplied: false,
      message,
      timestamp: Date.now(),
      severity,
      userMessage: message
    };
    
    showNotification([mockError], message, severity);
  }, [showNotification]);

  return {
    showNotification,
    showSimpleNotification
  };
}

/**
 * Provider component that automatically shows compatibility error notifications
 */
export function CompatibilityErrorProvider({ 
  children,
  ...notificationProps 
}: { 
  children: React.ReactNode 
} & CompatibilityErrorNotificationProps) {
  return (
    <>
      {children}
      <CompatibilityErrorNotification {...notificationProps} />
    </>
  );
}