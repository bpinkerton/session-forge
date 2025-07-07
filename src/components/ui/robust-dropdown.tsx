import React from 'react'
import { cn } from '@/lib/utils'

interface RobustDropdownProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right'
  dataAttribute?: string
}

export const RobustDropdown: React.FC<RobustDropdownProps> = ({
  isOpen,
  onOpenChange,
  trigger,
  children,
  className,
  align = 'right',
  dataAttribute = 'robust-dropdown'
}) => {
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  
  // Handle click outside and escape key
  React.useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (isOpen) {
        const target = event.target as HTMLElement
        // Check if click is outside the dropdown area (both button and content)
        const dropdownButton = target.closest(`[data-${dataAttribute}]`)
        const dropdownContent = target.closest('.robust-dropdown-content')
        if (!dropdownButton && !dropdownContent) {
          onOpenChange(false)
        }
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onOpenChange(false)
      }
    }

    document.addEventListener('click', handleClickOutside, true)
    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.removeEventListener('click', handleClickOutside, true)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onOpenChange, dataAttribute])
  
  // Ensure dropdown doesn't overflow viewport
  React.useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect()
      
      // Check if dropdown overflows viewport
      if (rect.right > window.innerWidth) {
        dropdownRef.current.style.right = '0px'
        dropdownRef.current.style.left = 'auto'
      }
      
      if (rect.bottom > window.innerHeight) {
        dropdownRef.current.style.bottom = '100%'
        dropdownRef.current.style.top = 'auto'
        dropdownRef.current.style.marginBottom = '8px'
        dropdownRef.current.style.marginTop = '0'
      }
    }
  }, [isOpen])
  
  return (
    <div className="relative">
      {trigger}
      
      {isOpen && (
        <div 
          ref={dropdownRef}
          className={cn(
            "robust-dropdown-content absolute mt-2 min-w-40 sm:min-w-48 bg-black/40 backdrop-blur-md border border-purple-500/30 rounded-lg shadow-2xl z-50",
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          <div className="py-1">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

interface RobustDropdownItemProps {
  onClick?: () => void
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'danger'
  disabled?: boolean
}

export const RobustDropdownItem: React.FC<RobustDropdownItemProps> = ({
  onClick,
  children,
  className,
  variant = 'default',
  disabled = false
}) => {
  const baseClasses = "flex items-center w-full px-4 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  
  const variantClasses = {
    default: "text-purple-200 hover:bg-purple-500/20 hover:text-white",
    danger: "text-purple-200 hover:bg-red-500/20 hover:text-red-300"
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(baseClasses, variantClasses[variant], className)}
    >
      {children}
    </button>
  )
}

export const RobustDropdownSeparator: React.FC = () => {
  return <div className="border-t border-purple-500/20 my-1" />
}