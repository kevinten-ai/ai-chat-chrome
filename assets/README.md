# Extension Icons

This directory contains the extension icon. The project now uses SVG format for better compatibility and scalability.

## Icon File

- `icon.svg` - Vector icon (recommended for Chrome extensions)
  - 128x128 viewBox
  - Contains AI chat theme with gradient background and chat bubble
  - Automatically scales to all required sizes

## Chrome Extension Icon Support

Chrome Manifest V3 supports SVG icons directly. The extension manifest references the SVG file for all icon sizes, which provides:

- Crisp rendering at all sizes
- Smaller file size
- Better compatibility across devices
- Automatic scaling without quality loss

## Legacy PNG Support

If you need PNG icons for older Chrome versions or other purposes, you can generate them from the SVG using:

### Online Converters
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon.svg`
3. Set desired dimensions (16x16, 32x32, 48x48, 128x128)
4. Download PNG files

### Using ImageMagick
```bash
# Convert to different sizes
magick icon.svg -resize 16x16 icon16.png
magick icon.svg -resize 32x32 icon32.png
magick icon.svg -resize 48x48 icon48.png
magick icon.svg -resize 128x128 icon128.png
```

### Using Inkscape
```bash
# Export to PNG with specific sizes
inkscape -w 16 -h 16 icon.svg -o icon16.png
inkscape -w 32 -h 32 icon.svg -o icon32.png
inkscape -w 48 -h 48 icon.svg -o icon48.png
inkscape -w 128 -h 128 icon.svg -o icon128.png
```
