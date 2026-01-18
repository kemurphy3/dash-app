# DASH App Assets

This folder should contain the following image assets for the app:

## Required Assets

### icon.png
- **Size:** 1024x1024 pixels
- **Format:** PNG with transparency
- **Usage:** App icon on iOS and Android
- **Design:** DASH logo - suggested: bold "D" with accent color (#FF3C00) on dark background (#0a0a0a)

### splash.png
- **Size:** 1284x2778 pixels (iPhone 14 Pro Max safe area)
- **Format:** PNG
- **Background:** #0a0a0a (matches app theme)
- **Design:** Centered DASH logo with tagline "You already decided. Just do it."

### adaptive-icon.png
- **Size:** 1024x1024 pixels
- **Format:** PNG with transparency
- **Usage:** Android adaptive icon foreground
- **Design:** Same as icon.png but with safe zone margins (use 66% of canvas for content)

### notification-icon.png
- **Size:** 96x96 pixels
- **Format:** PNG, white/transparent only (Android requirement)
- **Usage:** Android notification icon
- **Design:** Simple "D" silhouette in white

## Quick Generation (for development)

For development/testing, you can use placeholder icons:

```bash
# Using ImageMagick (if installed)
convert -size 1024x1024 xc:#0a0a0a -fill '#FF3C00' -gravity center -pointsize 400 -annotate 0 'D' icon.png
convert -size 1284x2778 xc:#0a0a0a -fill '#FF3C00' -gravity center -pointsize 200 -annotate 0 'DASH' splash.png
convert -size 1024x1024 xc:transparent -fill '#FF3C00' -gravity center -pointsize 400 -annotate 0 'D' adaptive-icon.png
convert -size 96x96 xc:transparent -fill white -gravity center -pointsize 60 -annotate 0 'D' notification-icon.png
```

## Design Guidelines

- **Primary Color:** #FF3C00 (DASH accent orange)
- **Background:** #0a0a0a (app black)
- **Font:** Bold, sans-serif (SF Pro Display or similar)
- **Style:** Minimal, bold, high contrast

## Generating Production Assets

For production, use a design tool like Figma, Sketch, or Adobe XD to create proper vector-based assets, then export at the required sizes.

Consider using [Expo's Icon Builder](https://docs.expo.dev/develop/user-interface/app-icons/) for guidance on icon safe zones and requirements.
