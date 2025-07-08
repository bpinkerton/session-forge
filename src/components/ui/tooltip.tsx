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
  const [adjustedSide, setAdjustedSide] = React.useState(side)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const tooltipRef = React.useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }

  // Adjust tooltip position to stay within viewport
  React.useEffect(() => {
    if (isVisible && containerRef.current && tooltipRef.current) {
      const container = containerRef.current
      const tooltip = tooltipRef.current
      const containerRect = container.getBoundingClientRect()
      const tooltipRect = tooltip.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const margin = 8

      let newSide = side

      // Check if tooltip goes off screen and adjust
      switch (side) {
        case 'top':
          if (tooltipRect.top < margin) {
            newSide = 'bottom'
          }
          break
        case 'bottom':
          if (tooltipRect.bottom > viewportHeight - margin) {
            newSide = 'top'
          }
          break
        case 'left':
          if (tooltipRect.left < margin) {
            newSide = 'right'
          }
          break
        case 'right':
          if (tooltipRect.right > viewportWidth - margin) {
            newSide = 'left'
          }
          break
      }

      // For horizontal tooltips, also check if they fit vertically
      if ((newSide === 'left' || newSide === 'right') && 
          (tooltipRect.top < margin || tooltipRect.bottom > viewportHeight - margin)) {
        newSide = containerRect.top > viewportHeight / 2 ? 'top' : 'bottom'
      }

      setAdjustedSide(newSide)
    }
  }, [isVisible, side])

  const getTooltipClasses = () => {
    const baseClasses = 'absolute z-50 px-3 py-2 text-sm text-purple-100 bg-purple-900/95 rounded-lg shadow-xl border border-purple-500/30 backdrop-blur-md pointer-events-none whitespace-nowrap transition-all duration-200 ease-out max-w-xs'
    
    switch (adjustedSide) {
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
        <div ref={tooltipRef} className={getTooltipClasses()}>
          {content}
          {/* Subtle arrow pointing to the trigger */}
          <div className={cn(
            'absolute w-2 h-2 bg-purple-900/95 border-l border-t border-purple-500/30 transform rotate-45',
            adjustedSide === 'top' && 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2',
            adjustedSide === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2',
            adjustedSide === 'left' && 'left-full top-1/2 -translate-y-1/2 translate-x-1/2',
            adjustedSide === 'right' && 'right-full top-1/2 -translate-y-1/2 -translate-x-1/2'
          )} />
        </div>
      )}
    </div>
  )
}