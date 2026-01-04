import React, { useState } from 'react';
import { cn } from '@/lib/utils';

const TooltipProvider = ({ children }) => {
  return <div>{children}</div>;
};

const Tooltip = ({ children }) => {
  return <div className="relative inline-block">{children}</div>;
};

const TooltipTrigger = React.forwardRef(({ children, asChild, ...props }, ref) => {
  if (asChild) {
    return React.cloneElement(children, { ref, ...props });
  }
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
});

const TooltipContent = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        "absolute z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
        "bg-gray-900 text-white border-gray-700",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Enhanced version with hover functionality
const TooltipWithHover = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {React.Children.map(children, (child) => {
        if (child.type === TooltipTrigger) {
          return child;
        }
        if (child.type === TooltipContent && isVisible) {
          return child;
        }
        return null;
      })}
    </div>
  );
};

// Simple implementation that works with your existing code
const SimpleTooltip = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  let trigger = null;
  let content = null;

  React.Children.forEach(children, (child) => {
    if (child.type === TooltipTrigger) {
      trigger = child;
    } else if (child.type === TooltipContent) {
      content = child;
    }
  });

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {trigger}
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md shadow-lg whitespace-nowrap">
          {content.props.children}
        </div>
      )}
    </div>
  );
};

// Export the simple version as default to work with your existing code
export { TooltipProvider, SimpleTooltip as Tooltip, TooltipTrigger, TooltipContent };