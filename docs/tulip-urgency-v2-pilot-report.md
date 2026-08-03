# TULIP Urgency v2 — Original 12-Node Pilot

Status: **shadow review**. Production scores have not been replaced.

| V2 rank | Node | Legacy | V2 | Delta | Band change | Rank change | Method |
|---:|---|---:|---:|---:|---|---:|---|
| 1 | Agricultural Demand | 7.0 | 9.3 | +2.3 | unchanged | +8 | `impact_fallback` |
| 2 | Resource Depletion | 7.1 | 8.5 | +1.4 | unchanged | +6 | `impact_fallback` |
| 3 | Industry Farming | 8.6 | 8.2 | -0.4 | unchanged | -1 | `impact_fallback` |
| 4 | Fast Fashion | 7.2 | 8.1 | +0.9 | unchanged | +2 | `impact_fallback` |
| 5 | Personal Conveyance | 6.6 | 7.9 | +1.3 | Rising → Critical | +6 | `impact_fallback` |
| 6 | Deforestation | 8.7 | 7.7 | -1.0 | unchanged | -5 | `impact_fallback` |
| 7 | Methane Emissions | 7.4 | 7.6 | +0.2 | unchanged | -2 | `current_data` |
| 8 | Urbanization | 7.0 | 7.6 | +0.6 | unchanged | +2 | `impact_fallback` |
| 9 | Migration | 5.0 | 7.6 | +2.6 | Rising → Critical | +3 | `impact_fallback` |
| 10 | Carbon Emission | 8.2 | 7.6 | -0.6 | unchanged | -7 | `current_data` |
| 11 | Global Temperature | 7.7 | 7.3 | -0.4 | unchanged | -7 | `current_data` |
| 12 | Compound Climate Hazards | 7.2 | 6.2 | -1.0 | Critical → Rising | -5 | `current_data` |

## Method coverage

- Current data: 4
- Accumulated-impact fallback: 8
- Modeled: 0

Every receipt is reproducible from its normalized components and input hash. Full receipts remain application metadata and are not presented in the node inspector.
