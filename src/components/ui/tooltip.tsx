import React from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: string
  children: React.ReactNode
  className?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  className,
  side = 'top'
}) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }

  const getTooltipClasses = () => {
    const baseClasses = 'absolute z-50 px-3 py-2 text-sm text-purple-100 bg-purple-900/95 rounded-lg shadow-xl border border-purple-500/30 backdrop-blur-md pointer-events-none whitespace-nowrap transition-all duration-200 ease-out'
    
    switch (side) {
      case 'top':
        return cn(baseClasses, 'bottom-full left-1/2 transform -translate-x-1/2 mb-2', className)
      case 'bottom':
        return cn(baseClasses, 'top-full left-1/2 transform -translate-x-1/2 mt-2', className)
      case 'left':
        return cn(baseClasses, 'right-full top-1/2 transform -translate-y-1/2 mr-2', className)
      case 'right':
        return cn(baseClasses, 'left-full top-1/2 transform -translate-y-1/2 ml-2', className)
      default:
        return cn(baseClasses, 'bottom-full left-1/2 transform -translate-x-1/2 mb-2', className)
    }
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-block"
    >
      {children}
      {isVisible && (
        <div className={getTooltipClasses()}>
          {content}
          {/* Subtle arrow pointing to the trigger */}
          <div className={cn(
            'absolute w-2 h-2 bg-purple-900/95 border-l border-t border-purple-500/30 transform rotate-45',
            side === 'top' && 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2',
            side === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2',
            side === 'left' && 'left-full top-1/2 -translate-y-1/2 translate-x-1/2',
            side === 'right' && 'right-full top-1/2 -translate-y-1/2 -translate-x-1/2'
          )} />
        </div>
      )}
    </div>
  )
}