import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ThemedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive'
  size?: 'sm' | 'lg'
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  variant = 'default',
  size = 'sm',
  children,
  disabled = false,
  className,
  ...props
}) => {
  const baseClasses = "font-medium transition-colors bg-black/20 border"
  
  const variantClasses = {
    default: "text-purple-400 hover:text-purple-100 hover:bg-purple-500/20 border-purple-500/30",
    destructive: "text-red-400 hover:text-red-100 hover:bg-red-500/20 border-red-500/30"
  }

  return (
    <Button
      variant="ghost"
      size={size}
      disabled={disabled}
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}