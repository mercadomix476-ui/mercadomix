import * as React from "react"
import { cn } from "@/lib/utils"

export const Dialog = ({ children, open, onOpenChange }) => 
  open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange?.(false)}>
      {children}
    </div>
  ) : null;

export const DialogContent = ({ children, className, ...props }) => (
  <div 
    className={cn("bg-white p-6 rounded-lg max-w-lg w-full mx-4", className)} 
    onClick={(e) => e.stopPropagation()}
    {...props}
  >
    {children}
  </div>
);

export const DialogHeader = ({ children, className, ...props }) => (
  <div className={cn("mb-4", className)} {...props}>
    {children}
  </div>
);

export const DialogTitle = ({ children, className, ...props }) => (
  <h2 className={cn("text-lg font-bold text-slate-900", className)} {...props}>
    {children}
  </h2>
);

export const DialogDescription = ({ children, className, ...props }) => (
  <p className={cn("text-sm text-slate-500 mt-2", className)} {...props}>
    {children}
  </p>
);

export const DialogFooter = ({ children, className, ...props }) => (
  <div className={cn("flex justify-end gap-2 mt-6", className)} {...props}>
    {children}
  </div>
);
