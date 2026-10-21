# Inspector photographs

The desktop, mobile web/Android, and native iOS inspectors read the checked-in
`src/node-photos.json` registry. The Google Sheet is a sourcing checklist, with
no live dependency in the app. Nodes without an approved photo retain their
description and existing layout. PDF exports do not include these photographs.

## Current coverage

The catalogue contains **381 published nodes with 381 distinct photographs**, including
all 27 response nodes. The final 1 October sourcing pass filled all 182 remaining
slots. There are zero repeated assignments, missing photographs, or omissions.
Every original and final image was decoded; all shipped JPEGs are 2400 × 1350 and
no crop required enlargement. Perceptual-similarity candidates were inspected
visually and confirmed to be different photographs.

The [native sourcing Sheet](https://docs.google.com/spreadsheets/d/1hGz-ZCO5CTTTyJCwQJ4vS5XWGoq0PFhjNQVYoagJmxQ/edit#gid=915891715)
has 381 Ready rows keyed by stable node ID, with source pages, image URLs, credits,
licenses, captions, alt text and verified pixel dimensions. Existing review fields
are preserved. The Photo preview column remains beside Node name; missing-photo
highlighting remains available for future edits. The
[Excel copy](../outputs/inspector-photos-2026-10-01/TULIP%20Inspector%20Photo%20Sourcing.xlsx)
embeds all 381 full-resolution inspector JPEGs for offline review, preserving
filters, dropdowns and frozen identifying columns. The original 28 September
workbook remains a historical import artifact.

The [Your 30 choices tab](https://docs.google.com/spreadsheets/d/1hGz-ZCO5CTTTyJCwQJ4vS5XWGoq0PFhjNQVYoagJmxQ/edit#gid=1825407005)
remains an optional editorial shortlist. All its nodes now have selected images;
its selection fields are available for proposed replacements. The application
reads the checked-in registry, with no live dependency on the Sheet.

Review manifests, source metadata and final verification records are in
[`artifacts/photo-completion-2026-10-01/`](../artifacts/photo-completion-2026-10-01/).
Earlier ownership decisions and rejected candidates remain in the previous audit
folders. Context photographs are explicitly labelled: instruments, facilities or
documented events can illustrate a topic without claiming to show an invisible
gas, establish a trend, or prove the current score. Previously omitted fracking
water storage and deep-sea mining now have accurately captioned context photos.

## Adding a selection

1. Choose a real photograph on its original publisher's page. Check the pictured
   subject, documentary provenance, photographer, and reuse terms. Reject
   diagrams, simulations, composites presented as ordinary photographs, and
   AI-generated images. Review the intended 16:9 crop visually: the subject
   should be unmistakable at inspector size, engaging, and distinct from every
   other installed photograph. A technically valid source with a weak crop
   remains uninstalled. Describe a contextual setting accurately; a photograph
   cannot establish an invisible process, a trend, or the node's current score.
2. Record the original page and full-resolution file URL, credit, license and
   license URL, caption, alt text, and direct/context choice in the Sheet.
   Unverified links belong in the Candidate columns. Keep unverified dimensions
   blank. Alternatively, paste just the publisher's page into Your 30 choices.
   Export the relevant tab as CSV when selections are ready.
3. Run `node scripts/stage-node-photos-from-sheet.mjs sheet.csv selections.json`.
   It keys rows by published ID, skips unchanged installed photos, rejects duplicate
   source selections and unknown IDs, and sets `reviewed:false`. A CSV from
   Your 30 choices stages page-only candidates; resolve their full-resolution file,
   attribution, license, caption, alt text and direct/context choice before review.
4. Review every staged selection independently. Only after verifying its subject,
   provenance and reuse terms, set `reviewed:true`. The installer accepts an
   optional `sourceFile`, `focalPoint:[0.5,0.5]`, or a source-pixel `cropBox`;
   the file's original HTTPS URL and source page are still mandatory. Every
   selection must have exactly one node ID. The importer rejects a source URL
   or source pixels already assigned to another node. The license gate accepts
   CC BY, CC BY-SA, CC0, public-domain, Unsplash and Pexels terms; NC/ND licenses are rejected.
5. Run `python3 scripts/import-node-photo-selections.py selections.json` with
   Pillow installed. It decodes and applies EXIF orientation to each original,
   requires both axes to be at least 1200 px and enough pixels for a 2400 × 1350
   crop without enlargement, and writes one optimized JPEG of exactly that size.
   No responsive derivatives or smaller thumbnails are generated or served.
   All rows and pixels are checked in a staging directory before assets change.
   An invalid batch leaves the registry and installed assets intact. View every
   final crop before export; portrait originals can lose the subject in a wide
   crop. Cached originals are reused only when their source URL and recorded
   SHA-256 match.
6. Run the mobile snapshot generator and `node iOS/scripts/export-native-data.mjs`
   to refresh bundled metadata and assets. The exporters clear their generated
   photo directories first, so replaced photographs cannot leave stale bundles.
7. Run `npm run test:node-photos` and
   `python3 scripts/verify-node-photo-pixels.py`. The first verifies metadata,
   attribution, orientation, file hashes, exact JPEG dimensions, all 381 IDs,
   and parity across web/mobile/iOS. The second fully decodes original and final
   files. Run the web builds and native builds after changing assets or UI.
8. Mark the verified rows Ready, using the decoded original and final dimensions.
   Ready in the Sheet alone does not bypass the installer's review/pixel gate.

## Packaging and behavior

Web assets live in `public/node-photos/`. Mobile/Android copies live in the mobile
public directory and Android's normal web export. iOS copies live in
`iOS/TULIPiOS/NativeData/node-photos/` and the existing NativeData folder resource.
Display scaling preserves the 2400 × 1350 file resolution. The inspector reserves
a 16:9 space during loading and removes a failed photo block while keeping the
definition accessible. Caption and linked credit/license appear in the tapped
photo viewer.
Mobile inspectors load photographs only while expanded. Selection changes remove
the previous image; stale failures cannot hide the new selection's photograph.

Originals, the reviewed selection ledger, the verified Excel import artifact,
native Sheet readbacks, and verification screenshots are retained under
`artifacts/inspector-photographs-2026-09-28/`. Source and final SHA-256 hashes are
recorded in the registry. The originals support pixel/provenance auditing; only
the optimized final JPEGs are packaged in apps.

For UI verification, start desktop and mobile development servers, then run
`node scripts/test-inspector-photos-browser.mjs`. It covers direct/context photos,
selected-only loading, collapsed/expanded mobile behavior, failures, missing
photos, rapid node changes, 320 px screens, and 200% caption text. Native QA can
launch with `-TULIPStartTab analyse -TULIPStartNode "Thermokarst Expansion"
-TULIPInspectorExpanded YES` to inspect the expanded photo without changing
normal navigation defaults.

## Photograph licensing

Photographs retain their individual licenses, independently of application code.
Each shipped JPEG is cropped and recompressed; the inspector states “Cropped”.
CC BY-SA derivatives are distributed under the source's CC BY-SA license and
version, as linked in the registry. Preserve those credits and license links when
redistributing bundled assets. Public-domain and CC0 photographs also retain
documentary credits. Use the original page for any jurisdiction-specific reuse
details. See [Wikimedia's reuse guidance](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia)
and the [Unsplash license](https://unsplash.com/license) for future selections.
These photographs use scientific collections, Commons, Unsplash and Pexels sources.
There is no Unsplash API integration. The 30 September additions and their per-node credits, licenses,
and source pages are recorded in
[`verified-selections.json`](../artifacts/unique-inspector-photos-2026-09-30/verified-selections.json)
and the [heat and livestock selections](../artifacts/unique-inspector-photos-2026-09-30/heat-exposure-selections.json)
and the checked-in registry. The table below documents the initial collection.

| Asset | Credit | License | Source |
|---|---|---|---|
| agriculture.jpg | Dave Spicer | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) | [Original page](https://commons.wikimedia.org/wiki/File:Combine_harvester_in_Rape_Seed_field_-_geograph.org.uk_-_2074844.jpg) |
| algal-bloom.jpg | Zachary Haslick / Aerial Associates Photography, via NOAA GLERL | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Harmful_Algal_Bloom_in_Western_Lake_Erie,_July_9,_2018_(41640917430).jpg) |
| arctic-ship.jpg | NASA / Kathryn Hansen | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Towing_an_Icebreaker_(5977107506).jpg) |
| avalanche.jpg | Derrellwilliams | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Avalanche_in_South_Tyrol_02.jpg) |
| aviation.jpg | Shishirdasika | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Vistara_passenger_aircraft_from_Mumbai_to_Paris_in_Chatrapati_Shivaji_International_Airport,_Mumbai.jpg) |
| bank-erosion.jpg | Nickuzhov | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Bank_erosion_Nottawasaga.jpg) |
| battery.jpg | NextEra / Bureau of Land Management California | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Desert_Sunlight_Battery_Energy_Storage_System_(52945816430).jpg) |
| boiler.jpg | Turbojet | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Wall_mounted_boiler_in_kitchen.jpg) |
| bridge-flood.jpg | Pleft | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Bridge_damaged_by_flood,_Te_Auaunga_creek._Auckland_28_January_2023.jpg) |
| calving.jpg | Diego Delso | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Glaciar_Hubbard,_Alaska,_Estados_Unidos,_2017-08-20,_DD_14.jpg) |
| cattle.jpg | Quintin Soloviev | [CC0](https://creativecommons.org/publicdomain/zero/1.0/deed.en) | [Original page](https://commons.wikimedia.org/wiki/File:Grazing_cattle_on_a_pasture_in_eastern_New_Mexico.jpg) |
| cement.jpg | Jason Woodhead | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Original page](https://commons.wikimedia.org/wiki/File:Exshaw_Cement_Plant_(19068232255).jpg) |
| coal.jpg | Petar Milošević | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Komatsu_bulldozer_pushing_coal_in_Power_plant_Ljubljana_(winter_2017).jpg) |
| coastal-erosion.jpg | Hullian111 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Aldbrough_Cliff_Edge_Coastal_Erosion_L,_Jun24.jpg) |
| coastal-flood-sandy.jpg | David Shankbone | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | [Original page](https://commons.wikimedia.org/wiki/File:Hurricane_Sandy_Flooding_East_Village_2012.JPG) |
| coastal-permafrost.jpg | Shawn Harrison / US Geological Survey | [Public domain](https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits) | [Original page](https://www.usgs.gov/media/images/eroding-bluffs-kaktovik) |
| container-port.jpg | James R. Tourtellotte | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Aerial_photograph_of_the_Port_of_Miami_Container_Port.jpg) |
| contrails.jpg | AlixSaz | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Contrails_in_the_sky_at_sunset.jpg) |
| coral.jpg | NOAA | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://www.nesdis.noaa.gov/news/worlds-fourth-mass-coral-bleaching-event-likely-ended-2025) |
| courthouse.jpg | Joe Ravi | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Original page](https://commons.wikimedia.org/wiki/File:Panorama_of_United_States_Supreme_Court_Building_at_Dusk.jpg) |
| cryoconite.jpg | Peter Rejcek, NSF | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Taylor_Glacier,_cryoconite_hole_2014-11-21_02.jpg) |
| culvert.jpg | Bjankuloski06 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Brookfield_Stream_exiting_a_culvert,_Brookfield_Stream_Reserve.jpg) |
| cycling.jpg | Ingolfson | [CC0](https://creativecommons.org/publicdomain/zero/1.0/deed.en) | [Original page](https://commons.wikimedia.org/wiki/File:Bus_Stop_Cycle_Lane_Bypass,_Whenuapai_II,_2018-05.jpg) |
| dam.jpg | Wikideas1 | [CC0](https://creativecommons.org/publicdomain/zero/1.0/deed.en) | [Original page](https://commons.wikimedia.org/wiki/File:Hatfield,_Wisconsin_hydroelectric_dam.jpg) |
| data-center.jpg | Victorgrigas | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Original page](https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_13.jpg) |
| desalination.jpg | JoelCarterRamadge | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Aerial_view_of_Victorian_Desalination_Plant.jpg) |
| diesel-train.jpg | Changzhensky | [CC0](https://creativecommons.org/publicdomain/zero/1.0/deed.en) | [Original page](https://commons.wikimedia.org/wiki/File:China_Railways_DF4D_4215_20160605.jpg) |
| diesel-truck.jpg | Soulful sunshine | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Freight_trucks_running_on_highway.jpg) |
| dust-storm.jpg | OKJaguar | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Approaching_dust_storm_(haboob),_Cimarron_County,_OK.jpg) |
| electric-car.jpg | Matti Blume | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.en) | [Original page](https://commons.wikimedia.org/wiki/File:FES,_Electric_vehicle_charging_station,_Wiesbaden_(LRM_20250711_183544).jpg) |
| electricity-transmission.jpg | Kkiefuik | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Transmission_Lines_Crossing_a_Grassy_Valley.jpg) |
| estuary-chesapeake.jpg | DiscoA340 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Chesapeake_Bay_from_the_Air.jpg) |
| fertilizer-application.jpg | Michael Dibb | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) | [Original page](https://commons.wikimedia.org/wiki/File:Spreading_the_fertilizer_-_geograph.org.uk_-_1893815.jpg) |
| fertilizer-factory.jpg | The Cosmonaut | [CC BY-SA 2.5 ca](https://creativecommons.org/licenses/by-sa/2.5/ca/deed.en) | [Original page](https://commons.wikimedia.org/wiki/File:Yara_Belle_Plaine.jpg) |
| fishery.jpg | Rick Obst | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Original page](https://commons.wikimedia.org/wiki/File:Hellifino_Fishing_Vessel_Docked_in_Salmon_Harbor_Marina.jpg) |
| flood.jpg | Paul Collins | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) | [Original page](https://commons.wikimedia.org/wiki/File:Flash_Flood_on_Billesley_Lane_-_geograph.org.uk_-_6278993.jpg) |
| food-waste.jpg | Tdorante10 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:DSNY_Compost_Bin_03.jpg) |
| forest-dieback.jpg | Diane Renkin / National Park Service | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Forest_affected_by_spruce_beetle_activity_in_the_late_1990s_on_East_Entrance_Road._(48638667337).jpg) |
| freshwater-mussel.jpg | U.S. Fish and Wildlife Service - Midwest Region | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Freshwater_Mussels_Abound_(9899172844).jpg) |
| frog.jpg | Brian Gratwicke | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Original page](https://commons.wikimedia.org/wiki/File:Dendropsophus_microcephalus_-_calling_male_(Cope,_1886).jpg) |
| gas-power.jpg | Chixoy | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Cas_Tresorer_i_el_Torrent_Gros.JPG) |
| generator.jpg | Bugsinmyfood | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Diesel_power_backup_generator.jpg) |
| glacial-fjord.jpg | OKJaguar | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Holgate_Glacier,_Kenai_Fjords_NP,_Alaska.jpg) |
| glacial-outwash.jpg | Martin Falbisoner | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:View_from_Skaftafell_National_Park_July_2014_-4.jpg) |
| glacier-stream.jpg | Eric Kilby from Somerville, MA, USA | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) | [Original page](https://commons.wikimedia.org/wiki/File:Winding_Meltwater_Stream_on_Glacier_(54178491456).jpg) |
| hail.jpg | James St. John | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Original page](https://commons.wikimedia.org/wiki/File:Hailstones_(11_August_2010)_(Elk_Park_Pass,_northeast_of_Butte,_Montana,_USA)_6.jpg) |
| heat-pump.jpg | Alexarje | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Heat_pump_on_a_wall.jpg) |
| hurricane-aircraft.jpg | U.S. Air Force / Staff Sgt. Heather Heiney | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Hurricane_hunter_in_Harvey%27s_eye_2017-08-24.jpg) |
| ice-cap.jpg | Nicolamquin | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | [Original page](https://commons.wikimedia.org/wiki/File:Vatnaj%C3%B6kull.JPG) |
| ice-shelf.jpg | NASA / Jim Ross | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Larsen_Ice_Shelf_photographed_from_NASA%27s_DC-8.jpg) |
| imja.jpg | Daniel Alton Byers | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Imja_Lake_and_Glacier.jpg) |
| incinerator.jpg | Rios | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Waste_incineration_plant_Bratislava.jpg) |
| inland-spill.jpg | Infrogmation of New Orleans | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:New_Orleans_oil_spill_cleanup_along_the_French_Quarter_riverfront,_April_2018_36.jpg) |
| insulation-specific.jpg | Manforowicz | [CC0](https://creativecommons.org/publicdomain/zero/1.0/deed.en) | [Original page](https://commons.wikimedia.org/wiki/File:External_insulation_on_building_in_Warsaw.jpg) |
| invasive-kudzu.jpg | Rhododendrites | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Kudzu_graveyard_(40580p).jpg) |
| jellyfish-lake.jpg | Lukas | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Original page](https://commons.wikimedia.org/wiki/File:Jellyfish_Lake,_multitudes_of_jellies.jpg) |
| kelp.jpg | Peter Southwood | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Original page](https://commons.wikimedia.org/wiki/File:Kelp_forest_at_Strawberry_Rocks_PC013138.jpg) |
| levee.jpg | Chris Light | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Pacific_City_Levee_panorama.jpg) |
| lightning.jpg | Mathias Krumbholz | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Original page](https://commons.wikimedia.org/wiki/File:Lightning_Pritzerbe_01_(MK).jpg) |
| logging.jpg | U.S. Forest Service- Pacific Northwest Region | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Clearcut_log_truck_(25457705296).jpg) |
| mangrove.jpg | Cvmontuy | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Mangrove_ciudad_del_carmen2020.jpg) |
| manure-lagoon.jpg | Tim Sheerman-Chase | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Original page](https://commons.wikimedia.org/wiki/File:Slurry_pit,_Carrigcleena_8_-_53824754459.jpg) |
| marine-low-cloud.jpg | Grigory Heaton | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Marine_layer_from_Mount_Wilson.jpg) |
| micro-irrigation.jpg | USDAgov | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Irrigation_(20150723-NRCS-LSC-0314).jpg) |
| migratory-birds.jpg | USFWS Mountain-Prairie | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Original page](https://commons.wikimedia.org/wiki/File:Snow_Geese_(16871134912).jpg) |
| mining.jpg | Cornelius M. Keyes | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:TWIN-BUTTES_MINE._AERIAL_OF_OPEN_PIT_MINE,_1,000_FEET_DEEP._(FROM_THE_DOCUMERICA-1_EXHIBITION._FOR_OTHER_IMAGES_IN..._-_NARA_-_553049.jpg) |
| mobile-tower.jpg | Diacius | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Mobile_phone_mast.jpg) |
| nunatak.jpg | Austin Post | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Columbia_Glacier_and_Great_Nunatak.jpg) |
| ocean-ctd.jpg | Officers and crew of NOAA Ship PISCES / collection of Commander Jeremy Adams, NOAA Corps | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Fish2816_(9787677283).jpg) |
| offshore-rig.jpg | U.S. Coast Guard | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Deepwater_Horizon_offshore_drilling_unit_on_fire_2010.jpg) |
| oil-boiler-specific.jpg | U.S. Air Force | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Waste_Oil_Boiler_(WOB)_System_(2003254381).jpg) |
| oil-power.jpg | Quintin Soloviev | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Coleson_Cove_Generating_Station_(NB_Power).jpg) |
| palm-oil.jpg | T. R. Shankar Raman | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Oil_palm_forest_fragment_Costa_Rica.JPG) |
| passive-cooling.jpg | Bernard Gagnon | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Dolat_Abad_Garden_-_Pavilion_01.jpg) |
| peat-drainage.jpg | Bill Boaden | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) | [Original page](https://commons.wikimedia.org/wiki/File:Drainage_channel_cut_into_the_peat_-_geograph.org.uk_-_2140368.jpg) |
| peat-fire.jpg | U.S. National Archives / Bureau of Indian Affairs, Red Lake Agency | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Roadway_undermined_by_a_peat_fire_-_NARA_-_285717.jpg) |
| permafrost.jpg | Craig McCaa / BLM Alaska | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Original page](https://commons.wikimedia.org/wiki/File:Birch_Creek_permafrost.jpg) |
| personal-road.jpg | Mrbobax | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Cars_and_Red_Traffic_light_Kigali.jpg) |
| pollen.jpg | W.carter | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Pollen_cone_on_a_Ponderosa_pine_in_Tuntorp,_Brastad,_Sweden.jpg) |
| pollinator.jpg | Juan Carlos Fonseca Mata | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Pollination_-_Honey_bee_(Apis_mellifera)_and_Opuntia_sp._flower.jpg) |
| public-transit.jpg | Diliff | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | [Original page](https://commons.wikimedia.org/wiki/File:C_Class_Tram,_Melbourne_-_Jan_2008.jpg) |
| rail-heat.jpg | Kecko from Eastern Switzerland | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Original page](https://commons.wikimedia.org/wiki/File:The_white_rails_of_the_Rhaetian_Railway_(29844675158).jpg) |
| refinery.jpg | W.carter | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Blue_hour_fog_over_Preemraff_oil_refinery_by_Brofjorden.jpg) |
| reservoir.jpg | Ken Lund from Reno, Nevada, USA | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) | [Original page](https://commons.wikimedia.org/wiki/File:Lake_Mead,_Nevada_(7981498603).jpg) |
| restoration.jpg | Greensaviours2016 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Miyawaki_Planting_at_Hanji_Farms.jpg) |
| rice-paddy.jpg | Gpwitteveen | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Transplanting_rice_seedlings_by_hand_into_the_flooded_paddy_after_mechanical_transplanting_leaves_gaps.jpg) |
| savanna.jpg | Cosal | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Savanna_landscape_at_Sabi_Sand.jpg) |
| sea-ice.jpg | Lorenz King (via Matti&Keti) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:North_Pole,_Arctic_Ocean,_sea_ice_08.jpg) |
| seagrass.jpg | Symbiosis | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Original page](https://commons.wikimedia.org/wiki/File:Scuba_Diver_in_Seagrass_-_53006413135.jpg) |
| semiconductor-cleanroom.jpg | NASA Glenn Research Center | [Public domain](https://www.nasa.gov/nasa-brand-center/images-and-media/) | [Original page](https://images.nasa.gov/details/GRC-1998-C-01261) |
| siren.jpg | CEphoto, Uwe Aranas | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Original page](https://commons.wikimedia.org/wiki/File:Semporna_Sabah_Tsunami-Early-Warning-System-03.jpg) |
| snow-algae.jpg | James St. John | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Original page](https://commons.wikimedia.org/wiki/File:Pink_snow_from_cryophilic_algae_(Upper_Meadow,_Lassen_Volcano_National_Park,_California,_USA)_2.jpg) |
| snowpack.jpg | Steve Redman (MORA) | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Late_snowpack_(0bd864f0d30a48b19f7198e9e17f9c7a).JPG) |
| soil-gully.jpg | Mark Marathon | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Original page](https://commons.wikimedia.org/wiki/File:Gully_erosion_2.jpg) |
| soil-salt.jpg | Zoltan Kluger | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:FIELDS_OF_KIBBUTZ_BEIT_HAARAVA_FLOODED_BY_SWEET_WATER_FROM_THE_JORDAN_RIVER_IN_ORDER_TO_RINSE_THE_SOIL_FROM_ITS_HIGH_SALT_CONTENT_IN_PREPARATION_FOR_AD828-077.jpg) |
| solar.jpg | Asurnipal | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Nueziders-Alte_Landstrasse-photovoltaic_roof_power_plant-07ASD.jpg) |
| spraying.jpg | USDAgov | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:83cs0480_(40740143883).jpg) |
| sprinkler-irrigation.jpg | USDA | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:USDA_Irrigation_2011.jpg) |
| steel.jpg | Paora | [CC0](https://creativecommons.org/publicdomain/zero/1.0/deed.en) | [Original page](https://commons.wikimedia.org/wiki/File:Glenbrook_steel_mill_2026_PA02.jpg) |
| storm-cloud.jpg | NASA / Expedition 40 crew | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:ISS-40_Thunderheads_near_Borneo.jpg) |
| subsea-cable.jpg | Nc tech3 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Cable_Ship_-_Global_Sentinel_-_Tyco_Telecom.jpg) |
| textile-factory.jpg | Ninara | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Original page](https://commons.wikimedia.org/wiki/File:Textile_factory_in_Jaipur3.jpg) |
| thermokarst.jpg | Stephan Sprinz | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Thermokarst_Landscape_of_Banks_Island_06.jpg) |
| transformer.jpg | Rept0n1x | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Original page](https://commons.wikimedia.org/wiki/File:Electrical_substation_transformer,_Love_Lane,_Liverpool.JPG) |
| tundra.jpg | L. Whitehouse / US Fish and Wildlife Service | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Tundra_Rose_-Shrubby_Cinquefoil_(35789081851).jpg) |
| urban-canopy.jpg | Fons Heijnsbroek | [CC0](https://creativecommons.org/publicdomain/zero/1.0/deed.en) | [Original page](https://commons.wikimedia.org/wiki/File:Street_view_of_Sarphatistraat_with_green_tram_track;_free_photo_Amsterdam,_Fons_Heijnsbroek_10-2021.jpg) |
| urban-sprawl.jpg | CyberXRef | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Original page](https://commons.wikimedia.org/wiki/File:Phoenix_Arizona_Aerial_Photograph_(7).JPG) |
| wastewater.jpg | Sdkb | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Blue_Plains_Advanced_Wastewater_Treatment_Plant_aerial_view,_2025.jpg) |
| water-treatment.jpg | Saiphani02 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Krishnapuram_water_treatment_plant_interior.jpg) |
| water-well.jpg | Johnnybam | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Original page](https://commons.wikimedia.org/wiki/File:Borehole_for_Water_for_Construction_building_in_Awka.jpg) |
| weather-balloon.jpg | NOAA National Severe Storms Laboratory | [Public domain](https://creativecommons.org/publicdomain/mark/1.0/) | [Original page](https://commons.wikimedia.org/wiki/File:Nssl0361_-_Flickr_-_NOAA_Photo_Library.jpg) |
| wildfire.jpg | Coconino National Forest | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) | [Original page](https://commons.wikimedia.org/wiki/File:Willard_Fire-_using_wildfire_to_benefit_the_forest_(14548745390).jpg) |
