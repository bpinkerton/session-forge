import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Loader2: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div data-testid="loading-spinner" className={className} {...props} />
  )
}))

describe('LoadingSpinner', () => {
  it('should render spinner with default size', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('h-6', 'w-6')
  })

  it('should render spinner with custom size', () => {
    render(<LoadingSpinner size="lg" />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveClass('h-8', 'w-8')
  })

  it('should render spinner with small size', () => {
    render(<LoadingSpinner size="sm" />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveClass('h-4', 'w-4')
  })

  it('should have spinning animation', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveClass('animate-spin')
  })

  it('should have correct styling classes', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveClass('text-purple-400')
  })

  it('should render with text when provided', () => {
    render(<LoadingSpinner text="Loading..." />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should render page variant correctly', () => {
    render(<LoadingSpinner variant="page" text="Loading page..." />)
    
    // For page variant, the min-h-screen class is on the outer wrapper
    const pageContainer = document.querySelector('.min-h-screen')
    expect(pageContainer).toBeInTheDocument()
    expect(screen.getByText('Loading page...')).toBeInTheDocument()
  })
})