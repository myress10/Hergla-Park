---
name: Lumina Transition
colors:
  surface: '#fbf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fbf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#555e76'
  primary: '#1f283d'
  on-primary: '#ffffff'
  primary-container: '#353e54'
  on-primary-container: '#a0a9c3'
  inverse-primary: '#bdc6e1'
  secondary: '#b7102a'
  on-secondary: '#ffffff'
  secondary-container: '#db313f'
  on-secondary-container: '#fffbff'
  tertiary: '#342608'
  on-tertiary: '#ffffff'
  tertiary-container: '#4c3c1c'
  on-tertiary-container: '#bea77e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2fe'
  primary-fixed-dim: '#bdc6e1'
  on-primary-fixed: '#121b2f'
  on-primary-fixed-variant: '#3d465d'
  secondary-fixed: '#ffdad8'
  secondary-fixed-dim: '#ffb3b1'
  on-secondary-fixed: '#410007'
  on-secondary-fixed-variant: '#92001c'
  tertiary-fixed: '#f9dfb3'
  tertiary-fixed-dim: '#dcc399'
  on-tertiary-fixed: '#261901'
  on-tertiary-fixed-variant: '#554424'
  background: '#fbf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style
The design system facilitates a psychological transition from a physical, family-oriented amusement park to a high-tech virtual racing environment. The brand personality is grounded yet aspirational, beginning with a reliable "Park Authority" feel and evolving into an "Immersive Pilot" aesthetic.

The style is a hybrid of **Modern Corporate** and **Cyber-Minimalism**. It utilizes a "Progressive Darkening" narrative:
- **Phase 1 (Arrival):** High-key, airy, and welcoming. Focuses on clarity and safety.
- **Phase 2 (Deepening):** Mid-tones emerge. Borders soften into glows.
- **Phase 3 (Immersion):** Dark-mode dominance. UI elements become luminous, adopting a tech-centric, "Head-Up Display" (HUD) quality.

## Colors
The palette is dynamic, anchored by the Hergla Park "Deep Blue" (#353E54).

- **The Foundation:** The "Deep Blue" acts as the bridge between the physical and virtual. The "Red/Orange" accent from the park identity is used sparingly for critical alerts or "Start Engine" moments.
- **The Shift:** As the user progresses, the background transitions from `surface_start` to `surface_end`.
- **The Glow:** In the final stages, interactive elements abandon traditional fills for `accent_cyan` and `accent_violet` strokes and outer glows, mimicking a VR interface.

## Typography
**Hanken Grotesk** is the sole typeface, ensuring a professional and highly legible experience across all phases. 

- **Headlines:** Use heavy weights (700-800) with slight negative letter-spacing for a high-impact, "automotive" feel.
- **Micro-copy:** Labels for controls (WASD) should use `label-caps` to evoke a technical manual or HUD interface.
- **Scale:** On mobile, headlines scale down to maintain information density, while body text remains large for readability during the "Virtual Visit" movement.

## Layout & Spacing
The layout follows a **Fixed Grid** model for desktop to ensure the VR viewport remains centered and controlled.

- **Grid:** 12-column system for desktop, 4-column for mobile.
- **Safe Zones:** A 24px margin is enforced on all screen edges to prevent UI elements from clashing with the immersive background imagery.
- **Rhythm:** An 8px base unit drives all padding and margins. Vertical rhythm is tightened in later steps to mimic compact cockpit displays.
- **Adaptation:** On mobile, the "Control Scheme" overlay moves to the bottom 30% of the screen, utilizing thumb-friendly touch zones.

## Elevation & Depth
Depth perception evolves with the onboarding steps:

- **Step 1:** Uses **Tonal Layers**. Subtle, soft shadows on white cards create a safe, physical feel.
- **Steps 2-3:** Transitions to **Glassmorphism**. Surfaces become semi-transparent (80% opacity) with a 12px backdrop blur, allowing the "Park" background to peek through.
- **Step 4:** Uses **Luminous Outlines**. Shadows are replaced by "Neon Glows." Elements appear to float via light emission rather than physical stacking.

## Shapes
A **Rounded (0.5rem)** base is used for containers and standard buttons to maintain a friendly "Park" atmosphere. 

As the tech influence increases in later steps, interactive icons (WASD keys) may utilize "Rounded-lg" (1rem) to appear more like physical cockpit buttons, while secondary info panels may sharpen to "Soft" (0.25rem) for a precision-tool aesthetic.

## Components

### 4-Point Progress Bar
Located at the absolute top. In Step 1, it is a solid Deep Blue line. By Step 4, the active segment pulses with a Cyan `0 0 10px` glow and a secondary trail effect.

### Neon-Accented CTAs
Primary buttons in the final stages use a transparent background with a 2px `accent_cyan` border and a matching text color. On hover, the button fills with a 10% opacity cyan tint and increases glow intensity.

### Control Scheme (WASD/Arrows)
Represented as a cluster of high-contrast keys. Each key is a "Soft" rounded square. Active keys (when pressed) flash in `secondary_color_hex` (Red) to provide immediate haptic-style visual feedback.

### Interaction Cards
Used in the gallery sections. They feature a "bottom-up" gradient overlay to ensure text legibility over photography. In later steps, these cards adopt the Glassmorphism style with blurred backgrounds.

### Input Fields
Initially standard outlined boxes. In the "Tech" phase, they transition to a "Bottom-border only" style with a neon focus state, resembling a data-entry terminal.