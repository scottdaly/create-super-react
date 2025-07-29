import { forwardRef, ReactNode } from 'react'
import { Link } from 'react-router-dom'

export interface MenuItem {
  type: 'link' | 'button' | 'divider' | 'header'
  label?: string
  href?: string
  onClick?: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
  icon?: ReactNode
  description?: string
}

export interface MenuSection {
  items: MenuItem[]
  header?: {
    title: string
    subtitle?: string
  }
}

interface MenuProps {
  sections: MenuSection[]
  onClose: () => void
  className?: string
  width?: 'sm' | 'md' | 'lg' | 'xl'
  position?: 'left' | 'right'
}

const widthClasses = {
  sm: 'w-48',
  md: 'w-64', 
  lg: 'w-80',
  xl: 'w-96'
}

const positionClasses = {
  left: 'left-0',
  right: 'right-0'
}

const Menu = forwardRef<HTMLDivElement, MenuProps>(
  ({ sections, onClose, className = '', width = 'md', position = 'right' }, ref) => {
    const handleItemClick = (item: MenuItem) => {
      if (item.onClick) {
        item.onClick()
      }
      onClose()
    }

    const renderItem = (item: MenuItem, index: number) => {
      if (item.type === 'divider') {
        return <div key={index} className="border-t border-gray-100 my-1" />
      }

      if (item.type === 'header') {
        return (
          <div key={index} className="px-4 py-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {item.label}
            </div>
          </div>
        )
      }

      const baseClasses = "flex items-center px-4 py-2 text-sm transition-colors"
      const variantClasses = {
        default: "text-gray-700 hover:bg-gray-100",
        danger: "text-red-600 hover:bg-red-50"
      }
      const disabledClasses = item.disabled ? "opacity-50 cursor-not-allowed" : ""
      
      const itemClasses = `${baseClasses} ${variantClasses[item.variant || 'default']} ${disabledClasses}`

      if (item.type === 'link' && item.href) {
        return (
          <Link
            key={index}
            to={item.href}
            onClick={() => handleItemClick(item)}
            className={itemClasses}
          >
            {item.icon && <span className="mr-3 flex-shrink-0">{item.icon}</span>}
            <div className="flex-1">
              <div>{item.label}</div>
              {item.description && (
                <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
              )}
            </div>
          </Link>
        )
      }

      return (
        <button
          key={index}
          onClick={() => !item.disabled && handleItemClick(item)}
          className={`${itemClasses} w-full text-left`}
          disabled={item.disabled}
        >
          {item.icon && <span className="mr-3 flex-shrink-0">{item.icon}</span>}
          <div className="flex-1">
            <div>{item.label}</div>
            {item.description && (
              <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
            )}
          </div>
        </button>
      )
    }

    return (
      <div
        ref={ref}
        className={`absolute ${positionClasses[position]} top-full mt-2 ${widthClasses[width]} bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 ${className}`}
      >
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.header && (
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {section.header.title}
                </div>
                {section.header.subtitle && (
                  <div className="text-xs text-gray-500 mt-1">
                    {section.header.subtitle}
                  </div>
                )}
              </div>
            )}
            <div className={section.header ? "" : "py-1"}>
              {section.items.map((item, itemIndex) => renderItem(item, itemIndex))}
            </div>
            {/* Extra divider between sections (skip if section already has header with its own border) */}
            {sectionIndex < sections.length - 1 && !section.header && (
              <div className="border-t border-gray-100 my-1" />
            )}
          </div>
        ))}
      </div>
    )
  }
)

Menu.displayName = 'Menu'

export default Menu