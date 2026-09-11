---
name: Redline
description: Know what you're signing.
colors:
  ink: "#1c2733"
  paper: "#f7f4ee"
  slate: "#5b6572"
  flag: "#b3452e"
  ink-70: "rgba(28, 39, 51, 0.7)"
  ink-45: "rgba(28, 39, 51, 0.45)"
  slate-30: "rgba(91, 101, 114, 0.3)"
  slate-18: "rgba(91, 101, 114, 0.18)"
  flag-12: "rgba(179, 69, 46, 0.12)"
typography:
  display:
    fontFamily: "Spectral, ui-serif, Georgia, serif"
    fontSize: "clamp(2.25rem, 5vw, 3.375rem)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  wordmark:
    fontFamily: "Spectral, ui-serif, Georgia, serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
  citation:
    fontFamily: "Spectral, ui-serif, Georgia, serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 1.6vw, 1.1875rem)"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  sm: "3px"
spacing:
  xs: "0.4rem"
  sm: "0.9rem"
  md: "1.5rem"
  lg: "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "0.9rem 1.75rem"
  button-primary-hover:
    backgroundColor: "#12191f"
---

# Design System: Redline

## Overview

**Creative North Star: "The Ledger"**

Redline's first shipped surface renders a flagged contract the way the User already reads their own invoices and statements: a plain paper ground, ruled rows, right-aligned numerals, and a totals line that closes the account. There is no dashboard chrome, no gradient hero, no card grid — the direction contract names both of these as rejected. The system is quiet by default and interrupts itself exactly once, with a single reserved color, only when a real finding exists.

The pairing of an italic display serif (Spectral) for headline and citation text against an upright grotesque (Archivo, with tabular lining figures) for structural and UI text mirrors the product's own claim: the document's language is quoted verbatim (serif, italic, in quotation marks) while the tool's own analysis is typeset as data (sans, tabular). This is a legibility device, not decoration — it lets a reader tell "what the contract says" from "what Redline concluded" at a glance, without a label.

Confirmed visual rejections: no hero-gradient card grid ("generic AI legal report" look), no alarmist red-pen treatment, and no color-coded severity system — tier state is carried by ink weight and rule pattern, never hue, except for the single reserved Flag red.

**Key Characteristics:**
- Paper-and-ink ledger, not a SaaS dashboard
- One reserved accent color, spent only on an actual finding
- Serif-quoted source text vs. sans-set structural/UI text as the core legibility split
- Tabular numerals and ruled dividers standing in for grid lines
- Flat, borderless surfaces — depth comes from rule weight, not shadow

## Colors

A four-color, restrained palette: a warm off-white ground, a near-black ink, a cool slate for structure, and one reserved rust-red spent only on an actual finding.

### Primary
- **Flag** (#B3452E): reserved exclusively for an actual top-tier severity finding (`.tierTop` text color) and its selection/highlight tint (`--flag-12`, `rgba(179, 69, 46, 0.12)`, used on `::selection`). Never used for chrome, wordmark, CTA, or any decorative purpose in the shipped code.

### Neutral
- **Ink** (#1C2733): primary text color, the CTA button's fill, and the ledger's heaviest rule lines (top border of the ledger, the totals-row border, `:focus-visible` outline).
- **Ink 70%** (rgba(28, 39, 51, 0.7)): secondary body text — the subhead and the quoted citation text sit here, one step back from full-strength ink.
- **Paper** (#F7F4EE): the page background and the CTA button's text color. A warm off-white, not clinical white.
- **Slate** (#5B6572): the ledger column labels, tier-neutral ("Cite-only") text, footer notes, and the scrollbar thumb.
- **Slate 30%** (rgba(91, 101, 114, 0.3)): scrollbar thumb tint.
- **Slate 18%** (rgba(91, 101, 114, 0.18)): the ledger's lighter row and header dividers — one step lighter than the ink-based structural rules.

### Named Rules
**The One Flag Rule.** Flag red (#B3452E) appears only on an actual top-tier severity finding and its selection tint. It never brands, decorates, or labels chrome — if it appears, something was found.

**The Two-Weight Rule.** Structural rules come in exactly two strengths: full ink (#1C2733) for section boundaries (ledger top, totals row) and slate-18% for internal row dividers. State and hierarchy are read from which rule weight is used, never from added color.

## Typography

**Display Font:** Spectral (with ui-serif, Georgia, serif fallback)
**Body Font:** Archivo (with ui-sans-serif, system-ui, sans-serif fallback)

**Character:** An italic serif for anything that is either the product's voice-of-record (headline, wordmark) or a direct quotation from the User's document, set against an upright grotesque with tabular figures for everything structural or numeric. The split is functional: serif-italic marks "quoted or declarative," sans marks "structured or computed."

### Hierarchy
- **Display** (500, `clamp(2.25rem, 5vw, 3.375rem)`, line-height 1.05, letter-spacing -0.02em, italic): the hero headline only, capped at 14ch.
- **Wordmark** (600, 1.375rem, italic, letter-spacing -0.01em): the "Redline" mark in the topbar and footer.
- **Body** (400, `clamp(1.0625rem, 1.6vw, 1.1875rem)`, line-height 1.55): the subhead, capped at 42ch.
- **Citation** (400, 0.9375rem, italic, line-height 1.5, quotes rendered via CSS `open-quote`/`close-quote`): the exact source sentence inside a flagged row — always Spectral italic, always quoted, never paraphrased into sans.
- **Label** (600, 0.75rem, letter-spacing 0.08em, uppercase, Archivo): the ledger column headers (Clause / Exposure / Tier).
- **Clause name** (600, inherited body size, Archivo): the flagged clause title, upright and bold to read as a computed label rather than quoted text.

### Named Rules
**The Quote-Is-Serif Rule.** Any text that is a direct quotation from the User's own document is set in Spectral italic with true quotation marks. Any text that is Redline's own structural or computed output (labels, tier, exposure, totals) is set in Archivo upright with tabular figures. The two never swap roles.

## Layout

Single-column, left-aligned composition capped at a 46rem content width (`max-width: 46rem` on both the hero and the ledger), centered on the page via flex, with fluid edge padding (`clamp(1.25rem, 5vw, 4rem)`). The ledger's own grid is three columns (`minmax(0,1fr) auto auto`: Clause / Exposure / Tier) with a fixed 1.5rem gap, right-aligning the two numeric/status columns against the left-aligned clause column.

Vertical rhythm is set by the ledger's own rule lines rather than card gutters: a full-ink top border opens the ledger, slate-18% dividers separate each row, and a full-ink border closes the totals row — the same register as a paper invoice. Rows animate in with a 6px settle-and-fade (`cubic-bezier(0.16, 1, 0.3, 1)`, 0.6s), staggered 0.12s per row, respecting `prefers-reduced-motion`.

At the 640px breakpoint the three-column ledger grid collapses to a single column: the Exposure and Tier column headers hide, and their values gain inline `"Exposure: "` / `"Tier: "` prefixes (slate, non-bold) so the row stays legible without the grid.

## Elevation & Depth

Flat. There is no shadow anywhere in the shipped stylesheet — no `box-shadow` on the ledger, the CTA, or any row. Depth and hierarchy are conveyed entirely by rule weight (full ink vs. slate-18%) and by type weight, consistent with the direction contract's ledger/invoice metaphor: paper doesn't cast shadows on itself.

### Named Rules
**The No-Shadow Rule.** Hierarchy is drawn with rule lines and weight, never elevation. If a future component reaches for `box-shadow`, that is a break from the shipped system, not an extension of it.

## Shapes

Almost square. The only rounded corner in the shipped code is the primary CTA button (`border-radius: 3px`) — a near-imperceptible softening, not a rounded-card language. Everything else (ledger, rows, wordmark, footer) is unrounded and rule-bound rather than boxed: structure comes from 1px borders (`--ink`, `--slate-18`) on ledger rows and section boundaries, never from a bordered container or card shell.

## Components

### Buttons
- **Shape:** near-square (3px radius).
- **Primary:** ink background (#1C2733) on paper text (#F7F4EE), 1px ink border, padding `0.9rem 1.75rem`, 600 weight, no icon.
- **Hover:** background steps to a near-black `#12191F`, transition `background-color 0.2s ease`.
- **Active:** 1px downward press (`translateY(1px)`), transition `transform 0.2s ease`.
- There is no secondary or ghost button variant in the shipped code — only the single primary CTA ("Try it on a document") exists.

### Ledger Row (signature component)
The shipped system's defining pattern, not a generic list item. Each row is a three-column grid (clause name + quoted citation / exposure / tier), separated by a slate-18% rule, settling into place on load with a staggered fade-and-rise. The clause name is upright Archivo bold; the citation beneath it is italic Spectral in true quotation marks; exposure and tier are right-aligned tabular Archivo. Tier state reads by color only for the reserved Flag red top tier — middle tier is full ink, cite-only is slate — and by weight/position, never by badge or pill shape.

### Footer
- **Style:** a single slate-18% top rule separates it from the page; two lines of slate 0.8125rem text (the wordmark repeated, and a one-line scope disclaimer) laid out in a wrapping flex row with `justify-content: space-between`.
- No links, icons, or additional chrome — the footer exists to restate the wordmark and one disclaimer line, nothing else.

## Do's and Don'ts

### Do:
- **Do** reserve Flag red (#B3452E) for an actual severity finding only — never for chrome, branding, or emphasis without a finding behind it.
- **Do** set any direct quotation from the User's document in Spectral italic with true quotation marks; keep Redline's own structural/computed text in upright Archivo with tabular figures.
- **Do** draw hierarchy and state with rule weight (full ink vs. slate-18%) rather than added color or shadow.
- **Do** keep the content column capped near 46rem and left-aligned; this is an invoice register, not a centered marketing hero.

### Don't:
- **Don't** introduce a hero-gradient card grid or dashboard-tile layout — the direction contract explicitly rejects the "generic AI legal report" look this would produce.
- **Don't** color-code severity tiers beyond the single reserved Flag red for top tier; middle and cite-only tiers are ink and slate, not a traffic-light system.
- **Don't** add box-shadow to any surface — this system is flat by evidence, not by omission.
- **Don't** round corners beyond the CTA's 3px; the ledger, rows, and footer are unrounded and rule-bound.
