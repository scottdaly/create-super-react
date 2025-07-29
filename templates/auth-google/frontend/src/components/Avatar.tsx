import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/auth'
import Menu, { type MenuSection } from './Menu'

type User = { id: string; email: string }

interface AvatarProps {
  user: User
}

export default function Avatar({ user }: AvatarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { logout } = useAuth()

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  // Get user initials for avatar
  const getInitials = (email: string) => {
    const name = email.split('@')[0]
    return name.slice(0, 2).toUpperCase()
  }

  const handleLogout = async () => {
    await logout()
  }

  const menuSections: MenuSection[] = [
    {
      header: {
        title: user.email,
        subtitle: 'Signed in'
      },
      items: []
    },
    {
      items: [
        {
          type: 'link',
          label: 'Dashboard',
          href: '/dashboard'
        },
        {
          type: 'link',
          label: 'Settings',
          href: '/settings'
        }
      ]
    },
    {
      items: [
        {
          type: 'button',
          label: 'Sign out',
          onClick: handleLogout,
          variant: 'danger'
        }
      ]
    }
  ]

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-medium hover:bg-gray-800 transition-colors"
        aria-label="User menu"
      >
        {getInitials(user.email)}
      </button>

      {isMenuOpen && (
        <Menu 
          sections={menuSections}
          onClose={() => setIsMenuOpen(false)} 
        />
      )}
    </div>
  )
}