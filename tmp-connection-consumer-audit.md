# Consumer-Facing Connection Audit

Generated: 2026-07-16T05:08:11.506Z
Graph profile: node_expansion
Total nodes: 522
Total edges: 1519

## Recommended Actions

- Keep: 15 (1.0%)
- Soften: 226 (14.9%)
- Rewrite: 0 (0.0%)
- Hide: 0 (0.0%)
- Label hypothesis: 57 (3.8%)

## Mode Summary

| Mode | Count | Recommended handling |
| --- | ---: | --- |
| curated_edge_reference | 241 | Keep only direct/high edges as-is; soften the rest |
| family_calibrated_reference | 0 | Rewrite explanation layer; current boilerplate is not consumer-facing |
| curated_anchor_inference | 0 | Hide from user-facing causality until edge-specific support exists |
| anchor_context_reference | 57 | Keep discoverable with explicit hypothesis labeling |

## Why

- `curated_edge_reference` is the only bucket with dedicated edge-level support, but many remaining items are still indirect or medium-confidence and should not read like simple hard-causal facts.
- `family_calibrated_reference` is defensible at the family level, but the current mechanism text is technical boilerplate like "connected through the water systems family topology."
- `curated_anchor_inference` still tells the user a direct-sounding story even though the code itself says those edges should be promoted later if dedicated citations are added.

## Keep Samples

| Edge | Why it can stay |
| --- | --- |
| Atmospheric Moisture Amplification intensifies Wet-Bulb Heat (+0.64) |  |
| Atmospheric Moisture Amplification raises Public Health Heat Burden (+0.58) |  |
| Atmospheric Evaporative Demand increases Crop Yield Volatility (+0.56) |  |
| PM2.5 Particulates drives Smoke Exposure Burden (+0.68) |  |
| Black Carbon Deposition darkens Black Carbon Darkening of Snow (+0.72) |  |
| Tropospheric Ozone increases Crop Yield Volatility (+0.56) |  |
| Global Temperature increases Compound Day-Night Heat Extremes (+0.66) |  |
| Compound Day-Night Heat Extremes raises Public Health Heat Burden (+0.67) |  |
| Compound Day-Night Heat Extremes increases Heatwave Excess Mortality Rates (+0.69) |  |
| Global Temperature increases Nocturnal Heat Stress (+0.61) |  |
| Nocturnal Heat Stress raises Public Health Heat Burden (+0.62) |  |
| Nocturnal Heat Stress increases Heatwave Excess Mortality Rates (+0.64) |  |

## Soften Samples

| Edge | Why soften |
| --- | --- |
| Methane Emissions warms Global Temperature (+0.85) |  |
| Global Temperature intensifies El Niño (+0.5) |  |
| El Niño amplifies Environ. Anomalies (+0.7) |  |
| La Niña reorganizes Environ. Anomalies (+0.72) |  |
| Wet-Bulb Heat displaces Migration (+0.58) |  |
| Wet-Bulb Heat spikes Grid Peak Load Stress (+0.57) |  |
| Monsoon Volatility disrupts Industry Farming (+0.67) |  |
| Permafrost Thaw releases Methane Emissions (+0.79) |  |
| Semiconductor Fabs competes for Cooling Water Competition (+0.58) |  |
| Aviation Demand Growth adds to Carbon Emission (+0.48) |  |
| Shift in Snowmelt Timing reshapes Hydrological Runoff Surges (+0.54) |  |
| Hydrological Runoff Surges raises risk for Bridge Scour Exposure (+0.58) |  |

## Rewrite Samples

| Edge | Why rewrite |
| --- | --- |

## Hide Samples

| Edge | Why hide |
| --- | --- |
