import React from 'react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Trash2, User } from 'lucide-react'
import type { CampaignMemberWithProfile } from '@/types'

interface MemberCardProps {
  member: CampaignMemberWithProfile
  currentUserRole: 'dm' | 'player' | 'observer' | null
  onRemove?: (userId: string, role: string) => void
  isRemoving?: boolean
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  currentUserRole,
  onRemove,
  isRemoving = false
}) => {
  const displayName = member.user_profile?.display_name || `User ${member.user_id.slice(0, 8)}...`
  const profilePicture = member.user_profile?.profile_picture_url
  
  const getRoleStatus = (role: string) => {
    switch (role) {
      case 'dm':
        return 'completed' // Purple for DM
      case 'player':
        return 'active' // Green for players
      case 'observer':
        return 'pending' // Yellow for observers
      default:
        return 'inactive'
    }
  }

  const canRemove = currentUserRole === 'dm' && member.role !== 'dm'

  return (
    <div className="flex items-center justify-between p-4 bg-purple-900/20 rounded-lg border border-purple-500/10">
      <div className="flex items-center gap-3">
        {/* Profile Picture */}
        <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center overflow-hidden border border-purple-500/30">
          {profilePicture ? (
            <img 
              src={profilePicture} 
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="h-5 w-5 text-purple-400" />
          )}
        </div>
        
        {/* Member Info */}
        <div>
          <p className="text-white font-medium">{displayName}</p>
          <StatusBadge status={getRoleStatus(member.role)} className="mt-1">
            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
          </StatusBadge>
        </div>
      </div>
      
      {/* Remove Button */}
      {canRemove && onRemove && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onRemove(member.user_id, member.role)}
          disabled={isRemoving}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}