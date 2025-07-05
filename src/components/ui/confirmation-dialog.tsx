import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, X } from 'lucide-react'

interface ConfirmationDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
  children?: React.ReactNode
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
  children
}) => {
  if (!open) return null

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <Trash2 className="h-5 w-5 mr-2" />
      default:
        return <AlertTriangle className="h-5 w-5 mr-2" />
    }
  }

  const getTitleColor = () => {
    switch (variant) {
      case 'destructive':
        return 'text-red-600'
      default:
        return 'text-white'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-black/20 backdrop-blur-sm border-purple-500/20">
        <CardHeader>
          <CardTitle className={`${getTitleColor()} flex items-center`}>
            {getIcon()}
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-purple-300">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              variant={variant === 'destructive' ? 'destructive' : 'default'}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Processing...' : confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}