# PWA Icons

The app uses SVG icons for the PWA manifest. Some browsers also require PNG fallbacks.

## Current Icons

- `icon-192.svg` - 192x192 app icon (SVG)
- `icon-512.svg` - 512x512 app icon (SVG)
- `apple-touch-icon.svg` - iOS home screen icon

## Generate PNG Icons (Optional)

To generate PNG versions for better browser compatibility:

### Option 1: Using ImageMagick (Command Line)

```bash
# Install ImageMagick first: https://imagemagick.org/

# Generate 192x192 PNG
magick icon-192.svg -resize 192x192 icon-192.png

# Generate 512x512 PNG
magick icon-512.svg -resize 512x512 icon-512.png
```

### Option 2: Using Online Converter

1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon-192.svg` and convert to PNG (192x192)
3. Upload `icon-512.svg` and convert to PNG (512x512)
4. Save both files to this `web/public/` directory

### Option 3: Using Inkscape

```bash
# Install Inkscape first: https://inkscape.org/

# Generate 192x192 PNG
inkscape icon-192.svg --export-filename=icon-192.png --export-width=192 --export-height=192

# Generate 512x512 PNG
inkscape icon-512.svg --export-filename=icon-512.png --export-width=512 --export-height=512
```

## Note

The manifest is configured to use both SVG and PNG formats. SVG icons work on most modern browsers, but PNG fallbacks ensure compatibility with older browsers and some mobile devices.

If you see a console warning about missing PNG icons but the app installs correctly, the SVG icons are working and PNG conversion is optional.
