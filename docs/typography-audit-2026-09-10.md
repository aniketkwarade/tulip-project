# TULIP platform typography audit

Date: September 10, 2026

## Goal and scope

Create one coherent web typography system that feels calmer and more refined, with the My Footprint results screen as the primary failure case. The audit covers Explore, Analyse, My Footprint, Activity Impacts, the Sources overlay, and the public Privacy and Support pages at desktop and phone widths.

## Baseline evidence

The pre-change computed-style sample on the My Footprint results view found 313 rendered text elements. Of those, 204 were above Regular (`400`), and the maximum computed weight was Semibold (`600`). The issue was systemic rather than local: component CSS, inline styles, generated markup, canvas labels, and standalone public pages each had independent weight decisions.

Before captures are stored in [`artifacts/typography-audit`](../artifacts/typography-audit/), including the Footprint, Activity Impacts, Analyse, Explore, and Sources views.

## Applied system

TULIP now uses a two-role Inter Display system:

- **Display — Light (`300`)**: reserved for large page titles, hero statements, and major score/result moments.
- **All other text — Regular (`400`)**: section headings, card titles, body copy, controls, labels, tabs, statuses, numbers, links, and emphasis.

Inter Display Regular is the ceiling. Hierarchy is created with type size, spacing, contrast, casing, and placement instead of heavier font weights. Compatibility aliases still exist, but all former Medium, Semibold, Bold, and Extrabold tokens resolve to Regular so legacy components cannot escape the system.

## Audit steps and health

1. **My Footprint results — Healthy.** Removed the concentration of Medium and Semibold text across result headings, metric cards, action controls, and chart labels. Large display moments retain Light where their scale supports it.
2. **Activity Impacts — Healthy.** Normalized category labels, card headings, statistics, metadata, and controls to Regular while keeping hierarchy through scale, accent color, and layout.
3. **Analyse — Healthy.** Normalized entry prompts, options, tabs, and generated relationship content; canvas-rendered labels are also capped at Regular.
4. **Explore — Healthy.** Normalized graph labels, filters, controls, pills, and detail surfaces without changing the graph’s measured layout.
5. **Sources overlay — Healthy.** Normalized overlay titles, source cards, badges, links, and supporting metadata.
6. **Privacy and Support — Healthy.** Moved both standalone pages to Inter Display, explicitly disabled synthetic bold, and applied the same Light/Regular roles.
7. **Responsive behavior — Healthy.** The typography roles remain consistent at phone and desktop widths; responsive hierarchy continues to come from existing size and spacing rules.

## Implementation guardrails

- The Google Fonts request is limited to Inter Display Light and Regular, with Inter Light and Regular as the fallback family set used by the main document.
- Explicit CSS weights, inline HTML/JavaScript styles, SVG attributes, and canvas font strings are capped at `400`.
- The design-system contract test scans the platform styling surfaces and fails if a numeric weight above `400` returns.
- [`docs/typography-guide.md`](typography-guide.md) and [`docs/design-system.md`](design-system.md) document the same rules for future work.

## Verification boundaries

This audit includes source review, automated weight-ceiling checks, computed-style inspection, and visual review of representative desktop and phone views. It is not a complete WCAG or assistive-technology audit; contrast, zoom, screen-reader flow, and user testing should remain separate validation tracks.

The representative computed-style checks all returned a maximum weight of `400` with zero rendered text elements above the ceiling: My Footprint results (69 sampled elements), Activity Impacts (28), Analyse (14), Explore (22), Sources (45), Support (10), phone-width My Footprint (64), and phone-width Activity Impacts (23). The source contract separately covers canvas labels and inactive/generated states that are not visible in a single screenshot.

## Visual evidence

Before and after screenshots are stored in [`artifacts/typography-audit`](../artifacts/typography-audit/). The paired desktop captures use the same browser viewport; phone checks use a `390 × 844` override and confirm zero horizontal page overflow.
