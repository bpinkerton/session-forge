import React from 'react'
import { Input } from '@/components/ui/input'
import { Edit } from 'lucide-react'

interface InlineEditFieldProps {
  field: string
  label: string
  value: string
  placeholder: string
  isTextarea?: boolean
  textareaRows?: number
  canEdit?: boolean
  editingField: string | null
  tempValue: string
  onStartEditing: (field: string, value: string) => void
  onTempValueChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent, field: string) => void
  onBlur: (field: string, e: React.FocusEvent) => void
}

export const InlineEditField: React.FC<InlineEditFieldProps> = ({
  field,
  label,
  value,
  placeholder,
  isTextarea = false,
  textareaRows = 4,
  canEdit = true,
  editingField,
  tempValue,
  onStartEditing,
  onTempValueChange,
  onKeyDown,
  onBlur
}) => {
  const isEditing = editingField === field

  if (isEditing) {
    return (
      <div>
        <label className="text-sm font-medium text-purple-300 block mb-1">{label}</label>
        <div>
          {isTextarea ? (
            <textarea
              value={tempValue}
              onChange={(e) => onTempValueChange(e.target.value)}
              onKeyDown={(e) => onKeyDown(e, field)}
              onBlur={(e) => onBlur(field, e)}
              placeholder={placeholder}
              rows={textareaRows}
              className="w-full px-3 py-2 bg-transparent border border-purple-500/30 rounded-md text-white placeholder:text-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 resize-none"
              autoFocus
            />
          ) : (
            <Input
              value={tempValue}
              onChange={(e) => onTempValueChange(e.target.value)}
              onKeyDown={(e) => onKeyDown(e, field)}
              onBlur={(e) => onBlur(field, e)}
              placeholder={placeholder}
              className="bg-transparent border-purple-500/30 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-white placeholder:text-purple-400"
              autoFocus
            />
          )}
        </div>
        
        {/* Keyboard hints */}
        <p className="text-xs text-purple-400 mt-1">
          Press <kbd className="px-1 bg-purple-900/50 rounded">Enter</kbd> to save, <kbd className="px-1 bg-purple-900/50 rounded">Esc</kbd> to cancel
        </p>
      </div>
    )
  }

  return (
    <div>
      <label className="text-sm font-medium text-purple-300 block mb-1">{label}</label>
      <div
        className={`group ${canEdit ? 'cursor-pointer' : 'cursor-default'} ${
          canEdit ? 'hover:bg-purple-900/20 hover:border-purple-400/30' : ''
        } p-2 rounded border border-transparent transition-colors`}
        onClick={() => {
          if (canEdit) onStartEditing(field, value)
        }}
      >
        <div className="flex items-center justify-between">
          <p className={`${value ? 'text-white' : 'text-purple-400 italic'}`}>
            {value || placeholder || `No ${label.toLowerCase()} specified`}
          </p>
          {canEdit && (
            <Edit className="h-4 w-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
    </div>
  )
}