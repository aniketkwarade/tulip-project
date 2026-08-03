# TULIP macOS Liquid Glass slice

## Flow and concise plan

The migrated slice is the high-traffic exploration loop: filter or search the climate network, select a node, inspect its urgency and relationships, then follow the strongest evidence-backed connection.

1. Replace the custom filter gallery, footer navigation, and search field with a native `NavigationSplitView` sidebar, toolbar search, and toolbar actions.
2. Keep the network, relationship lines, urgency visualization, evidence prose, and source metadata as plain content.
3. Replace the custom blurred journey capsule and trail prompt with a grouped Liquid Glass action surface on macOS 26.
4. Preserve the same flow on macOS 14–25 with system material and bordered button styles.

## Audit

| Existing web surface | Audit decision | macOS migration |
| --- | --- | --- |
| Opaque black app background | Keep for the network canvas only | Plain gradient canvas behind the data visualization |
| Filled filter chips | Native chrome | Sidebar `List` selection with system labels |
| Underlined custom search and filled results panel | Native chrome | `.searchable` on the full `NavigationSplitView` |
| Blurred journey capsule | Native/custom glass chrome | Toolbar back action plus grouped trail glass |
| Blurred history popover | Native transient UI | Removed from the slice; path state is represented by Back and visited marks |
| Custom layout toggle and legend pills | Native controls / plain key | Layout toggle omitted; legend remains plain content |
| Custom hero and branch buttons | Interactive chrome | Native `.glassProminent` primary action with semantic tint |
| Opaque inspector card stack | Reading content | Plain scroll content separated by `Divider` |
| Custom urgency and status chips | Data content | Native `ProgressView`, text, and semantic tint |
| Custom overlay sheets and footer bar | System structure | Not duplicated in this slice; future sheets should use native sheet presentation |

The trail surface and its native primary action share one `GlassEffectContainer`, use the same rounded-rectangle geometry, and apply the custom `glassEffect` after sizing and padding. The button relies on native glass interaction instead of manually adding `.interactive()`. There is no `glassEffectID` or namespace because this slice changes selection in place; no genuine collapsed-to-expanded morph would improve comprehension.

## Availability behavior

- macOS 26+: `GlassEffectContainer`, `glassEffect`, `.buttonStyle(.glass)`, `.buttonStyle(.glassProminent)`, and `ToolbarSpacer`.
- macOS 14–25: native `NavigationSplitView`, sidebar, toolbar, and search remain; the trail surface uses `.regularMaterial` with `.borderedProminent`, and toolbar buttons use their standard styles.
