import * as React from "react"
import { cn } from "@/lib/utils"
 
const Button = React.forwardRef(({ className, variant = "default", size = "md", asChild = false, ...props }, ref) => {
  const variants = {
    default: "bg-slate-900 text-white hover:bg-slate-800",
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  }

  const sizes = {
    sm: "h-8 px-3",
    md: "h-10 px-4",
    lg: "h-12 px-5",
    icon: "h-10 w-10 p-0",
  }
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant] || variants.default,
        sizes[size] || sizes.md,
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"
export { Button }
