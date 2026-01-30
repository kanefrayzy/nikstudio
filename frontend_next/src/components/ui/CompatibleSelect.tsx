/**
 * Cross-Browser Compatible Select Component
 * Provides consistent dropdown and select behavior across browsers
 */

"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Browser detection for select support
const detectSelectCapabilities = () => {
  if (typeof window === 'undefined') {
    return {
      supportsCustomSelect: false,
      supportsMultiple: false,
      needsPolyfill: true
    };
  }

  const testSelect = document.createElement('select');
  
  return {
    supportsCustomSelect: 'appearance' in testSelect.style || 'webkitAppearance' in testSelect.style,
    supportsMultiple: 'multiple' in testSelect,
    needsPolyfill: !('appearance' in testSelect.style) && !('webkitAppearance' in testSelect.style)
  };
};

// Hook for select capabilities
const useSelectCompatibility = () => {
  const [capabilities, setCapabilities] = React.useState({
    supportsCustomSelect: false,
    supportsMultiple: false,
    needsPolyfill: true
  });

  React.useEffect(() => {
    setCapabilities(detectSelectCapabilities());
  }, []);

  return capabilities;
};

// Enhanced select trigger with cross-browser styling
function CompatibleSelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  const capabilities = useSelectCompatibility();

  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        // Base styles
        "flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none",
        // Border and focus styles
        "border-input focus-visible:border-ring focus-visible:ring-ring/50",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // Background styles with dark mode support
        "dark:bg-input/30 dark:hover:bg-input/50",
        // Placeholder and text color
        "data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground",
        // Focus ring
        "focus-visible:ring-[3px]",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Size variants
        "data-[size=default]:h-9 data-[size=sm]:h-8",
        // Value styling
        "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2",
        // Icon styling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Cross-browser appearance reset
        capabilities.needsPolyfill && [
          "appearance-none",
          "-webkit-appearance: none",
          "-moz-appearance: none"
        ],
        // IE11 specific fixes
        "select::-ms-expand { display: none; }", // Hide IE dropdown arrow
        className
      )}
      style={{
        // Fallback styles for older browsers
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        appearance: 'none',
        ...props.style
      }}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

// Enhanced select content with better positioning
function CompatibleSelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  const capabilities = useSelectCompatibility();
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Handle keyboard navigation for older browsers
  React.useEffect(() => {
    if (!capabilities.needsPolyfill || !contentRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, keyCode } = event;
      
      // Handle arrow keys
      if (key === 'ArrowDown' || keyCode === 40) {
        event.preventDefault();
        const items = contentRef.current?.querySelectorAll('[data-slot="select-item"]');
        const focused = document.activeElement;
        const currentIndex = Array.from(items || []).indexOf(focused as Element);
        const nextIndex = Math.min(currentIndex + 1, (items?.length || 1) - 1);
        (items?.[nextIndex] as HTMLElement)?.focus();
      } else if (key === 'ArrowUp' || keyCode === 38) {
        event.preventDefault();
        const items = contentRef.current?.querySelectorAll('[data-slot="select-item"]');
        const focused = document.activeElement;
        const currentIndex = Array.from(items || []).indexOf(focused as Element);
        const prevIndex = Math.max(currentIndex - 1, 0);
        (items?.[prevIndex] as HTMLElement)?.focus();
      }
    };

    contentRef.current.addEventListener('keydown', handleKeyDown);
    return () => {
      contentRef.current?.removeEventListener('keydown', handleKeyDown);
    };
  }, [capabilities.needsPolyfill]);

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={contentRef}
        data-slot="select-content"
        className={cn(
          // Base styles
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem]",
          "origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto",
          "rounded-md border shadow-md",
          // Background and text
          "bg-popover text-popover-foreground",
          // Animation styles with fallbacks
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          // Slide animations
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          // Popper positioning
          position === "popper" && [
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1",
            "data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"
          ],
          // Cross-browser animation fallbacks
          capabilities.needsPolyfill && [
            "transition-all duration-200",
            "data-[state=open]:opacity-100 data-[state=open]:scale-100",
            "data-[state=closed]:opacity-0 data-[state=closed]:scale-95"
          ],
          className
        )}
        position={position}
        style={{
          // Fallback z-index for older browsers
          zIndex: 50,
          // Ensure proper max-height
          maxHeight: 'var(--radix-select-content-available-height, 300px)',
          ...props.style
        }}
        {...props}
      >
        <CompatibleSelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" && [
              "h-[var(--radix-select-trigger-height)] w-full",
              "min-w-[var(--radix-select-trigger-width)] scroll-my-1"
            ]
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <CompatibleSelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

// Enhanced select item with better interaction
function CompatibleSelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  const capabilities = useSelectCompatibility();

  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        // Base styles
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm",
        "outline-hidden select-none",
        // Focus and hover states
        "focus:bg-accent focus:text-accent-foreground",
        capabilities.needsPolyfill && [
          "hover:bg-accent hover:text-accent-foreground"
        ],
        // Disabled state
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // Icon styling
        "[&_svg:not([class*='text-'])]:text-muted-foreground",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Text styling
        "*:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

// Enhanced scroll buttons with better browser support
function CompatibleSelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        "hover:bg-accent hover:text-accent-foreground transition-colors",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function CompatibleSelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        "hover:bg-accent hover:text-accent-foreground transition-colors",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

// Native HTML select fallback for maximum compatibility
interface NativeSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  size?: "sm" | "default";
  onValueChange?: (value: string) => void;
}

function NativeSelect({
  className,
  options,
  placeholder,
  size = "default",
  onValueChange,
  ...props
}: NativeSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onValueChange) {
      onValueChange(e.target.value);
    }
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <select
      className={cn(
        // Base styles
        "flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm",
        "shadow-xs transition-[color,box-shadow] outline-none",
        // Border and focus styles
        "border-input focus-visible:border-ring focus-visible:ring-ring/50",
        "focus-visible:ring-[3px]",
        // Background styles
        "dark:bg-input/30 dark:hover:bg-input/50",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Size variants
        size === "default" ? "h-9" : "h-8",
        // Cross-browser appearance
        "appearance-none -webkit-appearance-none -moz-appearance-none",
        // Background image for dropdown arrow (cross-browser)
        "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzY2NjY2NiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')]",
        "bg-no-repeat bg-right-3 bg-center pr-10",
        className
      )}
      style={{
        // Fallback styles for older browsers
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        appearance: 'none',
        ...props.style
      }}
      {...props}
      onChange={handleChange}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}

// Main select component with automatic fallback
function CompatibleSelect({
  children,
  fallbackOptions,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root> & {
  fallbackOptions?: Array<{ value: string; label: string; disabled?: boolean }>;
}) {
  const capabilities = useSelectCompatibility();

  // Use native select as fallback for very old browsers
  if (capabilities.needsPolyfill && fallbackOptions) {
    return (
      <NativeSelect
        options={fallbackOptions}
        value={props.value}
        onValueChange={props.onValueChange}
        disabled={props.disabled}
      />
    );
  }

  return <SelectPrimitive.Root data-slot="select" {...props}>{children}</SelectPrimitive.Root>;
}

// Re-export other components
function CompatibleSelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function CompatibleSelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function CompatibleSelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  )
}

function CompatibleSelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

export {
  CompatibleSelect as Select,
  CompatibleSelectContent as SelectContent,
  CompatibleSelectGroup as SelectGroup,
  CompatibleSelectItem as SelectItem,
  CompatibleSelectLabel as SelectLabel,
  CompatibleSelectScrollDownButton as SelectScrollDownButton,
  CompatibleSelectScrollUpButton as SelectScrollUpButton,
  CompatibleSelectSeparator as SelectSeparator,
  CompatibleSelectTrigger as SelectTrigger,
  CompatibleSelectValue as SelectValue,
  NativeSelect,
}

// Export compatibility info for debugging
export const SelectCompatibilityInfo = () => {
  const capabilities = useSelectCompatibility();
  return capabilities;
};