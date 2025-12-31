import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

const feedbackVariants = {
  success: {
    icon: CheckCircle,
    className: "bg-emerald-50 border-emerald-200 text-emerald-800",
    iconClassName: "text-emerald-600"
  },
  error: {
    icon: XCircle,
    className: "bg-red-50 border-red-200 text-red-800",
    iconClassName: "text-red-600"
  },
  warning: {
    icon: AlertCircle,
    className: "bg-amber-50 border-amber-200 text-amber-800",
    iconClassName: "text-amber-600"
  },
  info: {
    icon: Info,
    className: "bg-blue-50 border-blue-200 text-blue-800",
    iconClassName: "text-blue-600"
  }
};

export function FeedbackMessage({ 
  type = "info", 
  title, 
  message, 
  onClose, 
  autoClose = true, 
  duration = 5000,
  className 
}) {
  const [isVisible, setIsVisible] = useState(true);
  const variant = feedbackVariants[type];
  const Icon = variant.icon;

  useEffect(() => {
    if (autoClose && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={cn(
        "flex items-start gap-3 p-4 border rounded-lg shadow-sm",
        variant.className,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", variant.iconClassName)} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold text-sm mb-1">{title}</h4>
        )}
        <p className="text-sm">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose(), 300);
          }}
          className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
          aria-label="Fechar mensagem"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}

export function SuccessAnimation({ children, show, onComplete }) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.2, 1], 
            opacity: 1,
            rotate: [0, 10, -10, 0]
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            duration: 0.6,
            ease: "easeOut"
          }}
          className="flex items-center justify-center"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PulseEffect({ children, pulse = false, className }) {
  return (
    <motion.div
      animate={pulse ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideInNotification({ children, show, direction = "right" }) {
  const variants = {
    right: {
      initial: { x: 300, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 300, opacity: 0 }
    },
    left: {
      initial: { x: -300, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -300, opacity: 0 }
    },
    top: {
      initial: { y: -100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -100, opacity: 0 }
    },
    bottom: {
      initial: { y: 100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: 100, opacity: 0 }
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={variants[direction].initial}
          animate={variants[direction].animate}
          exit={variants[direction].exit}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}