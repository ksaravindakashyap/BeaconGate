# BeaconGate UI Design System

This document defines typography, colors, spacing, and component styles for BeaconGate. All text uses **Gowun Batang** as the default font. The UI is modern, restrained, and product-like: one accent color, neutral surfaces, soft borders, consistent radius, and accessible contrast.

---

## Typography scale (Gowun Batang)

| Role | Usage | Tailwind / CSS | Notes |
|------|--------|----------------|--------|
| **H1** | Page title, product name | `text-2xl md:text-3xl font-bold tracking-tight text-text-primary` | One per page; no larger than 3xl. |
| **H2** | Section title | `text-lg font-semibold text-text-primary` | Section headers (e.g. Queue preview, Case preview). |
| **H3** | Card title, panel heading | `text-base font-semibold text-text-primary` or `text-sm font-semibold` | Subsections within cards. |
| **Body** | Main content | `text-sm text-text-primary` or `text-base` | Default readable size. |
| **Small** | Muted copy, captions | `text-sm text-text-muted` or `text-xs text-text-muted` | Timestamps, labels, helper text. |
| **Mono** | Code, IDs, hashes | `font-mono text-sm` (Gowun Batang used as fallback; mono for technical content) | Rule IDs, evidence hashes. |

**Font loading:** Gowun Batang is loaded via `next/font/google` with weights 400 and 700, applied as a CSS variable `--font-gowun-batang` and set on `html` / `body`. All components inherit it.

---

## Color palette

### Neutrals

| Token | CSS variable | Usage |
|-------|--------------|--------|
| Background | `--bg: #fafaf9` | Page background. |
| Surface | `--surface: #ffffff` | Cards, header, modals. |
| Surface elevated | `--surface-elevated: #ffffff` | Table header, nested panels. |
| Border | `--border: #e7e5e4` | Card borders, table borders, inputs. |
| Border soft | `--border-soft: #f0eeed` | Hover states, subtle dividers. |
| Text primary | `--text-primary: #1c1917` | Headings, body. |
| Text muted | `--text-muted: #57534e` | Secondary text, timestamps. |

### One accent (primary)

| Token | CSS variable | Usage |
|-------|--------------|--------|
| Accent | `--accent: #2563eb` | Primary buttons, key links, primary badges. |
| Accent hover | `--accent-hover: #1d4ed8` | Hover state for primary actions. |
| Accent muted | `--accent-muted: #dbeafe` | Light accent background (e.g. selected state). |
| Accent foreground | `--accent-foreground: #ffffff` | Text on accent (e.g. button label). |

### Semantic (restrained)

| Token | CSS variable | Usage |
|-------|--------------|--------|
| Success | `--success: #15803d` | Low risk, approved, success messages. |
| Success muted | `--success-muted: #dcfce7` | Success badge background. |
| Warn | `--warn: #a16207` | Medium risk, warnings. |
| Warn muted | `--warn-muted: #fef9c3` | Warn badge background. |
| Danger | `--danger: #b91c1c` | High risk, reject, errors. |
| Danger muted | `--danger-muted: #fee2e2` | Danger badge background. |

**Tailwind theme:** These are wired in `tailwind.config.ts` under `theme.extend.colors` (e.g. `background`, `surface`, `accent`, `success`, `warn`, `danger`). Use `bg-background`, `bg-surface`, `text-text-primary`, `text-text-muted`, `bg-accent`, `text-accent-foreground`, etc.

---

## Spacing & layout

| Rule | Value | Tailwind / CSS |
|------|--------|----------------|
| Container max width | 72rem (1152px) | `max-w-6xl` |
| Page padding | 1.5rem (24px) | `px-6` |
| Section vertical spacing | 2.5rem–3rem | `py-10`, `mb-12` |
| Card padding | 1.5rem | `p-6` |
| Between elements in a card | 0.5rem–1rem | `gap-4`, `mt-2`, `mt-4` |
| Border radius (default) | 8px | `--radius: 8px`; `rounded-lg` |
| Border radius (small) | 6px | `rounded-md` |
| Shadows | Soft: light; Card: soft + slight lift | `--shadow-soft`, `--shadow-card` |

---

## Component style rules

### Buttons

- **Primary:** `bg-accent text-accent-foreground`; hover `bg-accent-hover`; focus ring `ring-2 ring-accent ring-offset-2`. Use for main CTAs (e.g. Create Case).
- **Secondary:** Border + surface; hover: light background (`bg-[var(--border-soft)]`). Use for secondary actions.
- **Ghost:** No border, transparent; hover: light background. Use for tertiary actions (e.g. Cancel in modal).

**Example (primary):**  
`rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground shadow-soft hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2`

### Badges (risk score states)

- **High:** `bg-danger-muted text-danger`; small rounded pill (`rounded-md px-2 py-0.5 text-xs font-medium`).
- **Medium:** `bg-warn-muted text-warn`.
- **Low:** `bg-success-muted text-success`.
- **Neutral:** `bg-[var(--border-soft)] text-text-muted` if needed.

### Cards

- Background: `bg-surface`; border: `border border-border`; radius: `rounded-lg`; shadow: `shadow-card`; padding: `p-6`.

### Tables

- Container: `rounded-md border border-border`; header: `bg-[var(--surface-elevated)]`; rows: `divide-y divide-border`; hover row: `hover:bg-[var(--border-soft)]`; cell padding: `px-4 py-3`; text: `text-sm`; headings: `font-medium text-text-primary`.

### Inputs

- Border: `border border-border`; radius: `rounded-md`; padding: `px-3 py-2`; focus: `focus:ring-2 focus:ring-accent focus:border-accent`. Use `text-text-primary` and placeholder `text-text-muted`.

### Modal

- Overlay: dimmed; panel: `bg-surface border border-border rounded-lg shadow-card`; consistent padding and radius with cards. Header: H2; footer: primary/secondary buttons aligned right.

---

## BeaconGate UI vibe

- **Product-like, not “AI-y”:** No generic gradients everywhere; clean surfaces and one accent.
- **Evidence-first feel:** Structured, traceable: tables, IDs, clear sections (Rule hits vs LLM Advisory).
- **Restrained:** Soft shadows, subtle borders, readable hierarchy; Gowun Batang gives a distinct, elegant typography.
- **Accessible:** Contrast-friendly neutrals and accent; focus states on interactive elements; readable font sizes (no tiny body text).

---

## Tailwind tokens / class examples

```css
/* Globals (in globals.css) */
--bg: #fafaf9;
--surface: #ffffff;
--border: #e7e5e4;
--text-primary: #1c1917;
--text-muted: #57534e;
--accent: #2563eb;
--accent-hover: #1d4ed8;
--radius: 8px;
--shadow-soft: 0 1px 3px rgba(0,0,0,0.06);
--shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
```

```html
<!-- Page container -->
<div class="mx-auto max-w-6xl px-6 py-10">

<!-- Card -->
<article class="rounded-lg border border-border bg-surface p-6 shadow-card">

<!-- Primary button -->
<button class="rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground hover:bg-accent-hover focus:ring-2 focus:ring-accent focus:ring-offset-2">

<!-- Risk badge (high) -->
<span class="inline-flex rounded-md bg-danger-muted px-2 py-0.5 text-xs font-medium text-danger">High</span>

<!-- Section title -->
<h2 class="text-lg font-semibold text-text-primary">
```

---

*Document version: Phase 0. All UI must follow this system for consistency.*
