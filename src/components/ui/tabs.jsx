import * as React from "react"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext()

export const Tabs = ({ children, value, onValueChange, defaultValue, className, ...props }) => {
  const [activeTab, setActiveTab] = React.useState(value || defaultValue || "")
  
  const handleValueChange = React.useCallback((newValue) => {
    setActiveTab(newValue)
    onValueChange?.(newValue)
  }, [onValueChange])

  React.useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value)
    }
  }, [value])

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleValueChange }}>
      <div className={cn("", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export const TabsList = ({ children, className, ...props }) => (
  <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)} {...props}>
    {children}
  </div>
)

export const TabsTrigger = ({ children, value, className, ...props }) => {
  const { activeTab, setActiveTab } = React.useContext(TabsContext)
  
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        activeTab === value 
          ? "bg-background text-foreground shadow-sm" 
          : "hover:bg-muted/80",
        className
      )}
      onClick={() => setActiveTab(value)}
      {...props}
    >
      {children}
    </button>
  )
}

export const TabsContent = ({ children, value, className, ...props }) => {
  const { activeTab } = React.useContext(TabsContext)
  
  if (activeTab !== value) {
    return null
  }
  
  return (
    <div 
      className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)} 
      {...props}
    >
      {children}
    </div>
  )
}
