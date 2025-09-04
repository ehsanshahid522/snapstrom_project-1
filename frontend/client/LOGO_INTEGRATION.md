# SNAPSTROM Logo Integration Guide

## 📁 Logo File Locations

### Primary Storage (Recommended)
```
frontend/client/src/assets/images/logo/
├── snapstrom-logo.svg          # Vector version (best quality)
├── snapstrom-logo.png          # High-res PNG (256x256px+)
├── snapstrom-logo-white.png    # White version for dark backgrounds
├── snapstrom-icon.svg          # Icon-only version
└── snapstrom-favicon.ico       # Favicon (32x32px)
```

### Alternative Storage (Static Assets)
```
frontend/client/public/images/logo/
├── snapstrom-logo.svg
├── snapstrom-logo.png
└── favicon.ico
```

## 🎯 Logo Specifications

### Recommended Formats:
- **SVG** (Vector) - Best for scaling, smallest file size
- **PNG** (Raster) - Good for complex designs, transparent backgrounds
- **ICO** (Favicon) - For browser tabs

### Size Guidelines:
- **Main Logo**: 256x256px minimum (SVG preferred)
- **Icon Version**: 64x64px
- **Favicon**: 32x32px
- **High-res**: 512x512px for retina displays

## 🔧 Integration Methods

### Method 1: Using Logo Component (Recommended)
```jsx
import Logo from '../components/Logo'

// Usage examples
<Logo size="lg" showText={true} />
<Logo size="md" showText={false} variant="icon" />
<Logo size="xl" onClick={() => navigate('/')} />
```

### Method 2: Direct Import
```jsx
import logo from '../assets/images/logo/snapstrom-logo.svg'
import logoWhite from '../assets/images/logo/snapstrom-logo-white.png'

<img src={logo} alt="SNAPSTROM" className="w-16 h-16" />
```

### Method 3: Public Directory
```jsx
<img src="/images/logo/snapstrom-logo.svg" alt="SNAPSTROM" />
```

## 🎨 Current Implementation

The current logo is implemented as an inline SVG with:
- Camera body with gradient colors (orange → pink → yellow)
- Animated lens with concentric circles
- Speech bubble tail
- Glow effects and hover animations
- Responsive sizing

## 📋 To-Do Checklist

- [ ] Add your actual logo files to `frontend/client/src/assets/images/logo/`
- [ ] Update the Logo component to use your files instead of inline SVG
- [ ] Test logo display across different screen sizes
- [ ] Verify logo looks good on both light and dark backgrounds
- [ ] Update favicon in `frontend/client/public/favicon.ico`
- [ ] Test logo in navigation bar and other components

## 🚀 Quick Start

1. **Save your logo files** in the recommended locations above
2. **Update the Logo component** by uncommenting the import statements
3. **Replace the inline SVG** with your actual logo files
4. **Test the integration** across different components

## 💡 Tips

- Use SVG format for best quality and smallest file size
- Ensure your logo works well on both light and dark backgrounds
- Test at different sizes (mobile, tablet, desktop)
- Keep file sizes under 100KB for optimal loading
- Use descriptive alt text for accessibility
