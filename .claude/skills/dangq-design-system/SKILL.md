---
name: dangq-design-system
description: DANGQ (댕큐) brand and design-system source of truth for this repo. Use for any UI, layout, styling, copy-tone or asset work in app/ and the site, before applying the generic taste/redesign skills.
---

# DANGQ design system (precedence layer)

This repo already has a brand and tokens. Generic design skills (`design-taste-frontend`, `redesign-existing-projects`) supply *judgement*; this skill supplies the *facts*. When they conflict, this skill wins.

## Sources of truth, in order

1. `outputs/04_brand/tokens.json` and `app/src/styles/tokens.css` — colors, type, spacing, radius, motion. Use the CSS variables; do not introduce new hex values or fonts.
2. `outputs/04_brand/brand-guide.md` — brand rules and voice. Read it before changing copy or visuals.
3. `app/src/hifi/ui/kit.tsx` and `app/src/styles/components.css` — existing components. Reuse before creating new ones.
4. `outputs/09_figma/README.md` — Figma design system file and its limits.

## How the taste skills apply here

- Use their *anti-generic* checks (hierarchy, spacing rhythm, motion restraint, no template look) as a review pass over work that follows the tokens above.
- Ignore their default fonts, palettes, dial baselines and `npx shadcn` setup suggestions. The brand fonts and palette are fixed by the tokens.
- Ignore their placeholder-photo suggestions (picsum etc.). Use `app/public/brand/` assets and `outputs/10_hifi/photo-sources.md`.
- Accessibility contrast notes in `tokens.css` comments are binding.

## When something is missing

If a needed token, component or rule does not exist, say so and propose the addition. Do not invent one silently.
