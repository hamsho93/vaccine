## UI Theme Tokens

This document enumerates the design tokens and component theming decisions for the modern VaxRecord interface.

### 1. Colors

| Token                | Value        | Usage                                    |
|----------------------|--------------|------------------------------------------|
| `--color-bg-page`    | `#F7FAFC`    | Page background                          |
| `--color-bg-card`    | `#FFFFFF`    | Cards, modals                            |
| `--color-border`     | `#E2E8F0`    | Dividers, subtle outlines                |
| `--color-text`       | `#0F172A`    | Primary text                             |
| `--color-text-muted` | `#475569`    | Secondary text                           |
| `--color-primary`    | `#2563EB`    | CTA buttons, highlights                  |
| `--color-primary-accent` | `#14B8A6`| Gradients, hover states                  |
| `--color-teal`       | `#0D9488`    | Informational badges                     |
| `--color-warning`    | `#FBBF24`    | Warnings / attention states              |
| `--color-error`      | `#F97316`    | Errors, critical toasts                  |
| `--color-success`    | `#10B981`    | Success states                           |

### 2. Gradients

- `bg-gradient-primary`: `linear-gradient(120deg, #2563EB 0%, #14B8A6 100%)` (primary actions)
- `bg-gradient-card`: `linear-gradient(135deg, rgba(37,99,235,0.08), rgba(20,184,166,0.08))` (summary strip)

### 3. Typography

- Font family: `Inter`, fallback `system-ui`
- Heading scale:
  - `h1`: 32px / 38px / weight 600
  - `h2`: 24px / 32px / weight 600
  - `h3`: 20px / 28px / weight 600
- Body text: 16px / 24px / weight 400–500
- Caption / label: 13–14px / 18px / uppercase optional
- Increase letter-spacing slightly (`0.01em`) for headings to improve legibility.

### 4. Buttons

| Variant     | Specs                                                                 |
|-------------|-----------------------------------------------------------------------|
| Primary     | Gradient background, white text, pill radius `999px`, shadow `0 6px 20px rgba(37, 99, 235, 0.25)` |
| Secondary   | Outline with `#CBD5F5` border, radius `12px`, text `#2563EB`           |
| Ghost       | Transparent background, text `#475569`, hover `rgba(15,23,42,0.04)`   |

### 5. Cards & Shadows

- Radius: 16px (desktop), 12px (mobile)
- Shadow combo:
  - `0 12px 30px rgba(15, 23, 42, 0.04)`
  - `0 2px 8px rgba(15, 23, 42, 0.05)`
- Card padding: 24px desktop, 16px mobile

### 6. Spacing & Grid

- Base spacing unit: 8px
- Desktop column gap: 32px
- Mobile section gap: 16px
- Section max-width: 1200px (centered)

### 7. Iconography

- Lucide icons, stroke width 1.5, sizes 20–24px.
- Colors align with status (primary blue, teal for info, amber for warning).

### 8. Mobile Considerations

- Sticky quick action bar uses semi-transparent background with blur (`backdrop-blur-md`).
- Nav drawer covers 80% width with `bg-white` and subtle shadow.
- Summary chips become horizontal scrollable pills or collapsible accordion.

### 9. Implementation Notes

- Add Tailwind custom colors and gradients inside `tailwind.config.ts` under `theme.extend`.
- Export CSS variables in `client/src/index.css` for easy overrides in shadcn components.
- Primary button component should accept `variant="gradient"` to reuse the gradient token.
*** End Patch

