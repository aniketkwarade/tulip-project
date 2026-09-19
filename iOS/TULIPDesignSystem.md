# TULIP native design system

`TULIPDesignSystem.swift` is the source of truth for the iPhone app. Product screens should compose its foundations and components instead of introducing local visual constants.

## Principles

- Clarity before decoration. Text, hierarchy, and evidence remain readable over visual effects.
- Native behavior. Use SwiftUI controls, Dynamic Type styles, semantic SF Symbols, system materials, and standard accessibility actions.
- One interaction, one response. Selection is immediate; haptics and motion confirm it without delaying navigation.
- Motion explains change. Avoid ornamental animation, preserve gesture tracking, and remove nonessential motion when Reduce Motion is enabled.
- Liquid Glass is reserved for floating navigation, pinned interactive controls, and sparse media overlays. Reading surfaces and in-flow actions remain stable and opaque.

## Foundations

### Color

Use `TULIPPalette` semantic roles:

- `background`: screen canvas
- `surface`: cards and grouped reading content
- `raisedSurface`: inspectors and sheets
- `text`, `secondaryText`, `tertiaryText`: content hierarchy
- `blue`, `lavender`, `red`, `green`: meaning and state, never the only signal

### Spacing and layout

Use `TULIPSpacing` for local gaps and `TULIPLayout` for app-level geometry. The scale is hierarchical: 4 pt for tightly related label/value pairs, 8 pt within a row, 12 pt between controls in one group, 16 pt between peer sections, 20 pt for card/page insets, and 24–40 pt only for major visual separation. The standard screen edge is 20 pt, minimum touch target is 44 pt, primary controls are at least 50 pt high, and scrollable content reserves 120 pt for the floating dock.

`check-design-system.sh` rejects numeric `spacing:` and `.padding(...)` values outside `TULIPDesignSystem.swift`. Visualization geometry may remain local, but interface rhythm must use a semantic token.

### Shape

Use `TULIPRadius.compact`, `.control`, `.card`, and `.sheet`. Use `Capsule` for selectors and compact actions. Avoid one-off corner radii.

### Typography

Use `TULIPTypography` semantic styles. These are Dynamic Type fonts; avoid fixed font sizes except brand marks, data visualizations, and deliberately fitted numeric badges.

### Icons

Use SF Symbols for content semantics and `TULIPIconography` for shared concepts. The five supplied dock assets are brand navigation icons and must not be replaced. Icons supplement text or carry an accessibility label.

Use `TULIPHaptics` for physical feedback so responses stay consistent with visual state changes. Use `selection()` for switching tabs, categories, options, and relationships; `button()` for ordinary taps; `inspector(expanding:)` for sheet state changes; `continuousTick()` for throttled direct manipulation such as rotating or zooming the globe; and `success()` only for completed outcomes. Generators are shared and prepared rather than allocated during interaction.

### Motion

Use `TULIPMotion.animation(_:reduceMotion:delay:)`:

- `quick`: direct visibility and mode feedback
- `standard`: selection and dock movement
- `deliberate`: screen/question progression
- `sheet`: inspector expansion and collapse
- `feedbackUp` / `feedbackDown`: brief tactile bounce
- `reveal`: staged data visualization reveal
- `ambient`: breathing startup mark only

Never hard-code SwiftUI durations outside the design-system file. Every custom animation must honor Reduce Motion. State changes should not wait for animation completion.

## Shared components

- `TULIPScreenHeader`: top-level native screen title and optional subtitle/trailing action
- `TULIPIconButton`: circular 44 pt icon control with accessibility label
- `TULIPSection`: stable opaque reading card with semantic section heading
- `TULIPScoreBadge`: the canonical urgency gradient treatment
- `TULIPEmptyState`: unavailable or empty content
- `TULIPGlassGroup`: the native `GlassEffectContainer` boundary for related glass controls
- `TULIPTopContentFade`: shared top-edge scrim for content scrolling beneath pinned Search and Activity regions
- `.tulipFloatingChrome(...)`: regular interactive glass for the dock and pinned controls
- `.tulipMediaOverlay(...)`: clear glass for sparse controls over the sphere or rich media
- `.tulipSelectableChrome(...)`: crisp content with glass at rest and an opaque selected fill
- `.tulipSolidControl(...)`: stable opaque treatment for in-flow choices and actions

## Material contract

1. Content surfaces use `TULIPPalette.surface` or `raisedSurface`; cards, articles, evidence, questionnaire options, and data panels are never glass.
2. Floating chrome uses regular native Liquid Glass: the dock, pinned Search controls, Activity controls, and inspector toolbar.
3. Media overlays use clear glass only when placed directly over the sphere or other rich visual content.
4. Selected states are opaque fills inside or alongside glass. The dock keeps its blue gradient selection pill; Activity uses its semantic red, green, or category color.
5. Multiple nearby glass controls must share `TULIPGlassGroup` so SwiftUI renders and morphs them as one system.

The iOS 26 path uses native Liquid Glass without an opaque background underneath it. iOS 17–18 use a material fallback. Reduce Transparency replaces all glass with `raisedSurface` and a subtle separator.

## Review checklist for new UI

1. Uses semantic tokens and a shared component where one exists.
2. Uses a 44 pt default touch target and has a VoiceOver label/hint when the visible label is insufficient.
3. Does not communicate selection or severity through color alone.
4. Supports Dynamic Type without clipping at accessibility sizes.
5. Uses a `TULIPMotion` preset and works with Reduce Motion.
6. Keeps primary content clear of the dock and safe areas.
7. Keeps reading and in-flow surfaces opaque; applies the correct semantic material role only to floating controls/navigation.
8. Adds no remote loading dependency to initial navigation or core offline content.
9. Uses `TULIPSpacing`/`TULIPLayout` instead of introducing a raw stack or padding value.
10. Uses one semantic haptic at the state-change boundary and does not double-fire feedback from nested controls.

Run `iOS/scripts/check-design-system.sh` before an archive.
