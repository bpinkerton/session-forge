import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'variant'> {
  status: 'active' | 'inactive' | 'pending' | 'recruiting' | 'hiatus' | 'completed' | 'success' | 'error' | 'warning' | 'info'
  children: React.ReactNode
}

// Unused - keeping for future light theme support
// const statusVariants = {
//   active: 'bg-green-100 text-green-800 border-green-200',
//   inactive: 'bg-gray-100 text-gray-800 border-gray-200',
//   pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
//   recruiting: 'bg-blue-100 text-blue-800 border-blue-200',
//   hiatus: 'bg-orange-100 text-orange-800 border-orange-200',
//   completed: 'bg-purple-100 text-purple-800 border-purple-200',
//   success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
//   error: 'bg-red-100 text-red-800 border-red-200',
//   warning: 'bg-amber-100 text-amber-800 border-amber-200',
//   info: 'bg-cyan-100 text-cyan-800 border-cyan-200'
// }

// Dark theme variants for better contrast on dark backgrounds
const darkStatusVariants = {
  active: 'bg-green-900/20 text-green-300 border-green-500/20',
  inactive: 'bg-gray-900/20 text-gray-300 border-gray-500/20',
  pending: 'bg-yellow-900/20 text-yellow-300 border-yellow-500/20',
  recruiting: 'bg-blue-900/20 text-blue-300 border-blue-500/20',
  hiatus: 'bg-orange-900/20 text-orange-300 border-orange-500/20',
  completed: 'bg-purple-900/20 text-purple-300 border-purple-500/20',
  success: 'bg-emerald-900/20 text-emerald-300 border-emerald-500/20',
  error: 'bg-red-900/20 text-red-300 border-red-500/20',
  warning: 'bg-amber-900/20 text-amber-300 border-amber-500/20',
  info: 'bg-cyan-900/20 text-cyan-300 border-cyan-500/20'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
  className,
  ...props
}) => {
  return (
    <Badge
      className={cn(
        'border font-medium',
        // Use dark variants for our dark theme
        darkStatusVariants[status],
        className
      )}
      {...props}
    >
      {children}
    </Badge>
  )
}