## Component Refactor Plan

This document enumerates the key component updates required for the modern layout. Each section outlines current state, desired improvements, and responsive considerations.

### 1. Top Navigation (`TopNav`)
- **Current:** Large header with stacked logo/title, GitHub icon, Feedback button, CDC info.
- **Updates:**
  - Compress height to ~64px on desktop; 56px on mobile.
  - Introduce nav tabs (“Intake”, “Recommendations”, “Docs”) using shadcn `Tabs`.
  - Add hamburger button that opens a slide-over drawer for mobile.
  - Move CDC version into a subtle badge near the title or inside drawer.

### 2. Summary Strip (`SummaryStrip`)
- **Structure:** Horizontal row of stat chips with icon + label + value.
- **Mobile:** Chips become horizontally scrollable or collapsible accordion with `Disclosure`.
- **Styles:** Use `bg-gradient-card`, 16px radius, 1px border `#E2E8F0`.

### 3. Intake Panel (`IntakePanel`)
- **Refactor:** Extract the entire free text/structured form into its own component.
- **Tabs:** Replace existing toggle buttons with `Tabs` component (vertical on mobile).
- **Helper text:** Use shadcn `Alert` with minimal icon.
- **CTA:** Primary gradient button with icon, full width on mobile.

### 4. Parsed History (`ParsedHistoryCard`)
- **Layout:** Card with header (title + export button), body with responsive table.
- **Responsive table:** Wrap in `overflow-x-auto`, add sticky first column and “View full table” modal on mobile.
- **Collapsible:** Add “Hide parsed data” toggle to reduce height when not needed.

### 5. Recommendations (`RecommendationsPanel`)
- **Tabs redesign:** Pill-style segmented control with counts, horizontal scroll on mobile.
- **Card design:** 
  - Header: icon + vaccine name + status badge.
  - Body: recommendation text, next dose chip, notes list with `Accordion` for long content.
  - Footer: CTA buttons (e.g., “Mark complete”, “View CDC note”).
- **Grid:** Two columns on desktop, single column on mobile; add `grid gap-4`.

### 6. Sidebar (`SidebarPanel`)
- **Sections:** 
  - Next steps list (each item as compact card with status dot).
  - Export buttons (JSON/CSV) using secondary button variant.
  - Privacy & Clinical info cards.
- **Mobile:** Moves below main content; quick action bar provides immediate access to exports.

### 7. Quick Action Bar (`QuickActionBar`)
- **Purpose:** Provide persistent access to `Export`, `Share`, `Contact Support`.
- **Behavior:** Only visible on mobile when recommendations are available.
- **Style:** `backdrop-blur-md`, semi-transparent background, drop shadow, pill buttons.

### 8. Loading & Empty States
- **Skeletons:**
  - `IntakePanel`: skeleton lines for input fields.
  - `ParsedHistoryCard`: table row placeholders.
  - `VaccineCard`: grey boxes for titles/buttons.
- **Empty states:** Friendly illustrations, CTA to load sample data.

### 9. Toasts & Modals
- Switch to unified toast styling (icon + bold title + body).
- Update modals (e.g., “View full history”) with new card styles.

### 10. Implementation Order
1. Build shared layout components (TopNav, SummaryStrip, MainGrid, Sidebar).
2. Refactor intake + parsed history + recommendations into modular components.
3. Add quick action bar & skeletons.
4. Update toasts, modals, and empty states.

