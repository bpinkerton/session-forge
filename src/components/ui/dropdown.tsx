import React from 'react'
import { cn } from '@/lib/utils'

interface DropdownProps {
  isOpen: boolean
  onClose: () => void
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right'
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  trigger,
  children,
  className,
  align = 'right'
}) => {
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  
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
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={onClose}
          />
          
          {/* Dropdown Content */}
          <div 
            ref={dropdownRef}
            className={cn(
              "absolute mt-2 min-w-48 bg-black/40 backdrop-blur-md border border-purple-500/30 rounded-lg shadow-2xl z-50",
              align === 'right' ? 'right-0' : 'left-0',
              className
            )}
          >
            <div className="py-1">
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

interface DropdownItemProps {
  onClick?: () => void
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'danger'
  disabled?: boolean
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
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

export const DropdownSeparator: React.FC = () => {
  return <div className="border-t border-purple-500/20 my-1" />
}