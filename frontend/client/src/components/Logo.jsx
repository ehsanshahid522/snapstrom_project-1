import React from 'react'

const Logo = ({ 
  variant = 'default', // 'default', 'white', 'icon'
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  className = '',
  onClick = null,
  showText = true
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }

  // Use your actual logo file
  const renderLogo = () => {
    return (
      <img 
        src="/images/logo/snapstrom_logo.png"
        alt="SNAPSTROM Logo"
        className={`${sizeClasses[size]} logo-icon logo-glow object-contain`}
      />
    )
  }

  return (
    <div 
      className={`flex items-center ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {renderLogo()}
      
      {showText && (
        <div className="ml-3 sm:ml-4">
          <h1 className={`${textSizes[size]} font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent drop-shadow-lg logo-text`}>
            SNAPSTROM
          </h1>
        </div>
      )}
    </div>
  )
}

export default Logo
