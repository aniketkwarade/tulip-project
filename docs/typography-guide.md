# Typography Guide

The app’s shared type scale lives in [src/design-system.css](../src/design-system.css). Component and page styles consume these tokens from [src/style.css](../src/style.css).

## How the scale works

- `--type-size-1` through `--type-size-6` are the only six base sizes.
- Semantic aliases such as `--type-control`, `--type-body`, and `--type-heading` explain why a size is being used.
- Large, genuinely responsive display text may use a local `clamp()` when a fixed tier cannot preserve the composition.

If one tier needs to change everywhere, update it once in `design-system.css`.

## The six sizes

- `--type-size-1` (`12px`): the new minimum size for micro labels, tiny badges, and metadata
- `--type-size-2` (`14px`): compact body copy, controls, and dense UI text
- `--type-size-3` (`16px`): default readable body copy
- `--type-size-4` (`18px`): lead copy and emphasized body text
- `--type-size-5` (`24px`): section titles and utility display text
- `--type-size-6` (`40px`): display scale foundation for scores and large headings

## Semantic mapping

- Caption / metadata: `--type-caption`
- Labels / pills / controls: `--type-control`
- Dense body: `--type-body-compact`
- Standard body: `--type-body`
- Lead copy: `--type-lead`
- Section title: `--type-heading`
- Display / score / hero foundation: `--type-display`

## Weight hierarchy

- Supporting display: `--weight-display-supporting` (`300`, Inter Display Light)
- Secondary display: `--weight-display-secondary` (`350`), used for the major heading nested beneath a screen title
- Primary display: `--weight-display-primary` (`400`, Inter Display Regular), used for the leading title in each tab or screen
- Compatibility aliases: `--weight-display` resolves to Supporting and `--weight-display-emphasis` resolves to Secondary
- Everything else: `--weight-regular` (`400`, Inter Display Regular)
- Compatibility aliases: `--weight-title`, `--weight-ui`, and `--weight-emphasis` all resolve to Regular (`400`)

Regular is the platform ceiling. The hierarchy comes from size, spacing, contrast, casing, and placement—not heavier weight. Do not use `500`, `600`, `700`, `800`, `900`, synthetic bold, or custom intermediate values above `400`.

## Platform tab mapping

- Explore: intentionally has no persistent page title; search, filters, and the tab label remain Regular UI text.
- Analyse: “Choose a starting point” and the selected node name use Primary display.
- Activity Impacts: the selected activity name uses Primary display; its footprint-lens title uses Secondary display.
- My Footprint: “Your Annual Footprint” and “Your footprint results” both use Regular 400; the annual title remains primary through its larger scale and higher placement.
- Navigation tab labels are controls, not display headings, and remain Regular.

## Usage rules

- Prefer semantic aliases for new work.
- Use the six base tokens when defining a new semantic alias.
- Use fluid sizing only for large responsive headings.
- Avoid introducing a seventh base size unless a surface truly breaks without it.
- For new components, start with `--type-body` body copy, `--type-caption` metadata, and `--type-caption` kicker text.
- Use Supporting only for large atmospheric display roles where scale supplies enough visual authority.
- Use Secondary for a major nested display heading such as a lens title. Results headings may move to Regular when Light or 350 does not provide enough clarity, while scale and placement preserve their level.
- Use Primary for the leading title of a tab or screen.
- Use Regular for body copy, controls, labels, tabs, cards, numbers, links, statuses, and ordinary emphasis.
- If a label needs more emphasis, adjust size, contrast, spacing, or casing while keeping the weight at Regular.
