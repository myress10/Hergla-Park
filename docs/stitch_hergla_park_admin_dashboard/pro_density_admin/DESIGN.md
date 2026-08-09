---
name: Pro-Density Admin
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#555e76'
  primary: '#1f283d'
  on-primary: '#ffffff'
  primary-container: '#353e54'
  on-primary-container: '#a0a9c3'
  inverse-primary: '#bdc6e1'
  secondary: '#ba002d'
  on-secondary: '#ffffff'
  secondary-container: '#e8063c'
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
  secondary-fixed: '#ffdad9'
  secondary-fixed-dim: '#ffb3b3'
  on-secondary-fixed: '#400009'
  on-secondary-fixed-variant: '#920022'
  tertiary-fixed: '#f9dfb3'
  tertiary-fixed-dim: '#dcc399'
  on-tertiary-fixed: '#261901'
  on-tertiary-fixed-variant: '#554424'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  accent-yellow: '#FFD600'
  status-success: '#10B981'
  status-warning: '#F59E0B'
  status-error: '#EF4444'
  status-closed: '#64748B'
  surface-sidebar: '#1E293B'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
  data-tabular:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 260px
  sidebar-collapsed: 72px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  unit-xs: 4px
  unit-sm: 8px
  unit-md: 16px
  unit-lg: 24px
---

## Brand & Style

The design system is engineered for high-efficiency administrative workflows, balancing the recreational energy of the park with the rigorous demands of business operations. It serves a diverse user base including Superadmins, Admins, and Employees managing a complex physical environment.

The visual style is **Corporate / Modern** with a focus on **Data-Centric Minimalism**. It prioritizes information density and legibility over decorative elements. The interface uses a clean, flat aesthetic with structural logic designed to facilitate rapid decision-making. Key characteristics include:
- **High Information Density:** Compact padding and optimized font scales to maximize data visibility without clutter.
- **Bi-Directional Logic:** Every component is architected for seamless mirroring between French (LTR) and Arabic (RTL) locales.
- **Action-Oriented Hierarchy:** Color is used strategically to denote status and urgency, while the rest of the interface remains neutrally professional.

## Colors

The palette is anchored by the deep corporate blue of the brand, providing a stable foundation for an admin environment. 

- **Primary (#353E54):** Used for primary navigation, headings, and core structural elements.
- **Secondary (#E8063C):** Reserved for high-impact actions, critical alerts, and branding accents.
- **Surface Neutrals:** A range of cool grays from `#F8FAFC` (backgrounds) to `#1E293B` (dark sidebar) creates clear visual containment.
- **Semantic Status Palette:**
    - **Open (Success):** A vibrant green for active operations.
    - **Maintenance (Warning):** A warm orange for caution or pending tasks.
    - **Closed (Error/Neutral):** Red for forced closures; Slate gray for scheduled closures.

## Typography

This design system uses a dual-sans-serif pairing to distinguish between structural hierarchy and data presentation.

- **Headlines (Hanken Grotesk):** Provides a sharp, modern professional feel for page titles and section headers.
- **Body & Labels (Inter):** Chosen for its exceptional legibility in high-density tables and forms.
- **RTL Considerations:** When switching to Arabic, the font weight is increased by one step (e.g., 400 to 500) to maintain visual weight and legibility of Arabic glyphs. Line-heights for Arabic are increased by 10-15% to accommodate taller ascenders/descenders.

## Layout & Spacing

The layout follows a **Fixed Sidebar / Fluid Content** model. 

- **Grid Logic:** A 12-column system is used within the main content area.
- **RTL Behavior:** The layout is fully reversible. The sidebar moves from left to right, text alignment flips, and iconography direction (e.g., arrows) is mirrored unless the icon represents a universal clock-wise progression.
- **Breakpoints:**
    - **Mobile (<768px):** Sidebar becomes a hidden drawer. Content margins reduce to 16px.
    - **Tablet (768px - 1024px):** Sidebar collapses to icon-only view (72px).
    - **Desktop (>1024px):** Full sidebar (260px) with fluid content up to 1440px.

## Elevation & Depth

To maintain a "Professional/Flat" style, the design system avoids heavy shadows, instead using **Tonal Layers** and **Low-Contrast Outlines**.

- **Background:** Primary background is `#F8FAFC`.
- **Containers:** White cards (`#FFFFFF`) with a subtle 1px border (`#E2E8F0`).
- **Elevated States:** Modals and dropdowns use a single, crisp shadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1)`.
- **Layering:** The sidebar uses a dark surface (`#1E293B`) to provide high-contrast grounding against the light content area.

## Shapes

The system uses a **Soft** shape language (`4px` standard radius) to balance modern approachability with professional precision.

- **Standard Elements:** Buttons, inputs, and small cards use a 4px radius.
- **Interactive Components:** Toggles and search bars use a 4px radius to maintain the "flat-geometric" aesthetic.
- **Badges:** Use a slightly higher `rounded-lg` (8px) or full pill-shape for distinct status recognition.

## Components

### Status Badges
- **Open:** Green background (10% opacity) with solid green text. Includes a leading "dot" icon.
- **Closed:** Slate gray background with white text for "Scheduled," or Red background with white text for "Emergency."
- **Maintenance:** Orange background with solid orange text.

### Data Tables
- **High Density:** 12px vertical padding on rows. 
- **Inline Actions:** Minimalist icon buttons (Edit, Delete, More) that appear on row hover.
- **Sortable Headers:** Use small chevrons to the right of the text.

### Space Cards
- **Grid Variant:** 1:1 aspect ratio cards showing space name, current status badge, and a "Quick Action" toggle for status overrides.
- **Full-width Variant:** Horizontal layout for list views, showing usage metrics and assigned employees.

### Side Navigation
- **Primary Links:** Large icons with clear labels.
- **Role Scoping:** Menu items are hidden based on role (SUPERADMIN sees system logs; EMPLOYE sees only their assigned spaces).
- **RTL Flip:** Icons must be positioned to the right of the text in RTL mode.

### Quick Action Toggles
- Small, 32px height switches. Uses the Primary Blue for 'On' states.
- Labeling must be explicit (e.g., "Park Open/Closed") to avoid ambiguity.

### Language Selector
- Placed in the top-right (LTR) / top-left (RTL) utility bar.
- Uses a dropdown with flags and native text (Français / العربية). Switching languages triggers an immediate layout flip.