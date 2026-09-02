---
name: Serene Strength
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#434843'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#737872'
  outline-variant: '#c3c8c1'
  surface-tint: '#506354'
  primary: '#334537'
  on-primary: '#ffffff'
  primary-container: '#4a5d4e'
  on-primary-container: '#c0d5c2'
  inverse-primary: '#b7ccb9'
  secondary: '#845333'
  on-secondary: '#ffffff'
  secondary-container: '#fdbb94'
  on-secondary-container: '#78492a'
  tertiary: '#444138'
  on-tertiary: '#ffffff'
  tertiary-container: '#5b584f'
  on-tertiary-container: '#d4cfc3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d3e8d5'
  primary-fixed-dim: '#b7ccb9'
  on-primary-fixed: '#0e1f13'
  on-primary-fixed-variant: '#394b3d'
  secondary-fixed: '#ffdbc8'
  secondary-fixed-dim: '#fab891'
  on-secondary-fixed: '#321300'
  on-secondary-fixed-variant: '#683c1e'
  tertiary-fixed: '#e8e2d6'
  tertiary-fixed-dim: '#cbc6ba'
  on-tertiary-fixed: '#1e1c14'
  on-tertiary-fixed-variant: '#4a473e'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  gutter: 16px
  section-gap: 48px
  stack-sm: 12px
  stack-md: 24px
---

## Brand & Style
The design system embodies the "Japandi" philosophy—a fusion of Japanese minimalism and Scandinavian functionality. It targets fitness enthusiasts who seek a mindful, intentional approach to physical training, moving away from the aggressive, high-octane visuals common in the industry. 

The aesthetic is **Minimalist and Tactile**, emphasizing serene environments, functional clarity, and a "warm-modern" emotional response. Key characteristics include:
- **Quiet Functionalism:** Every element has a purpose; unnecessary decoration is stripped away.
- **Natural Warmth:** Soft lighting effects and organic tones replace harsh digital whites.
- **Mindful Pace:** Layouts are breathable to prevent information overload during intense workouts.

## Colors
The palette is grounded in nature and earth tones to promote a calm, focused atmosphere.

- **Primary (Olive):** Used for main actions, active states, and success indicators. It represents growth and stability.
- **Secondary (Terracotta):** Used sparingly for highlights, progress milestones, and call-to-outs.
- **Surface (Sand/Cream):** The primary background color is a soft cream (`#F9F7F2`) rather than pure white, reducing eye strain.
- **Contrast (Charcoal):** Used for high-level typography and structural borders to provide necessary definition.
- **Muted Accents:** Use a desaturated beige for secondary containers and subtle dividers.

## Typography
The typography strategy pairs the authoritative, literary feel of **Source Serif 4** with the systematic clarity of **Inter**.

- **Headlines:** Use the serif face to denote sections and workout titles, creating a "boutique" editorial feel. 
- **Data & Numbers:** Workout metrics (reps, sets, timers) should use Inter with medium or semibold weights to ensure maximum legibility at a glance.
- **Labels:** Small labels use uppercase Inter with increased letter spacing for a refined, architectural look.
- **Line Heights:** Generous line heights are maintained across all levels to support the "breathable" layout philosophy.

## Layout & Spacing
This design system utilizes a **Fixed Grid** approach for desktop and a **Fluid Margin** approach for mobile to maintain a sense of structured composition.

- **Desktop:** 12-column grid with a max-width of 1200px. Content is centered with significant outer margins to focus the user's eye.
- **Mobile:** 4-column grid with 24px side margins. 
- **Rhythm:** Spacing follows an 8px base unit. Vertical stack spacing is intentionally large (24px to 48px) to isolate workout components and prevent cognitive clutter.
- **Negative Space:** Whitespace is treated as a functional element, not "empty" space. It is used to separate muscle groups, sets, and rest periods.

## Elevation & Depth
Depth is expressed through **Tonal Layers** and **Subtle Diffusion**. We avoid heavy, artificial shadows in favor of a natural, layered paper effect.

- **Surface Tiers:** The base background is the warmest tone. Elevated cards use a slightly lighter cream or white to stand out.
- **Shadows:** Use extremely soft, long-range shadows with low opacity (3-5%) and a slight color tint of the Primary color to simulate ambient, natural light.
- **Borders:** Use thin (1px), low-contrast borders in a "Sand" color (`#E0DDD5`) to define areas without creating visual noise.
- **Interaction:** On hover or active state, elements should slightly lift (increase shadow spread) or shift color subtly, avoiding aggressive transitions.

## Shapes
Shapes are organic and approachable. We use **Rounded** corners to evoke the "soft minimalism" of Scandinavian furniture.

- **Standard Elements:** Buttons, input fields, and small cards use a 0.5rem (8px) radius.
- **Large Containers:** Workout overview cards and progress charts use 1rem (16px) to 1.5rem (24px) for a more "furniture-like" presence.
- **Buttons:** Primary buttons use a 0.5rem radius rather than fully pill-shaped to maintain a modern, architectural structure.
- **Icons:** Use thin-stroke, open-ended icons with rounded caps to match the typography's weight.

## Components
- **Buttons:** Primary buttons are solid Olive with white text. Secondary buttons use a Charcoal outline. Avoid gradients; use flat, matte finishes.
- **Workout Cards:** Feature a subtle "Sand" border and a very light background. Use the Serif font for the exercise name and Inter for the weight/reps.
- **Input Fields:** Use a "soft-inset" look. Backgrounds should be slightly darker than the page background to create a functional "well."
- **Progress Trackers:** Linear gauges and circular rings should use the Secondary (Terracotta) color for the active path against a "Sand" background path.
- **Chips/Tags:** Used for "Muscle Groups" or "Equipment." These should be low-contrast (Beige background with Charcoal text) to remain secondary to the main action.
- **Timer Component:** Large, high-contrast display using Inter. The countdown should feel prominent but calm, utilizing a slow-pulse animation on the Terracotta accent.