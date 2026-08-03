# Data-center facility data audit

Reviewed: 2026-07-28

## Decision

Data Center Map is valuable as a licensed facility-enrichment source, but it is not an open API or a permissible scrape target. Its public research page says API access will be available later, while its terms prohibit automated retrieval and copying site data into an external database without a licensing agreement.

The platform now uses OpenStreetMap as the compliant open facility-geography layer:

- refresh command: `npm run refresh:data-center-facilities`
- backend route: `/api/data-centers/facilities`
- public snapshot: `public/data-center-facilities-osm.json`
- current snapshot: 4,890 georeferenced OSM elements

This layer is for facility discovery and spatial joins. It is not a facility census and does not imply capacity, electricity use, water use, PUE, or operational status.

## What Data Center Map offers

Data Center Map reports:

- 13,544 listings from 3,516 operators;
- 12,652 listings with coordinates;
- 5,025 with power in MW;
- 4,694 with whitespace size;
- 2,784 with total building size;
- 962 with PUE;
- 3,735 with year operational;
- 2,713 with tier design.

Its database distinguishes land, campuses, multi-tenant buildings, and facilities. It exposes parent-child relationships through `parent_id` and tracks indicative lifecycle stages: land banked, planned, under construction, and operational. The separate public directory currently reports 12,114 unique data centers across 179 countries; this differs from the listing total because one physical location may contain a parent campus or building plus multiple child facilities.

Those distinctions are the best schema ideas to borrow:

1. Keep `site`, `building`, and `operator facility` as separate entity levels.
2. Preserve `parent_id` instead of flattening campus records.
3. Treat lifecycle as source-reported and indicative.
4. Keep observed capacity, white space, building area, PUE, and year operational nullable.
5. Never convert a facility count into load, water, or emissions.

Potential licensed fields for LostPlanet:

| Field group | Candidate fields | Platform use |
| --- | --- | --- |
| Identity | source ID, name, operator, owner, parent ID, listing type | deduplication and campus hierarchy |
| Geography | coordinates, address, city, market, state, country | grid, water, heat, flood, and jurisdiction joins |
| Lifecycle | land banked, planned, construction, operational | growth and exposure scenarios |
| Physical | building area, whitespace area | bounded footprint context |
| Energy | published power capacity, PUE | capacity context only; never assumed load |
| Reliability | tier design | facility metadata, not outage probability |

## Open and candidate APIs

### Integrated: OpenStreetMap via Overpass

The OSM tagging model supports `telecom=data_center`, `building=data_center`, `industrial=data_centre`, and explicit proposed/construction lifecycle prefixes. The new pipeline makes one global Overpass query, deduplicates by OSM element ID, keeps source provenance and coordinate basis, and retains only relevant non-contact tags.

Current coverage:

| Measure | Count |
| --- | ---: |
| Records | 4,890 |
| Ways | 3,948 |
| Nodes | 860 |
| Relations | 82 |
| Named records | 3,750 |
| Records with operator | 2,889 |
| Explicitly under construction | 24 |
| Explicitly planned | 18 |

License: Open Database License 1.0. Public outputs must retain “© OpenStreetMap contributors” attribution and applicable database share-alike obligations.

### Permission required: PeeringDB

PeeringDB has an official REST API for facilities, campuses, networks, carriers, and IX presence. Anonymous single queries are supported at lower limits; automated users are asked to use API keys, a descriptive User-Agent, efficient queries, and local caching.

It is not an unrestricted commercial dataset. Its Acceptable Use Policy limits reproduction, bulk transfer, demographic mapping, and commercial use without prior permission. Use it only after written approval for LostPlanet’s use case.

### Candidate requiring legal review: datacenters.world

This service documents a bearer-token REST API with JSON/CSV, open CORS, 1,000 free requests per month, and endpoints for facilities, operators, countries, and cloud regions. Its facility schema includes coordinates, lifecycle, sparse power and space data, connectivity counts, and record-level provenance.

The API aggregates PeeringDB, OSM, and operator-published pages. Because PeeringDB’s own AUP is restrictive, confirm the provider’s authority to grant downstream production and redistribution rights before using it.

## Recommended next joins

The new facility coordinates can be joined to layers LostPlanet already has:

1. WRI Aqueduct basin water stress and seasonal water context.
2. Electricity Maps zones or EIA balancing-authority/state power context.
3. Heat, drought, flood, and wildfire hazard layers.
4. Administrative jurisdictions for permitting and disclosure research.

Every joined output should retain the facility source record, coordinate basis, join method and distance, hazard observation period, and missingness. Facility presence alone must not be presented as environmental impact.

## Implemented environmental joins

The facility inventory is now joined through `/api/data-centers/context`, generated by:

- `scripts/build-aqueduct-data-center-join.py`
- `scripts/build-data-center-environment-context.mjs`

Current coverage:

| Context | Joined facility records | Method |
| --- | ---: | --- |
| Aqueduct 4.0 baseline annual | 4,887 | exact facility point within source polygon |
| U.S. candidate grid markets | 1,401 | Aqueduct country/admin-1 to overlapping market panel |
| Nearby NASA POWER heat panel | 90 | nearest source point within 75 km |
| Nearby Copernicus drought panel | 83 | nearest source point within 50 km |
| Nearby NOAA coastal gauge | 22 | nearest source gauge within 50 km |
| Nearby EEA urban-heat point | 1,059 | nearest source point within 30 km |
| GWIS national wildfire context | 2,308 | Aqueduct country code to supported country record |

The grid join deliberately returns candidate markets rather than one assigned serving grid. Many states overlap multiple balancing authorities and the current source snapshots do not contain utility-territory polygons.

The output does not calculate a composite risk, impact, resilience, or site-suitability score. Water stress is modeled basin competition rather than facility consumption; nearby gauges and city/grid points remain contextual observations rather than claims about the facility parcel.

## Sources

- Data Center Map dataset page: https://www.datacentermap.com/research/
- Data Center Map methodology and coverage: https://www.datacentermap.com/research/data/
- Data Center Map terms: https://www.datacentermap.com/legal/terms/
- OpenStreetMap data-center tagging: https://wiki.openstreetmap.org/wiki/Tag:telecom%3Ddata_center
- OpenStreetMap copyright and license: https://www.openstreetmap.org/copyright
- PeeringDB API documentation: https://www.peeringdb.com/apidocs/
- PeeringDB query limits: https://docs.peeringdb.com/howto/work_within_peeringdbs_query_limits/
- PeeringDB Acceptable Use Policy: https://auth.peeringdb.com/aup
- datacenters.world API documentation: https://datacenters.world/api
