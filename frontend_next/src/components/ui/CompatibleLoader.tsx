/**
 * Cross-Browser Compatible Loading Animation Component
 * Provides consistent loading state animations across browsers
 */

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
// import { Loader2 } from "lucide-react"

// Browser detection for animation support
const detectAnimationCapabilities = () => {
  if (typeof window === 'undefined') {
    return {
      supportsCSSAnimations: false,
      supportsTransforms: false,
      supportsKeyframes: false,
      needsFallback: true
    };
  }

  const testElement = document.createElement('div');
  const style = testElement.style;

  return {
    supportsCSSAnimations: 'animation' in style || 'webkitAnimation' in style,
    supportsTransforms: 'transform' in style || 'webkitTransform' in style,
    supportsKeyframes: CSS.supports && CSS.supports('animation', 'spin 1s linear infinite'),
    needsFallback: !('animation' in style) && !('webkitAnimation' in style)
  };
};

// Hook for animation capabilities
const useAnimationCompatibility = () => {
  const [capabilities, setCapabilities] = React.useState({
    supportsCSSAnimations: false,
    supportsTransforms: false,
    supportsKeyframes: false,
    needsFallback: true
  });

  React.useEffect(() => {
    setCapabilities(detectAnimationCapabilities());
  }, []);

  return capabilities;
};

// Fallback animation using JavaScript for older browsers
const useFallbackAnimation = (enabled: boolean) => {
  const [rotation, setRotation] = React.useState(0);
  const animationRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!enabled) return;

    const animate = () => {
      setRotation(prev => (prev + 2) % 360);
      animationRef.current = requestAnimationFrame(animate);
    };

    // Use requestAnimationFrame if available, otherwise setTimeout
    if (typeof requestAnimationFrame !== 'undefined') {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      const interval = setInterval(() => {
        setRotation(prev => (prev + 2) % 360);
      }, 16); // ~60fps

      return () => clearInterval(interval);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enabled]);

  return rotation;
};

// Spinner component with cross-browser support
interface CompatibleSpinnerProps {
  size?: "sm" | "default" | "lg";
  className?: string;
  color?: "default" | "primary" | "white";
}

export const CompatibleSpinner: React.FC<CompatibleSpinnerProps> = ({
  size = "default",
  className,
  color = "default"
}) => {
  const capabilities = useAnimationCompatibility();
  const fallbackRotation = useFallbackAnimation(capabilities.needsFallback);

  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8"
  };

  const colorClasses = {
    default: "text-gray-600",
    primary: "text-primary",
    white: "text-white"
  };

  if (capabilities.needsFallback) {
    // Fallback for browsers without CSS animation support
    return (
      <div
        className={cn(
          "inline-block border-2 border-current border-t-transparent rounded-full",
          sizeClasses[size],
          colorClasses[color],
          className
        )}
        style={{
          transform: `rotate(${fallbackRotation}deg)`,
          // Fallback for browsers without transform support
          ...((!capabilities.supportsTransforms) && {
            // Use filter for very old browsers (IE8-9)
            filter: `progid:DXImageTransform.Microsoft.BasicImage(rotation=${Math.floor(fallbackRotation / 90)})`
          })
        }}
        role="status"
        aria-label="Загрузка"
      />
    );
  }

  // Modern browsers with CSS animation support
  return (
    <div
      className={cn(
        "inline-block border-2 border-current border-t-transparent rounded-full",
        // CSS animations with vendor prefixes
        "animate-spin",
        // Fallback animation for browsers with limited support
        capabilities.supportsCSSAnimations ? [
          "animation-duration: 1s",
          "animation-timing-function: linear",
          "animation-iteration-count: infinite"
        ] : [],
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      style={{
        // Vendor prefixes for older browsers
        WebkitAnimation: capabilities.supportsCSSAnimations ? 'spin 1s linear infinite' : undefined,
        MozAnimation: capabilities.supportsCSSAnimations ? 'spin 1s linear infinite' : undefined,
        animation: capabilities.supportsCSSAnimations ? 'spin 1s linear infinite' : undefined,
      }}
      role="status"
      aria-label="Загрузка"
    />
  );
};

// Loading button component
interface CompatibleLoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  spinnerSize?: "sm" | "default" | "lg";
  variant?: "default" | "primary" | "outline" | "ghost";
}

export const CompatibleLoadingButton: React.FC<CompatibleLoadingButtonProps> = ({
  loading = false,
  loadingText = "Загрузка...",
  spinnerSize = "sm",
  variant = "default",
  children,
  disabled,
  className,
  ...props
}) => {
  const variantClasses = {
    default: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground"
  };

  return (
    <button
      className={cn(
        // Base button styles
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        // Variant styles
        variantClasses[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <CompatibleSpinner 
          size={spinnerSize} 
          color={variant === "primary" ? "white" : "default"}
        />
      )}
      {loading ? loadingText : children}
    </button>
  );
};

// Loading overlay component
interface CompatibleLoadingOverlayProps {
  loading?: boolean;
  text?: string;
  className?: string;
  children?: React.ReactNode;
}

export const CompatibleLoadingOverlay: React.FC<CompatibleLoadingOverlayProps> = ({
  loading = false,
  text = "Загрузка...",
  className,
  children
}) => {
  const capabilities = useAnimationCompatibility();

  if (!loading) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative", className)}>
      {children}
      <div
        className={cn(
          // Base overlay styles
          "absolute inset-0 flex items-center justify-center",
          "bg-white/80 backdrop-blur-sm z-50",
          // Animation styles with fallbacks
          capabilities.supportsCSSAnimations ? [
            "animate-in fade-in-0 duration-200"
          ] : [
            "transition-opacity duration-200 opacity-100"
          ]
        )}
        style={{
          // Fallback background for older browsers
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <CompatibleSpinner size="lg" />
          {text && (
            <p className="text-sm text-gray-600 font-medium">{text}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Progress bar with cross-browser support
interface CompatibleProgressProps {
  value?: number;
  max?: number;
  className?: string;
  showPercentage?: boolean;
  animated?: boolean;
}

export const CompatibleProgress: React.FC<CompatibleProgressProps> = ({
  value = 0,
  max = 100,
  className,
  showPercentage = false,
  animated = true
}) => {
  const capabilities = useAnimationCompatibility();
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            "h-full bg-primary rounded-full",
            // Animation styles with fallbacks
            animated && capabilities.supportsCSSAnimations ? [
              "transition-all duration-300 ease-out"
            ] : [],
            // Fallback for browsers without transition support
            !capabilities.supportsCSSAnimations && animated && [
              "transition: width 0.3s ease-out"
            ]
          )}
          style={{
            width: `${percentage}%`,
            // Fallback styles for older browsers
            backgroundColor: '#000',
            transition: animated ? 'width 0.3s ease-out' : 'none'
          }}
        />
      </div>
      {showPercentage && (
        <div className="text-sm text-gray-600 text-center">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

// Skeleton loader with cross-browser support
interface CompatibleSkeletonProps {
  className?: string;
  animated?: boolean;
}

export const CompatibleSkeleton: React.FC<CompatibleSkeletonProps> = ({
  className,
  animated = true
}) => {
  const capabilities = useAnimationCompatibility();

  return (
    <div
      className={cn(
        "bg-gray-200 rounded",
        // Animation styles with fallbacks
        animated && capabilities.supportsCSSAnimations ? [
          "animate-pulse"
        ] : [],
        // Fallback animation for older browsers
        animated && !capabilities.supportsCSSAnimations ? [
          "opacity-50"
        ] : [],
        className
      )}
      style={{
        // Fallback styles for older browsers
        backgroundColor: '#e5e7eb',
        ...(animated && !capabilities.supportsCSSAnimations && {
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        })
      }}
    />
  );
};

// Export compatibility info for debugging
export const LoadingCompatibilityInfo = () => {
  const capabilities = useAnimationCompatibility();
  return capabilities;
};