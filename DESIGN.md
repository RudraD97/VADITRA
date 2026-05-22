---
name: Aura
colors:
  surface: '#121413'
  surface-dim: '#121413'
  surface-bright: '#383a38'
  surface-container-lowest: '#0d0f0e'
  surface-container-low: '#1a1c1b'
  surface-container: '#1e201f'
  surface-container-high: '#282a29'
  surface-container-highest: '#333534'
  on-surface: '#e2e3e0'
  on-surface-variant: '#c4c9b5'
  inverse-surface: '#e2e3e0'
  inverse-on-surface: '#2f3130'
  outline: '#8e9380'
  outline-variant: '#444939'
  surface-tint: '#aed366'
  primary: '#ffffff'
  on-primary: '#243600'
  primary-container: '#c9f07e'
  on-primary-container: '#4f6e04'
  inverse-primary: '#496800'
  secondary: '#bfc9c2'
  on-secondary: '#29322d'
  secondary-container: '#404943'
  on-secondary-container: '#aeb7b0'
  tertiary: '#ffffff'
  on-tertiary: '#2e3130'
  tertiary-container: '#e1e3e1'
  on-tertiary-container: '#626563'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c9f07e'
  primary-fixed-dim: '#aed366'
  on-primary-fixed: '#141f00'
  on-primary-fixed-variant: '#364e00'
  secondary-fixed: '#dbe5dd'
  secondary-fixed-dim: '#bfc9c2'
  on-secondary-fixed: '#151d19'
  on-secondary-fixed-variant: '#404943'
  tertiary-fixed: '#e1e3e1'
  tertiary-fixed-dim: '#c5c7c5'
  on-tertiary-fixed: '#191c1b'
  on-tertiary-fixed-variant: '#444746'
  background: '#121413'
  on-background: '#e2e3e0'
  surface-variant: '#333534'
typography:
  display-lg:
    fontFamily: Syne
    fontSize: 64px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-md:
    fontFamily: Syne
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Syne
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Syne
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Syne
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-margin-desktop: 64px
  container-margin-mobile: 20px
  gutter: 24px
  section-gap: 80px
---

## Brand & Style

The design system embodies a "minimalist audiophile" aesthetic, prioritizing high-fidelity focus and sensory clarity. It targets a sophisticated audience that values intentionality, deep listening, and premium digital craft. The emotional response is one of calm, immersive focus—removing the friction between the listener and the art.

The style is a refined fusion of **Minimalism** and **Glassmorphism**. It utilizes expansive whitespace (breathing room), ultra-thin architectural lines, and subtle translucent layers to create a sense of depth without visual noise. Every element is stripped to its essential function, allowing large-scale typography and rich album photography to serve as the primary visual drivers.

## Colors

The palette transitions from earthy origins to a high-contrast, premium "Dark Mode" execution. 

- **Primary (Luminous Sage):** A vibrant, high-energy green used sparingly for active states, playback progress, and critical calls to action. It should appear to "glow" against the dark backgrounds.
- **Secondary (Deep Charcoal):** Used for surface containers and elevated UI elements.
- **Neutral (Obsidian):** The foundation of the UI. A near-black charcoal that provides maximum contrast for the Luminous Sage and white typography.
- **Accents:** Use low-opacity whites (10-20%) for borders and glassmorphic overlays to maintain a lightweight feel.

## Typography

Typography is the structural backbone of this design system. 
- **Headings:** 'Syne' provides a distinctive, slightly unconventional character. Use Extra Bold for large display moments and Semi Bold for standard headlines to ensure clear hierarchy.
- **Body:** 'Inter' provides a systematic, highly legible contrast to the expressive headings. It handles data-heavy views (tracklists, settings) with neutral precision.
- **Labels:** Use uppercase tracking for metadata and small labels to evoke the feel of high-end audio equipment interfaces.

## Layout & Spacing

The layout philosophy is centered on "intentional void." By increasing margins and section gaps, the UI feels unhurried and premium.

- **Grid:** A 12-column fluid grid for desktop with wide 64px outer margins.
- **Rhythm:** All spacing must be multiples of the 8px base unit. 
- **Negative Space:** Use generous padding within cards and containers (minimum 32px) to ensure content never feels cramped. 
- **Reflow:** On mobile, margins compress to 20px, and the 12-column grid collapses to a single-column stack, prioritizing full-bleed imagery.

## Elevation & Depth

Depth is achieved through **Tonal Layering** and **Glassmorphism** rather than traditional drop shadows.

- **Surface Levels:** The background is the darkest layer (`#0F1110`). Elevated containers (cards, sidebars) use `#1A1D1C` or `#2D3631`.
- **Glass Effects:** Overlays, such as navigation bars or player controls, use a backdrop blur (20px - 40px) with a 60% opaque charcoal fill.
- **Borders:** Instead of shadows, use 1px or 0.5px "hairline" borders. Use `rgba(255, 255, 255, 0.1)` for standard borders to create a subtle, etched look.
- **Active State:** Elements that are "active" or "playing" do not lift; instead, they gain a 1px solid Primary (Sage) border or a soft, rhythmic inner glow.

## Shapes

The shape language is "Soft-Technical." We use a conservative corner radius (4px to 12px) to maintain a sense of precision and professional-grade hardware. 

- **Small elements (Buttons, Chips):** 4px radius (`rounded-sm`).
- **Standard containers (Cards, Inputs):** 8px radius (`rounded-md`).
- **Large containers (Album Art, Modals):** 12px radius (`rounded-lg`).
- Avoid full pills or circles unless used for playback controls (Play/Pause) to emphasize their unique function.

## Components

- **Buttons:** Primary buttons use a solid Sage background with black text. Secondary buttons use the hairline border treatment (1px white @ 10%) with no fill.
- **Inputs:** Minimalist underlines or subtle 1px bordered boxes. Focus states should transition the border color to Primary Sage with a soft 0.5s fade.
- **Track Lists:** Clean, high-density rows. Use 'Inter' for titles and 'Inter' (Regular, 60% opacity) for artist names and durations.
- **Cards:** No shadows. Use the `secondary` color for the background and a 0.5px border. Album art within cards should have a subtle 4px radius.
- **Motion & Animation:**
    - **Fluidity:** All transitions use a `cubic-bezier(0.22, 1, 0.36, 1)` easing function.
    - **Interactions:** Subtle scale-up (1.02x) on hover for interactive tiles.
    - **Active State:** A rhythmic "pulse" (opacity 0.8 to 1.0) on the Primary Sage accent for currently playing audio.
    - **Fades:** Page transitions should utilize a soft 300ms "fade and slide up" (10px) to maintain the ethereal brand feel.