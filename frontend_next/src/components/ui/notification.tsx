import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
  type: NotificationType;
  message: string;
  duration?: number; // в миллисекундах, по умолчанию 3000
  onClose?: () => void;
  closable?: boolean;
  className?: string;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-4 w-4" />;
    case 'error':
      return <AlertCircle className="h-4 w-4" />;
    case 'info':
      return <Info className="h-4 w-4" />;
    case 'warning':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const getNotificationVariant = (type: NotificationType): "default" | "destructive" => {
  return type === 'error' ? 'destructive' : 'default';
};

const getNotificationStyles = (type: NotificationType): string => {
  switch (type) {
    case 'success':
      return 'border-green-200 bg-green-50 text-green-800';
    case 'error':
      return 'border-red-200 bg-red-50 text-red-800';
    case 'info':
      return 'border-blue-200 bg-blue-50 text-blue-800';
    case 'warning':
      return 'border-yellow-200 bg-yellow-50 text-yellow-800';
    default:
      return '';
  }
};

export const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  duration = 3000,
  onClose,
  closable = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) {
          setTimeout(onClose, 300); // Даем время для анимации
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(onClose, 300); // Даем время для анимации
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Alert 
      variant={getNotificationVariant(type)}
      className={`
        ${getNotificationStyles(type)}
        ${className}
        transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
    >
      {getNotificationIcon(type)}
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {closable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-auto p-1 ml-2 hover:bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

// Хук для управления уведомлениями
interface NotificationState {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  const addNotification = (
    type: NotificationType,
    message: string,
    duration: number = 3000
  ) => {
    const id = Date.now().toString();
    const notification: NotificationState = { id, type, message, duration };
    
    setNotifications(prev => [...prev, notification]);

    // Автоматически удаляем уведомление через указанное время
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Удобные методы для разных типов уведомлений
  const showSuccess = (message: string, duration?: number) => 
    addNotification('success', message, duration);
  
  const showError = (message: string, duration?: number) => 
    addNotification('error', message, duration);
  
  const showInfo = (message: string, duration?: number) => 
    addNotification('info', message, duration);
  
  const showWarning = (message: string, duration?: number) => 
    addNotification('warning', message, duration);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };
};

// Компонент контейнера для уведомлений
interface NotificationContainerProps {
  notifications: NotificationState[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove,
  position = 'top-right'
}) => {
  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed ${getPositionStyles()} z-50 space-y-2 max-w-sm w-full`}>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          duration={0} // Отключаем автоскрытие, так как оно управляется хуком
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
};