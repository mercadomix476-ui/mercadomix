import * as React from "react"
export const Label = ({ children, className, ...props }) => <label className={`text-sm font-medium ${className}`} {...props}>{children}</label>;
