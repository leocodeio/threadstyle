# DESIGN.md

Design contract for this app. Read before any UI or styling change.
Tokens live in `app/globals.css`; this file explains why they exist.

## Brand overview

A clothing recommender for Indian college students. The catalogue is real,
cheap, and small (300 Bewakoof items). The student is in a hurry — between
classes, on hostel wifi, often on a phone.

The app should feel like advice from a well-dressed friend who works at the
store: fast, specific, honest about the trade-off. Not a fashion magazine, not
a chatbot with a personality, not a sale.

## Design thesis

**A campus noticeboard, not a lookbook.** Paper surfaces, one loud accent,
plain language, and the reasoning pinned next to the pick.

## Principles

1. The pick is the hero. Name, price, and why sit together; nothing competes.
2. One accent per screen. Marigold marks action and the top pick. Nothing else.
3. Show the trade-off. If an item is great but not warm, say so in the card.
4. No invented confidence. Unknowns are stated, not styled away.
5. Fast reads. Left-aligned, short lines, tabular numbers, no centred paragraphs.

## Colors

Light theme. Values are `oklch`; tokens are the only colours components may use.

| Name | Token | Value | Role |
|---|---|---|---|
| Paper | `--background` | `oklch(0.977 0.010 85)` | Page surface |
| Ink | `--foreground` | `oklch(0.215 0.012 70)` | Body text, borders on emphasis |
| Card | `--card` | `oklch(0.995 0.004 85)` | Recommendation cards, composer |
| Marigold | `--primary` | `oklch(0.72 0.165 68)` | Top pick, focus ring, send button |
| Ink on Marigold | `--primary-foreground` | `oklch(0.205 0.020 65)` | Text on primary only |
| Sand | `--secondary` | `oklch(0.940 0.014 85)` | Chips, quiet buttons |
| Moss wash | `--accent` | `oklch(0.930 0.035 155)` | Trade-off note background |
| Deep moss | `--accent-foreground` | `oklch(0.320 0.050 155)` | Trade-off text |
| Brick | `--destructive` | `oklch(0.550 0.190 32)` | Decline / error only |
| Rule | `--border` | `oklch(0.890 0.012 80)` | 1px dividers and card edges |
| Muted ink | `--muted-foreground` | `oklch(0.500 0.014 70)` | Metadata, captions |

Dark theme mirrors the same roles in `.dark`. Never hardcode a hex, `oklch`,
or Tailwind palette colour (`zinc-*`, `slate-*`, `purple-*`) in a component.

## Typography

Two text families plus one data mono. No third.

| Role | Family | Token |
|---|---|---|
| Display / headings | Bricolage Grotesque | `--font-heading` |
| Body / UI | Instrument Sans | `--font-sans` |
| Prices, item IDs, numbers | Geist Mono | `--font-mono` |

- H1 32/36, weight 600, tracking `-0.02em`. H2 22/28, 600. H3 17/24, 600.
- Body 15/24, 400. Small 13/20. Label 11/16, uppercase, tracking `0.08em`, 600.
- Prices always `font-mono tabular-nums`, `₹` with no space: `₹899`.
- Max line length 68ch. In conversation panels, never centre a paragraph longer
  than one line.

## Spacing and composition

- 4px scale. Default gaps: 8, 12, 16, 24, 32.
- Conversation surfaces use a single column, 720px content width (768px
  including 24px gutters), 32px top/bottom breathing room.
- Catalogue surfaces use `max-width: 1180px` and the grid below.
- Radius: `--radius: 6px` for cards, inputs, buttons. Badges 4px. No pills except status dots.
- Shadows: none by default. `shadow-stamp` (`2px 2px 0` Ink) on the top-pick card only.
- Borders carry structure, not shadows. 1px Rule; 3px Marigold left rule on the top pick.
- Vertical rhythm inside a card: label → name+price → why → trade-off, 8px apart.

## Components

**Marketplace** — the catalogue page is a wider noticeboard: 1180px canvas,
20px gutters on phones, 32px above `sm`. Hero is a 720px centred column.
Eyebrow, H1, short subcopy, search and category chips are centred; this is
the only centred text block in the product. Search is 56px tall, `--card`,
1px Rule, 6px radius, 560px max, icon left, `Clear` right, Marigold focus ring.
Category chips are 32px, 4px radius, Sand by default and Marigold when active.

**Ask page** — 720px content column (768px including 24px gutters), 32px top.
Eyebrow, H1 32/36,
one short subcopy, then four example prompts as left-aligned text buttons with
a 1px Rule. The composer is sticky at the bottom. A response replaces the
previous one; there is no transcript. Recommendation cards are text-first and
carry no image — the shop is one click away for browsing. Clarify, decline,
no-match, and error use the state block.

**Shop chat** — a floating `Ask the stylist` button at the bottom-right of the
shop: 44px, 6px radius, Marigold, 20px from the edges. It opens a 420px panel
(max 75vh) above the button, `--card`, 1px Rule, no backdrop and no shadow.
The header is `Thread stylist` + `Close`; the body shows the request bubble, a
compact result, and three examples when empty. The compact composer uses 9px
controls. Same rules and cards as the Ask page.

**Explainer** — `How it works` uses the 720px content column. One marigold
left rule on the short-version card; vertical numbered steps, a two-column
`We use / We do not use` block, and a bordered eval card. No feature grid, no
new colour.

**Product card** — `--card`, 1px Rule, 6px radius, 4:5 image on Sand, 12px
padding. Category label + rating row, name 13/18 medium clamped to two lines,
`colour · fabric` 11/16 muted, price 14 mono semibold, MRP strike 11, discount
10. Grid is 4 columns at `lg`, 3 at `sm`, 2 on phones; 48 cards, then `Load
more`. Hover: border Ink and `translateY(-4px)`, 150ms. No shadow, no image
zoom. Every card opens the real Bewakoof page in a new tab.

**Recommendation card** — `--card` surface, 1px Rule, 6px radius, 16px padding.
Top pick adds a 3px Marigold left rule and a `TOP PICK` label. Name 17/24 600;
price on the same row, right-aligned, mono. Why text 15/24, max 40 words.
Trade-off sits in a Moss wash strip, 12px padding, 4px radius, prefixed
`Trade-off —`. Never hide it behind a tooltip or hover.

**Composer** — pinned to the bottom, `--card` surface, 1px Rule, 12px padding.
Textarea grows to 4 lines. Send button is Marigold, square-ish 6px radius,
44px minimum. Disabled while a request is in flight.

**State block** — decline, clarify, no-match. No card. A 1px top rule, 11px
uppercase label (`CAN'T HELP` / `NEED ONE THING` / `NOTHING IN BUDGET`), then
one short paragraph. Brick label only for decline.

**Catalogue chip** — Sand background, 4px radius, 13px text. Category, colour,
or tag. Max three per card; drop the least useful.

**Empty state** — four example prompts as text buttons, left-aligned, 1px Rule,
no icons.

## Motion

- 150ms, `cubic-bezier(0.2, 0, 0, 1)`. Opacity + `translateY(4px)` only.
- Cards enter with a 30ms stagger, max 3 items. No bounce, no spring, no scale.
- Typing indicator is three 4px dots, 600ms loop, opacity only.
- `prefers-reduced-motion: reduce` removes all transforms and staggers; state changes are instant.

## Dos

- Left-align everything except prices in a row.
- Use one accent per viewport.
- Keep the trade-off visible in the card.
- Use real catalogue facts; if a field is blank, omit it, don't guess.
- Preserve focus rings: 2px Marigold, 2px offset.

## Don'ts

- No gradients, glass, blur, glow, or "AI" purple.
- No emoji in UI chrome.
- No body-shape, attractiveness, or "look slim" language.
- No countdowns, stock scarcity, or fake urgency.
- No centred paragraphs in conversation panels. The catalogue hero is the one
  centred exception.
- No 3-column feature grid.
- No more than two text families plus the data mono.
- No hardcoded colours or dark-mode-inverted images.
