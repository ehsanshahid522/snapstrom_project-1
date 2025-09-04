import React from 'react'

// Import logo files (you'll need to add these files)
// import logo from '../assets/images/logo/snapstrom-logo.svg'
// import logoWhite from '../assets/images/logo/snapstrom-logo-white.png'

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

  // For now, we'll use the inline SVG from your current implementation
  // Once you add the actual logo files, uncomment the imports above
  const renderLogo = () => {
    return (
      <div className={`${sizeClasses[size]} relative logo-icon logo-glow`}>
        {/* Camera Body */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-500 to-yellow-400 rounded-lg shadow-2xl">
          {/* Camera Top */}
          <div className="absolute -top-2 -left-2 w-6 h-4 bg-gradient-to-r from-orange-400 to-pink-500 rounded-md"></div>
          {/* Flash/Lens */}
          <div className="absolute left-2 top-3 w-3 h-3 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full"></div>
          {/* Main Lens */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 relative">
              {/* Outer Ring */}
              <div className="absolute inset-0 bg-purple-400 rounded-full animate-pulse"></div>
              {/* Middle Ring */}
              <div className="absolute inset-1 bg-purple-600 rounded-full"></div>
              {/* Inner Ring */}
              <div className="absolute inset-2 bg-magenta-400 rounded-full"></div>
            </div>
          </div>
          {/* Speech Bubble Tail */}
          <div className="absolute -bottom-1 -right-1 w-0 h-0 border-l-[12px] border-l-yellow-400 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent"></div>
        </div>
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-500 to-yellow-400 rounded-lg blur-sm opacity-50"></div>
      </div>
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
