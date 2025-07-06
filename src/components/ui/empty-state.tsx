import React from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: {
    container: 'py-4',
    icon: 'h-8 w-8 mb-2',
    title: 'text-sm font-medium',
    description: 'text-xs'
  },
  md: {
    container: 'py-8',
    icon: 'h-12 w-12 mb-3',
    title: 'text-base font-medium',
    description: 'text-sm'
  },
  lg: {
    container: 'py-12',
    icon: 'h-16 w-16 mb-4',
    title: 'text-lg font-medium',
    description: 'text-base'
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  size = 'md',
  className
}) => {
  const classes = sizeClasses[size]

  return (
    <div className={cn(
      'text-center',
      classes.container,
      className
    )}>
      <Icon className={cn(
        'text-purple-400 mx-auto',
        classes.icon
      )} />
      <h3 className={cn(
        'text-purple-200 mb-2',
        classes.title
      )}>
        {title}
      </h3>
      <p className={cn(
        'text-purple-400',
        classes.description
      )}>
        {description}
      </p>
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  )
}