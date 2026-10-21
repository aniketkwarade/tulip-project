# Eight initial calibration cases

Generated from authored case dossiers. These are feasibility screens, not numerical or independent scientific assessments. Sources are candidates unless explicitly admitted through the production process.

## Compound Day-Night Heat Extremes

Stable ID: `compound_day_night_heat_extremes`. Role: hazard. Family proposal: heat. Prior evidence route: current_data.

**Screen status:** source_code_inspected_inputs_missing

**Proposed consequences:** Human: attributable health loss, retaining deaths as a source-native result until a justified conversion exists. Ecosystem: terrestrial effects of the same defined heat exposure, requiring a separate compatible model.

**Existing evidence reuse:** The study and archived implementation are relevant to the human-impact pathway. The current catalogue's heat-threshold observations remain exposure evidence.

**Candidate sources:**

- [Wu et al. (2025), European compound-heat mortality](https://doi.org/10.1038/s41467-025-62871-y)
- [Versioned model-code archive](https://zenodo.org/records/15747164)
- [Linked historical Humidex data](https://zenodo.org/records/15747415)

**Still needed:**

- Annual 2027–2036 mortality results or the fitted models, future climate tables and population inputs needed to reproduce them
- Authoritative run order, ensemble/configuration, variable meanings and uncertainty output
- A reviewed way to extend beyond the study's European geography, or a separately scoped regional research case
- An ecosystem consequence model with compatible heat definition and context
- Common health/ecosystem calibrations and independent review

**Main pitfall:** Extreme-heat days are not deaths or ecosystem loss. Combining total heat mortality with its compound-heat subset would double count. European outputs cannot supply a global total.

**Next action:** Use the source audit and Draft C to obtain precise missing projection files; reproduce a regional human component before attempting any global combined rating.

**Acceptance:** Reproduce a published model result; retain per-year, region and ensemble outputs; independently verify the counterfactual, attribution and both domains before admission.

## Heat-Related Mortality Burden

Stable ID: `heat_related_mortality_burden`. Role: terminal_human_outcome. Family proposal: heat. Prior evidence route: impact_fallback.

**Screen status:** construct_decision_required

**Proposed consequences:** Human: heat-attributable deaths or healthy-life loss with a declared timing convention. Ecosystem: applicability unresolved because this node names a human outcome.

**Existing evidence reuse:** Current Lancet Countdown-linked evidence can inform observed health burden; prospective compatibility still needs examination.

**Candidate sources:**

- [Wu et al. (2025), candidate regional mortality model](https://doi.org/10.1038/s41467-025-62871-y)

**Still needed:**

- An agreed definition of what an ecosystem component means for a mortality endpoint
- Compatible global future human results for the fixed assessment window
- Health calibration, attribution and uncertainty

**Main pitfall:** Copying the parent heat node's ecosystem harm into a mortality outcome changes the meaning of this node. Setting ecosystem harm to zero because it is unreported understates harm and evades the missing-data rule.

**Next action:** Resolve decision D2 with reviewers. Retain this as an explicit hard case even if it reveals that the all-issue-node scoring specification needs revision.

**Acceptance:** A documented eligibility decision and a scientifically meaningful two-domain interpretation, or an explicit exception proposal for the product owner.

## Coral Bleaching

Stable ID: `coral_bleaching`. Role: ecological_hazard_and_condition. Family proposal: reef. Prior evidence route: current_data.

**Screen status:** candidate_projection_screened

**Proposed consequences:** Ecosystem: loss of reef condition over reef area and recovery time. Human: attributable loss of protection, food or livelihoods, with overlap checks.

**Existing evidence reuse:** Existing NOAA observations describe thermal stress and bleaching. The 2025 study offers a candidate future risk pathway to investigate, not an already calibrated TULIP loss estimate.

**Candidate sources:**

- [Global coral genomic vulnerability explains recent reef losses (2025)](https://doi.org/10.1038/s41467-025-67616-5)
- [Systematic review of uncertainty of coral reef futures (2024)](https://doi.org/10.1038/s41467-024-46255-2)

**Still needed:**

- Actual annual SSP2-4.5 inputs for 2027–2036 with spatial coverage and license
- Validated mapping from stress/vulnerability to condition loss, reef area and recovery
- Linked human consequences attributable to the same reef changes
- A shared ecological scale comparable beyond reefs

**Main pitfall:** Bleaching is not automatically permanent reef death. Thermal exposure, genomic vulnerability and ecological loss cannot be exchanged one for one. Ecosystem services valued for people must not be counted twice as human welfare.

**Next action:** Have an ecological reviewer identify which reef-loss/recovery model and underlying annual data can convert the candidate exposure into consequences.

**Acceptance:** Both domains use the same reef-change scenario, with recovery and irreversibility documented and independently reviewed.

## Coastal Inundation Risk

Stable ID: `coastal_inundation_risk`. Role: hazard. Family proposal: coastal_flooding. Prior evidence route: impact_fallback.

**Screen status:** candidate_projection_scope_mismatch

**Proposed consequences:** Human: attributable health and essential-service losses. Ecosystem: habitat-condition loss and recovery under the same water-level and protection assumptions.

**Existing evidence reuse:** The study is a candidate for connecting physical flooding to multiple consequences. Its regional scope and reported future horizons do not by themselves match the global ten-year policy.

**Candidate sources:**

- [Coastal flood impacts and lost ecosystem services along Europe's outermost regions and overseas countries and territories (2025)](https://doi.org/10.1038/s41467-025-66391-7)

**Still needed:**

- Annual 2027–2036 losses rather than treating a 2050 or later snapshot as the requested period
- Global geographic coverage or compatible regional aggregation
- Explicit protection/adaptation, population and baseline assumptions
- Separation of ecological condition from the monetary value of services to people

**Main pitfall:** People exposed are not equivalent to deaths; monetary damage is not ecosystem condition. A present-value total is not an undiscounted annual physical loss.

**Next action:** Obtain the model's annual outputs and endpoint dictionary; screen whether both consequence domains can be extracted on the required basis.

**Acceptance:** A compatible annual consequence ledger with no population or habitat double counting, plus reviewed conversions and global coverage.

## Drought Persistence

Stable ID: `drought_persistence`. Role: hazard. Family proposal: water_and_drought. Prior evidence route: impact_fallback.

**Screen status:** model_and_scenario_search_required

**Proposed consequences:** Human: water-service deprivation and health consequences with overlap removed. Ecosystem: condition loss in affected terrestrial/freshwater systems over time.

**Existing evidence reuse:** The existing UNDRR-linked evidence informs drought context. ISIMIP is a candidate source of sector-consistent modeling, not a verified matching projection for this node.

**Candidate sources:**

- [ISIMIP3 experiment and sector protocol](https://protocol.isimip.org/)

**Still needed:**

- A confirmed SSP2-4.5 model/data product with future socioeconomic assumptions
- A link between meteorological drought duration and actual water/health/ecosystem loss
- Annual regional results and a declared aggregation to global scope
- Reviewed adaptation and recovery assumptions

**Main pitfall:** The default ISIMIP3b Group II scenarios do not include SSP2-4.5. Interpolating other pathways without model validation would change the evidence claim. Drought duration alone does not measure damage.

**Next action:** Check actual sector/model dataset manifests before acquisition; reject mismatching experiment configurations instead of relabeling them.

**Acceptance:** A verified matching model run and compatible consequences, with a documented connection between rainfall deficit and resulting losses.

## Biodiversity Intactness Loss

Stable ID: `biodiversity_intactness_loss`. Role: ecological_outcome. Family proposal: biodiversity. Prior evidence route: impact_fallback.

**Screen status:** endpoint_and_attribution_review_required

**Proposed consequences:** Ecosystem: a validated change in ecological condition with geographic area and persistence. Human: separately modeled attributable effects, if meaningful for this node definition.

**Existing evidence reuse:** Current IPBES-linked context can guide source discovery. The existing metric is species-occurrence coverage, which is not itself future intactness loss. The UCL link identifies relevant expertise, not a supplied dataset.

**Candidate sources:**

- [UCL computational ecology research and model expertise](https://www.ucl.ac.uk/life-sciences/biosciences/computational-biology/computational-ecology-and-biodiversity)

**Still needed:**

- A condition-loss projection rather than counts or coverage of species observations
- Separation of climate, land-use and other causes under the agreed attribution rule
- An ecological endpoint comparable with reefs and freshwater systems
- A justified human consequence model and decision D2 for ecological endpoints

**Main pitfall:** More recorded species can reflect greater sampling effort. A change in a biodiversity indicator cannot automatically be interpreted as extinctions or human welfare loss.

**Next action:** Ask the ecology reviewer to nominate validated condition indicators and compatible future models; document what cannot be compared.

**Acceptance:** Indicator validity, spatial representativeness, attribution and cross-habitat calibration accepted by independent review.

## Global Temperature

Stable ID: `temp`. Role: upstream_physical_state. Family proposal: aggregate_climate_driver. Prior evidence route: current_data.

**Screen status:** aggregation_and_overlap_review_required

**Proposed consequences:** A reviewed set of attributable downstream terminal consequences for people and ecosystems; the temperature anomaly itself is not a loss endpoint.

**Existing evidence reuse:** The catalogue's WMO and Copernicus observations supply physical-state context. They do not estimate combined future damage.

**Candidate sources:**

- [IPCC AR6 scenario and physical-climate context](https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/)

**Still needed:**

- A compatible multi-sector impact ledger and counterfactual
- A rule for overlap between heat, drought, sea-level and other downstream harms
- Consistent adaptation, population and ecosystem assumptions
- A definition of this score's relation to its downstream nodes

**Main pitfall:** Adding downstream node scores double counts shared effects and adds transformed utilities rather than consequences. Multiplying a warming anomaly by an urgency factor does not establish projected harm.

**Next action:** Use this as an aggregation stress test after terminal endpoints are defined; do not make it an anchor merely because it is familiar.

**Acceptance:** A deduplicated consequence ledger and an explicit explanation that alternative causal views are not additive.

## Transformer Heat Failure Risk

Stable ID: `transformer_heat_failure_risk`. Role: infrastructure_failure_risk. Family proposal: essential_services. Prior evidence route: modeled.

**Screen status:** previously_modeled_route_requires_new_evidence

**Proposed consequences:** Human: attributable power-service interruption and resulting harm counted once. Ecosystem: supported consequences of the specified failure pathway, if any, rather than an assumed generic value.

**Existing evidence reuse:** The archived modeled score remains audit context only. No compatible damage-model dataset has been verified in this screen.

**Candidate sources:**

- No compatible new projection verified yet.

**Still needed:**

- Asset exposure, temperature-dependent failure model and validation data
- Repair duration, network redundancy and populations served
- Compatible global SSP2-4.5 exposure and adaptation projections
- A defensible ecosystem consequence and health/service overlap treatment

**Main pitfall:** Graph connectivity, peer scores or an expert importance label cannot supply projected failures. A power outage and illness caused by that outage can represent overlapping loss.

**Next action:** Commission a bounded infrastructure evidence search and test whether the global node is scoreable; retain this as a modeled-route challenge case.

**Acceptance:** Independent applicability review of the failure and consequence models, followed by both calibrated domain results or an explicit feasibility rejection.
