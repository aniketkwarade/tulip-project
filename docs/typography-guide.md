# Typography Guide

The app now has a shared type scale in [src/style.css](/Users/aniketwarade/Work/LostPlanet/src/style.css).

## How global scaling works

- `--type-scale`: master multiplier for the whole product
- `--type-size-1` through `--type-size-6`: the only six base sizes
- `--type-step-*`: temporary compatibility aliases mapped onto those six sizes
- `--type-fluid-*`: responsive sizes for splash, modal, and hero text

If you want everything slightly larger or smaller, change `--type-scale`.

If you want one tier to change everywhere, update one of the six `--type-size-*` tokens.

## The six sizes

- `--type-size-1` (`12px`): the new minimum size for micro labels, tiny badges, and metadata
- `--type-size-2` (`14px`): compact body copy, controls, and dense UI text
- `--type-size-3` (`16px`): default readable body copy
- `--type-size-4` (`18px`): lead copy and emphasized body text
- `--type-size-5` (`24px`): section titles and utility display text
- `--type-size-6` (`40px`): display scale foundation for scores and large headings

## Practical mapping

- Caption / micro UI: `--type-size-1`
- Labels / pills / metadata: `--type-size-1` or `--type-size-2`
- Dense body / controls: `--type-size-2`
- Standard body: `--type-size-3`
- Section title / lead: `--type-size-4` or `--type-size-5`
- Display / score / hero foundation: `--type-size-6`

## Usage rules

- Use the six `--type-size-*` tokens for new work.
- Treat `--type-step-*` as legacy aliases during migration, not new API.
- Use fluid tokens only for large responsive headings.
- Avoid introducing a seventh base size unless a surface truly breaks without it.
- For new components, start with `--type-size-3` body, `--type-size-1` meta, and `--type-size-1` kicker text.
