import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  variant?: 'inline' | 'page' | 'button'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
}

const variantClasses = {
  inline: 'text-purple-400',
  page: 'text-purple-400',
  button: 'text-current'
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  variant = 'inline',
  className
}) => {
  const content = (
    <div className={cn(
      'flex items-center gap-2',
      variant === 'page' && 'flex-col',
      className
    )}>
      <Loader2 
        className={cn(
          'animate-spin',
          sizeClasses[size],
          variantClasses[variant]
        )} 
      />
      {text && (
        <span className={cn(
          'text-sm',
          variant === 'page' ? 'text-purple-300 mt-2' : 'text-purple-400'
        )}>
          {text}
        </span>
      )}
    </div>
  )

  if (variant === 'page') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          {content}
        </div>
      </div>
    )
  }

  return content
}