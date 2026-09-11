# TULIP Design System

This is TULIP’s code-first design system. It gives every future UI change the same visual logic without requiring Figma.

## Source of truth

- [Design tokens and primitives](../src/design-system.css): reusable decisions such as color, type, spacing, radii, control sizes, motion, shadows, and stacking layers.
- [Product composition](../src/style.css): page layouts, component-specific composition, responsive exceptions, and one-off visualization rules.
- [Typography guide](typography-guide.md): the approved type scale and usage map.
- [Design-system contract test](../scripts/test-design-system.mjs): prevents core tokens from drifting back into page CSS.

`src/main.js` must import `design-system.css` before `style.css`. Product CSS is allowed to consume and locally override a token, but the global value stays in the design-system file.

## The logic

Use this order when styling anything:

1. Start with a semantic token, such as `--text-secondary` or `--surface-panel`.
2. Use a scale token for size, such as `--space-md`, `--radius-xl`, or `--type-body`.
3. Use an existing primitive or component pattern.
4. Add a component-specific token only when a value has a stable meaning that the existing scale cannot express.
5. Add a raw value only for measured geometry that belongs to one visualization or layout.

Do not add a raw color, radius, shadow, or type size to a new component. If the right value does not exist, add a named token first and explain its purpose in this guide.

## Foundations

### Color

- Canvas: `--surface-canvas`
- Reading background: `--surface-reading`
- Standard panel: `--surface-panel`
- Raised panel: `--surface-panel-raised`
- Control surface: `--surface-control`
- Primary text: `--text-primary`
- Supporting text: `--text-secondary`
- Muted text: `--text-muted` or `--text-subtle`
- Brand/action accent: `--accent-color`
- Focus: `--focus-ring-color`

Color names describe purpose, not a screen. A panel should not introduce `--analyse-panel-grey`; it should use the shared panel token unless it genuinely represents a new material.

### Typography

There are six base sizes: 12, 14, 16, 18, 24, and 40 px. Use the semantic aliases:

- `--type-caption` and `--type-control`
- `--type-body-compact` and `--type-body`
- `--type-lead`
- `--type-heading`
- `--type-display`

Use `--tracking-label` for compact interface labels and `--tracking-kicker` for uppercase section kickers. Avoid uppercase body copy.

The shared weight system has two roles:

- `--weight-display-supporting` / `--weight-display` / `--weight-light` (`300`): atmospheric display text and large supporting statements
- `--weight-display-secondary` / `--weight-display-emphasis` (`350`): major nested headings such as results and lens titles
- `--weight-display-primary` (`400`): the leading title for each tab or screen
- `--weight-regular` (`400`): every other text role, including section headings, editorial titles, controls, labels, tabs, card titles, numbers, links, statuses, and emphasis

Inter Display Regular is the platform ceiling. The semantic and legacy aliases (`--weight-title`, `--weight-ui`, `--weight-emphasis`, `--weight-medium`, `--weight-semibold`, `--weight-bold`, and `--weight-extrabold`) all resolve to `400` so older components stay inside the system. Use scale, spacing, contrast, casing, and placement—not weight above Regular—to establish hierarchy.

### Spacing

The fixed scale is 4, 8, 12, 16, 24, 32, 40, and 56 px. Use it inside components. Use the fluid `--space-section`, `--space-panel`, and `--space-card` tokens for responsive outer spacing.

Measured exceptions such as a graph axis position may remain local. General UI spacing should not.

### Shape

- Small utility: `--radius-sm`
- Standard control/card: `--radius-md` to `--radius-xl`
- Large grouped surface: `--radius-2xl`
- Capsule/pill: `--radius-pill`

Do not create near-duplicate radii for components that serve the same role.

### Motion

- Quick feedback: `--motion-fast`
- View or panel transition: `--motion-medium`
- Standard easing: `--motion-standard`
- Expressive, restrained spring: `--motion-spring`

Every new transition must still make sense when reduced motion is enabled.

## Reusable primitives

New UI can opt into these classes without inheriting a page-specific layout:

- `.ds-stack`: vertical flow with a configurable `--ds-stack-gap`
- `.ds-cluster`: wrapping horizontal group with a configurable `--ds-cluster-gap`
- `.ds-card`: standard panel surface
- `.ds-button`: neutral capsule action
- `.ds-pill`: compact capsule selection/action
- `.ds-field`: standard form field surface
- `.ds-kicker`: uppercase section label
- `.ds-heading`: section heading
- `.ds-body`: standard readable text

Existing TULIP components do not need to be renamed all at once. Migrate their internal values to tokens when they are next touched.

## Component rules

### Buttons and pills

- Minimum height comes from `--control-height-*`.
- Horizontal padding comes from `--control-padding-inline`.
- Use one leading icon at most unless the action is a segmented control.
- Hover changes surface or border; active state may compress slightly; focus always uses a visible ring.
- Labels should describe the result, not the implementation.

### Cards and panels

- Use a single surface per conceptual group.
- Reading content inside a card should not become a second decorative card without a new hierarchy reason.
- Standard content padding is `--space-card`.
- Reserve stronger borders and shadows for overlays and interactive groups.

### Form controls

- Standard height is `--control-height-md`.
- Field copy uses `--type-control` and `--text-control`.
- Disabled state must remain readable and visibly inactive.
- Placeholder text must not be the only label when the field’s meaning would become ambiguous.

### Headings

- A view has one dominant heading.
- Section kickers are optional; they should add orientation, not repeat the heading.
- Preserve the established left alignment shared by Analyse, Activity Impacts, and My Footprint.

## Responsive rules

Desktop is content-led; mobile is touch-led. They share tokens but may use different composition.

- Keep touch targets at least 44 CSS px on phone unless a platform-owned dock pattern has a verified exception.
- Use safe-area variables for fixed phone chrome.
- Do not let a desktop spacing fix leak into the phone breakpoint.
- Prefer reflow over horizontal shrinking for reading content.
- Verify at one wide desktop size, one compact desktop/tablet size, and one phone size.

## Update workflow

When changing the UI:

1. Find the closest existing component and reuse its pattern.
2. Check `design-system.css` before adding a value.
3. Keep global tokens semantic; keep visualization geometry local.
4. Test default, hover/focus, selected/open, disabled, and empty states when relevant.
5. Run `npm run test:design-system` and `npm run test:experience`.
6. Visually verify desktop and phone before publishing.

If a change needs a new foundation decision, update the token, this guide, and the contract test together.

## Migration status

The first system pass now owns:

- Global color and surface tokens
- Typography scale and weights
- Spacing and radius scales
- Control sizing
- Glass materials and shadows
- Motion and layer tokens
- Scrollbar tokens
- Reusable layout and control primitives
- Relationship picker controls
- Activity completion and footprint result actions

The remaining legacy CSS is intentionally migrated as components are touched. A wholesale rewrite would create unnecessary visual regression risk.
