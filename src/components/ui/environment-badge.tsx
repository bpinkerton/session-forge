import React from 'react'
import { Badge } from '@/components/ui/badge'

export const EnvironmentBadge: React.FC = () => {
  const [environment, setEnvironment] = React.useState<{
    type: 'production' | 'staging' | 'preview' | 'local'
    branch?: string
  }>({ type: 'local' })

  React.useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL
    
    if (!url) {
      setEnvironment({ type: 'local' })
      return
    }

    // Check if URL contains branch indicator
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      setEnvironment({ type: 'local' })
    } else if (url.includes('-branch-')) {
      // Branch URLs contain '-branch-' in the subdomain
      if (url.includes('staging-branch-')) {
        setEnvironment({ type: 'staging', branch: 'staging' })
      } else if (url.includes('pr-')) {
        // Extract PR number from URL
        const prMatch = url.match(/pr-(\d+)-branch-/)
        const prNumber = prMatch ? prMatch[1] : 'unknown'
        setEnvironment({ type: 'preview', branch: `PR #${prNumber}` })
      } else {
        setEnvironment({ type: 'preview', branch: 'preview' })
      }
    } else {
      // Main project URL without branch = production
      setEnvironment({ type: 'production' })
    }
  }, [])

  const getConfig = () => {
    switch (environment.type) {
      case 'production':
        return {
          label: 'PRODUCTION',
          color: 'bg-green-500',
          textColor: 'text-white',
          icon: '🟢'
        }
      case 'staging':
        return {
          label: 'STAGING',
          color: 'bg-yellow-500',
          textColor: 'text-black',
          icon: '🟡'
        }
      case 'preview':
        return {
          label: environment.branch || 'PREVIEW',
          color: 'bg-blue-500',
          textColor: 'text-white',
          icon: '🔵'
        }
      case 'local':
        return {
          label: 'LOCAL',
          color: 'bg-gray-500',
          textColor: 'text-white',
          icon: '⚫'
        }
    }
  }

  const config = getConfig()
  
  // Only show in development or if explicitly enabled
  if (import.meta.env.PROD && !import.meta.env.VITE_SHOW_ENV_BADGE) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge 
        className={`${config.color} ${config.textColor} px-3 py-1 text-xs font-bold`}
        variant="default"
      >
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    </div>
  )
}

// Hook to get current environment
export const useEnvironment = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || ''
  
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return 'local'
  } else if (url.includes('staging-branch-')) {
    return 'staging'
  } else if (url.includes('-branch-')) {
    return 'preview'
  } else {
    return 'production'
  }
}