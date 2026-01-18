# DASH App Icon Design Specification

## Brand Identity

**App Name:** DASH (Daily Actions, Stop Hesitating)
**Primary Color:** #FF3C00 (Accent Orange)
**Background:** #0a0a0a (Near Black)

## Icon Concept

The DASH icon represents:
- Speed and momentum (the "dash" concept)
- Forward motion without hesitation
- Simplicity and focus

## Design Requirements

### Main App Icon (1024x1024)
- **Background:** Solid #0a0a0a (near black)
- **Primary Element:** Stylized ">" or arrow shape in #FF3C00
- **Style:** Minimal, geometric, bold
- **Safe Zone:** Keep main element within center 80% for iOS mask

### Adaptive Icon (Android)
- **Foreground:** Arrow/dash shape, centered with padding
- **Background Color:** #0a0a0a

### Notification Icon (Android)
- **Size:** 96x96
- **Style:** Single-color silhouette (white on transparent)
- **Shape:** Simple arrow or dash mark

## Suggested Icon Designs

### Option A: Forward Arrow
```
    ██████████████
    ██          ██
    ██  ███>    ██
    ██          ██
    ██████████████
```
A bold right-pointing arrow (>) in orange on black background.

### Option B: Dash Mark
```
    ██████████████
    ██          ██
    ██  ══════> ██
    ██          ██
    ██████████████
```
A horizontal dash ending in an arrow point.

### Option C: Letter D with Arrow
```
    ██████████████
    ██          ██
    ██  D →     ██
    ██          ██
    ██████████████
```
The letter "D" with an arrow emerging from it.

## Splash Screen

**Dimensions:** 1284x2778 (iPhone 14 Pro Max, scales down)
**Background:** Solid #0a0a0a

**Layout:**
```
┌────────────────────────┐
│                        │
│                        │
│                        │
│         [Icon]         │
│                        │
│          DASH          │
│                        │
│   Daily Actions,       │
│   Stop Hesitating      │
│                        │
│                        │
│                        │
└────────────────────────┘
```

**Typography:**
- "DASH": Bold, 48pt, #FFFFFF
- Tagline: Regular, 16pt, #737373 (gray500)

## File Deliverables Needed

1. `assets/icon.png` - 1024x1024, PNG, rounded corners handled by OS
2. `assets/adaptive-icon.png` - 1024x1024, PNG, transparent background
3. `assets/splash.png` - 1284x2778, PNG
4. `assets/notification-icon.png` - 96x96, PNG, white silhouette

## Color Codes for Design Tools

| Name | Hex | RGB |
|------|-----|-----|
| Accent (Orange) | #FF3C00 | 255, 60, 0 |
| Background (Black) | #0A0A0A | 10, 10, 10 |
| White | #FAFAFA | 250, 250, 250 |
| Gray 500 | #737373 | 115, 115, 115 |

## Figma/Design Tool Export Settings

### For iOS App Icon:
- Export as PNG
- 1024x1024
- No transparency (fill with background color)

### For Android Adaptive Icon:
- Export foreground as PNG with transparent background
- 1024x1024
- Safe zone: inner 66% of canvas

### For Notification Icon:
- Export as PNG with transparent background
- White color only (#FFFFFF)
- 96x96

## Quick Generation (Using Image Tools)

If you need to quickly generate icons:

1. Create 1024x1024 canvas with #0A0A0A background
2. Add a centered right-pointing chevron/arrow in #FF3C00
3. Arrow should fill about 40-50% of the canvas width
4. Export variations as specified above

For the splash screen:
1. Create 1284x2778 canvas with #0A0A0A background
2. Center the icon at 30% from top
3. Add "DASH" text below icon
4. Add tagline below that
