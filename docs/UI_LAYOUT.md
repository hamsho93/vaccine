## Modern Layout Blueprint

This document captures the proposed structure for the refreshed VaxRecord interface, including desktop and mobile behaviors.

### 1. Viewport & Breakpoints

| Label      | Width                | Notes                                          |
|------------|----------------------|------------------------------------------------|
| `mobile`   | `< 768px`            | Single column, sticky action bar               |
| `tablet`   | `768px – 1023px`     | One column with wider cards, collapsible side  |
| `desktop`  | `≥ 1024px`           | Two-column grid with dedicated sidebar         |

### 2. Top Navigation

| Area           | Desktop                                                    | Mobile / Tablet                                             |
|----------------|------------------------------------------------------------|-------------------------------------------------------------|
| Left           | Logo + “VaxRecord” + version badge (small)                 | Logo + hamburger icon                                       |
| Center         | Primary nav tabs: **Intake**, **Recommendations**, **Docs**| Hidden behind drawer; reveal via hamburger                  |
| Right          | GitHub icon, Feedback button, user avatar                  | Moved into drawer or overflow menu                          |
| Behavior       | Sticks to top on scroll, subtle shadow                     | Collapsible to 56px height; drawer slides from right        |

### 3. Hero Summary Strip

- Displays 3–4 stat chips: `Patient Age`, `Vaccines Parsed`, `Action Needed`, `Last Updated`.
- Background: light gradient (`bg-gradient-card`), rounded 16px.
- Mobile behavior: chips become horizontal scrollable pills or stack in a collapsible accordion to save space.

### 4. Main Content Grid

#### Desktop (Two Columns)

| Left Column (≈66%)                                | Right Column (≈34%)                          |
|--------------------------------------------------|----------------------------------------------|
| 1. **Intake Panel** (tabs for Free Text / Structured, inline helper tips).<br>2. **Parsed History Card** (collapsible table).<br>3. **Recommendations Section** with category tabs (Action Needed, Complete, Shared Decision, etc.). | 1. **Next Steps Panel** (list of outstanding items, export buttons).<br>2. **Data Privacy & Clinical Notes** cards.<br>3. Optional analytics or “What’s New” teaser. |

- Gutter between columns: 32px.
- Cards share consistent width, 24px padding, 16px radius.

#### Mobile / Tablet

- Single column flow; sections stack vertically with 16px gaps.
- **Sticky quick action bar** at bottom containing `Export` + `Next Steps` button; shows only when recommendations available.
- Intake panel collapses into accordions; parsed history table uses horizontal scroll with “View full table” modal.
- Recommendation categories switch to segmented control (horizontal scroll) with badges for counts.

### 5. Footer

| Desktop                                  | Mobile                                    |
|------------------------------------------|-------------------------------------------|
| Two-column layout: left = product copy, right = links (Docs, Security, Support). | Single column list, centered text, compact spacing. |

### 6. Interaction Notes

- **Progress Indicator:** 3-step bar (Input → Processing → Recommendations). On mobile, display above intake form with small badges.
- **Skeleton States:** Loading placeholders for parsed history and recommendation cards to avoid layout jumps.
- **Tooltips:** Info icons next to CDC labels, show link previews on hover/tap.
- **Feedback Entry:** Floating action button on mobile; inline button in sidebar on desktop.

### 7. Component Inventory

| Component            | Notes                                                                 |
|----------------------|-----------------------------------------------------------------------|
| `TopNav`             | Accepts nav items + quick actions; handles mobile drawer toggling.    |
| `SummaryStrip`       | Renders stat chips; supports horizontal scroll on mobile.             |
| `MainGrid`           | Responsive layout wrapper; defines column / single-column switch.     |
| `IntakePanel`        | Tabs, helper text, CTA button.                                        |
| `ParsedHistoryCard`  | Collapsible table with responsive scroll + “expand” modal.            |
| `RecommendationsTabs`| Pill tabs with counts, renders `VaccineCard` grid/list.               |
| `SidebarPanel`       | Houses Next Steps, privacy notes, feedback CTA.                       |
| `QuickActionBar`     | Mobile-only sticky component for exports/next steps.                  |

### 8. Responsive Checklist

- [ ] Top nav hamburger/drawer functioning on `<768px`.
- [ ] Summary chips scrollable or collapsible on mobile.
- [ ] Intake form accordions accessible (keyboard + touch).
- [ ] Tables scroll horizontally with `aria` labels for screen readers.
- [ ] Sticky quick action bar does not overlap toasts/modals.
- [ ] Footer links readable at small sizes.


