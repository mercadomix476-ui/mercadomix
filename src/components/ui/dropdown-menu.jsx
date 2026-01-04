import * as React from "react"
import { cn } from "@/lib/utils"

export const DropdownMenu = ({ children }) => (
  <div className="relative inline-block">{children}</div>
);

export const DropdownMenuTrigger = React.forwardRef(({ children, asChild, ...props }, ref) => {
  if (asChild) {
    return React.cloneElement(children, { ref, ...props });
  }
  return <div ref={ref} {...props}>{children}</div>;
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

export const DropdownMenuContent = React.forwardRef(({ 
  children, 
  className, 
  align = "center",
  sideOffset = 4,
  ...props 
}, ref) => {
  const alignmentClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0"
  };

  return (
    <div 
      ref={ref}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-slate-950 shadow-md animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        alignmentClasses[align],
        className
      )}
      style={{ top: `calc(100% + ${sideOffset}px)` }}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = React.forwardRef(({ 
  children, 
  onClick, 
  className,
  disabled,
  ...props 
}, ref) => (
  <div 
    ref={ref}
    onClick={disabled ? undefined : onClick}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      disabled ? "opacity-50 pointer-events-none" : "cursor-pointer hover:bg-slate-100",
      className
    )}
    data-disabled={disabled}
    {...props}
  >
    {children}
  </div>
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuLabel = React.forwardRef(({ 
  children, 
  className,
  ...props 
}, ref) => (
  <div 
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold text-slate-900",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export const DropdownMenuSeparator = React.forwardRef(({ 
  className,
  ...props 
}, ref) => (
  <div 
    ref={ref}
    className={cn(
      "-mx-1 my-1 h-px bg-slate-100",
      className
    )}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";
