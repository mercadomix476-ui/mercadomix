import React from "react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ size = "default", className, ...props }) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        {
          "h-4 w-4": size === "sm",
          "h-6 w-6": size === "default",
          "h-8 w-8": size === "lg",
          "h-12 w-12": size === "xl",
        },
        className
      )}
      role="status"
      aria-label="Carregando"
      {...props}
    >
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

export function LoadingDots({ className, ...props }) {
  return (
    <div className={cn("flex space-x-1", className)} role="status" aria-label="Carregando" {...props}>
      <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 bg-current rounded-full animate-bounce"></div>
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

export function LoadingOverlay({ children, isLoading, className }) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <LoadingSpinner size="lg" className="text-emerald-600" />
            <p className="text-sm text-slate-600 font-medium">Carregando...</p>
          </div>
        </div>
      )}
    </div>
  );
}