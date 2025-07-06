import React from 'react'

interface UseInlineEditProps {
  onSave: (field: string, value: string) => void
}

export const useInlineEdit = ({ onSave }: UseInlineEditProps) => {
  const [editingField, setEditingField] = React.useState<string | null>(null)
  const [tempValue, setTempValue] = React.useState('')

  const startEditing = (field: string, value: string) => {
    setEditingField(field)
    setTempValue(value || '')
  }

  const saveField = (field: string, value: string) => {
    onSave(field, value.trim())
    setEditingField(null)
    setTempValue('')
  }

  const cancelEditing = () => {
    setEditingField(null)
    setTempValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveField(field, tempValue)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEditing()
    }
  }

  const handleBlur = (field: string, e: React.FocusEvent) => {
    // Only save if not clicking on another interactive element
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget && (
      relatedTarget.tagName === 'BUTTON' ||
      relatedTarget.tagName === 'INPUT' ||
      relatedTarget.className.includes('prevent-blur')
    )) {
      return
    }
    saveField(field, tempValue)
  }

  return {
    editingField,
    tempValue,
    startEditing,
    saveField,
    cancelEditing,
    handleKeyDown,
    handleBlur,
    setTempValue
  }
}