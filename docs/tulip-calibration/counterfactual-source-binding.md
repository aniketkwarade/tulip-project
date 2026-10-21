# A source burden cannot be relabeled with another baseline

27 September 2026. Internal input-rule correction; public ratings unchanged.

A harm estimate answers a comparison question: how much harm occurs under the observed conditions compared with a specified alternative? Changing that alternative changes the claim the number makes. A preindustrial reference, a minimum-risk exposure reference, and complete pollutant removal are not interchangeable definitions.

The WHO DALY endpoint validator previously required only a nonempty baseline description. The [captured v3 challenge](../../artifacts/tulip-consequence-rule-audit-2026-09-27/counterfactual-binding-v3-challenge.json) demonstrates that the same source burden was accepted under three different descriptions. No public rating was created, but the input contract could misstate what the source estimate measured.

The v4 rule binds an assessment and its copied observation to a separately registered counterfactual ID, version, and artifact digest. A node packet cannot supply a replacement baseline description. The returned explanation comes from the registered source definition. Changing both the packet and its copied observation to a new baseline still fails against the source registry. The benchmark calculator's real WHO adapter now obtains its baseline identity from that registry rather than a separately invented label.

[WHO's indicator metadata](https://www.who.int/data/gho/data/indicators/indicator-details/GHO/ambient-air-pollution-attributable-dalys) describes an alternative minimum-risk exposure baseline with other conditions unchanged. The [registered identity](../../artifacts/tulip-consequence-rule-audit-2026-09-27/who-joint-air-counterfactual-definition.json) preserves this qualitative definition. It does not claim that the numeric exposure parameters or full model have been independently reproduced. A changed baseline requires a new source or model result and a reviewed registry revision; it cannot retain the old burden merely by editing its description.

The [audit](../../artifacts/tulip-consequence-rule-audit-2026-09-27/counterfactual-binding-audit.json) records the before/after challenge and unchanged DALY inputs. The tests reject missing or changed baseline identities, versions and digests, simultaneous packet/source relabeling, and free-text overrides. Endpoint arithmetic and the experimental 9.2 health-component reading remain unchanged. This correction does not resolve ecological calibration, complete-node attribution or the people/nature combination decision, and it admits no replacement public rating.

Reproduce with `node scripts/audit-tulip-counterfactual-binding.mjs` and `node scripts/test-tulip-source-native-burden.mjs`; the burden mapping, modeled allocation and benchmark kernel tests exercise the affected adapters.
