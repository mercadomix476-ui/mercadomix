import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ProgressBar({ 
  value = 0, 
  max = 100, 
  className, 
  showLabel = false, 
  label,
  size = "default",
  variant = "default"
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizeClasses = {
    sm: "h-1",
    default: "h-2",
    lg: "h-3"
  };

  const variantClasses = {
    default: "bg-emerald-500",
    success: "bg-green-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
    info: "bg-blue-500"
  };

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">
            {label || "Progresso"}
          </span>
          <span className="text-sm text-slate-500">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div 
        className={cn(
          "w-full bg-slate-200 rounded-full overflow-hidden",
          sizeClasses[size],
          className
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progresso: ${Math.round(percentage)}%`}
      >
        <motion.div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            variantClasses[variant]
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function CircularProgress({ 
  value = 0, 
  max = 100, 
  size = 40, 
  strokeWidth = 4,
  className,
  showLabel = false,
  variant = "default"
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const variantColors = {
    default: "stroke-emerald-500",
    success: "stroke-green-500",
    warning: "stroke-amber-500",
    error: "stroke-red-500",
    info: "stroke-blue-500"
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`Progresso circular: ${Math.round(percentage)}%`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-200"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={variantColors[variant]}
          initial={{ strokeDasharray, strokeDashoffset: circumference }}
          animate={{ strokeDasharray, strokeDashoffset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-slate-700">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}

export function StepProgress({ steps, currentStep, className }) {
  return (
    <div className={cn("flex items-center", className)} role="progressbar" aria-label="Progresso por etapas">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.id || index}>
            <div className="flex items-center">
              <motion.div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300",
                  {
                    "bg-emerald-500 border-emerald-500 text-white": isCompleted,
                    "bg-emerald-100 border-emerald-500 text-emerald-700": isCurrent,
                    "bg-slate-100 border-slate-300 text-slate-500": !isCompleted && !isCurrent
                  }
                )}
                initial={{ scale: 0.8 }}
                animate={{ scale: isCurrent ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
              >
                {isCompleted ? (
                  <motion.svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </motion.svg>
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </motion.div>
              <div className="ml-2 hidden sm:block">
                <p className={cn(
                  "text-sm font-medium",
                  {
                    "text-emerald-600": isCompleted || isCurrent,
                    "text-slate-500": !isCompleted && !isCurrent
                  }
                )}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-slate-500">{step.description}</p>
                )}
              </div>
            </div>
            {!isLast && (
              <div className={cn(
                "flex-1 h-0.5 mx-4 transition-all duration-300",
                isCompleted ? "bg-emerald-500" : "bg-slate-300"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}