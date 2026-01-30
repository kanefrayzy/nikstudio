/**
 * Cross-Browser Compatible Dialog Component
 * Provides dialog/modal compatibility for browsers without native dialog support
 */

"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Browser detection for dialog support
const supportsNativeDialog = () => {
  if (typeof window === 'undefined') return false;
  return typeof HTMLDialogElement !== 'undefined';
};

// Polyfill for browsers without dialog support
const useDialogPolyfill = () => {
  const [isPolyfillNeeded, setIsPolyfillNeeded] = React.useState(false);

  React.useEffect(() => {
    setIsPolyfillNeeded(!supportsNativeDialog());
  }, []);

  return isPolyfillNeeded;
};

// Enhanced overlay with better cross-browser support
function CompatibleDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  const isPolyfillNeeded = useDialogPolyfill();

  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        // Base styles
        "fixed inset-0 z-50 bg-black/50",
        // Animation styles with fallbacks
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        // Cross-browser animation fallbacks
        isPolyfillNeeded && [
          "transition-opacity duration-200",
          "data-[state=open]:opacity-100 data-[state=closed]:opacity-0"
        ],
        // IE11 fallbacks
        "filter: alpha(opacity=50)", // IE8-9 fallback
        className
      )}
      style={{
        // Fallback for older browsers
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        // Ensure proper stacking
        zIndex: 50,
        ...props.style
      }}
      {...props}
    />
  )
}

// Enhanced content with cross-browser positioning
function CompatibleDialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  const isPolyfillNeeded = useDialogPolyfill();
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Handle ESC key for older browsers
  React.useEffect(() => {
    if (!isPolyfillNeeded) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.keyCode === 27) {
        // Find the close button and click it
        const closeButton = contentRef.current?.querySelector('[data-slot="dialog-close"]') as HTMLButtonElement;
        if (closeButton) {
          closeButton.click();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isPolyfillNeeded]);

  // Focus management for accessibility
  React.useEffect(() => {
    if (!contentRef.current) return;

    const focusableElements = contentRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
  }, []);

  return (
    <DialogPrimitive.Portal data-slot="dialog-portal">
      <CompatibleDialogOverlay />
      <DialogPrimitive.Content
        ref={contentRef}
        data-slot="dialog-content"
        className={cn(
          // Base positioning and styling
          "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)]",
          "translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg",
          "bg-background",
          // Animation styles with fallbacks
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "duration-200",
          // Cross-browser animation fallbacks
          isPolyfillNeeded && [
            "transition-all duration-200",
            "data-[state=open]:opacity-100 data-[state=open]:scale-100",
            "data-[state=closed]:opacity-0 data-[state=closed]:scale-95"
          ],
          // Responsive sizing
          "sm:max-w-lg",
          // IE11 specific fixes
          "max-height: 90vh", // Fallback for older browsers
          "overflow-y: auto", // Ensure scrolling works
          className
        )}
        style={{
          // Fallback positioning for older browsers
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 51,
          maxHeight: '90vh',
          ...props.style
        }}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              "absolute top-4 right-4 rounded-xs opacity-70 transition-opacity",
              "hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden",
              "disabled:pointer-events-none hover:cursor-pointer",
              "ring-offset-background focus:ring-ring",
              "data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
              "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            )}
            aria-label="Закрыть диалог"
          >
            <XIcon />
            <span className="sr-only">Закрыть</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

// Enhanced dialog root with better event handling
function CompatibleDialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const isPolyfillNeeded = useDialogPolyfill();

  // Add body scroll lock for older browsers
  React.useEffect(() => {
    if (!isPolyfillNeeded || !props.open) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isPolyfillNeeded, props.open]);

  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

// Re-export other components with compatibility enhancements
function CompatibleDialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return (
    <DialogPrimitive.Trigger 
      data-slot="dialog-trigger" 
      className={cn("hover:cursor-pointer", props.className)}
      {...props} 
    />
  )
}

function CompatibleDialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close 
      data-slot="dialog-close" 
      className={cn("hover:cursor-pointer", props.className)}
      {...props} 
    />
  )
}

function CompatibleDialogHeader({ 
  className, 
  ...props 
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function CompatibleDialogFooter({ 
  className, 
  ...props 
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function CompatibleDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CompatibleDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  CompatibleDialog as Dialog,
  CompatibleDialogClose as DialogClose,
  CompatibleDialogContent as DialogContent,
  CompatibleDialogDescription as DialogDescription,
  CompatibleDialogFooter as DialogFooter,
  CompatibleDialogHeader as DialogHeader,
  CompatibleDialogOverlay as DialogOverlay,
  CompatibleDialogTitle as DialogTitle,
  CompatibleDialogTrigger as DialogTrigger,
}

// Export compatibility info for debugging
export const DialogCompatibilityInfo = {
  supportsNativeDialog: supportsNativeDialog(),
  needsPolyfill: !supportsNativeDialog()
};