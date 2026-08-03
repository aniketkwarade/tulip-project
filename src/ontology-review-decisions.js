const decision = (disposition, rationale, sourceLocators) => Object.freeze({
  disposition,
  rationale,
  source_locators: Object.freeze(sourceLocators.map(item => Object.freeze(item))),
  reviewed_at: '2026-07-17'
});

export const ONTOLOGY_REVIEW_DECISIONS = Object.freeze({
  thermohaline_disruption: decision(
    'merge_preserve_search_alias',
    'The disruption wording has no defined observable or threshold. IPCC treats thermohaline circulation as a conceptual and incomplete interpretation of measurable meridional overturning, so the duplicate node is retired and retained only as a search alias to the canonical Atlantic record.',
    [
      { url: 'https://www.ipcc.ch/srocc/chapter/glossary/', locator: 'IPCC states that meridional overturning is observable, is also wind-driven, and is only often identified with the incomplete thermohaline interpretation.' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', locator: 'IPCC defines the measurable Atlantic system through upper-ocean northward and deep-ocean southward transport and assesses strength with explicit uncertainty.' }
    ]
  ),
  halon_gas_concentrations: decision(
    'merge_preserve_search_alias',
    'Halons remain important species-specific measurements, but their bromine contribution is already included in the authoritative equivalent-effective-stratospheric-chlorine burden. The duplicate generated node is therefore retained as a search alias rather than assigned an invented causal neighborhood.',
    [
      { url: 'https://csl.noaa.gov/assessments/ozone/2022/twentyquestions/', locator: 'The assessment calculates equivalent effective stratospheric chlorine from CFCs, HCFCs, halons, and other chlorine- and bromine-containing gases, with bromine weighted for its greater ozone-depletion effectiveness.' },
      { url: 'https://csl.noaa.gov/assessments/ozone/2022/executivesummary/', locator: 'The executive summary reports halon abundance and bromine trends as species-level components of total stratospheric halogen loading.' }
    ]
  ),
  migratory_bird_flyway_losses: decision(
    'merge_preserve_search_alias',
    'A flyway is a broad management geography, while observed disruption must be measured through species-specific route use, passage timing, stopover occupancy, habitat availability, or demographic response. The duplicate label is retained as a search alias to the bounded annual-cycle record.',
    [
      { url: 'https://www.usgs.gov/news/when-timing-everything-migratory-bird-phenology-changing-climate', locator: 'USGS treats migration, breeding, nesting, food-resource timing, stopover habitat, and species responses as linked but separately measurable annual-cycle dimensions.' },
      { url: 'https://www.fws.gov/story/threats-birds-habitat-impacts', locator: 'The Fish and Wildlife Service describes flyways, stopover habitat, habitat connectivity, development, and population effects without defining a flyway itself as a lost causal entity.' }
    ]
  )
});
