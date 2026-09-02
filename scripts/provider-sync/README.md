# Provider data sync

`office.providers` in `offices.json` was built from the "Provider Scheduling" sheet of `Provider Scheduling.xlsx` — a grouped table where each location header row is followed by its providers (name + specialty).

`location-mapping.json` maps each sheet location string (e.g. `"East Bronx/Tremont - Interventional Physical Medicine & Rehabilitation, P.C."`) to the matching office `name` in `offices.json`.

## Coverage gap

As of the 2026-09-02 workbook, the Provider Scheduling sheet only has data through row 140 (ending at White Plains) — everything after that is blank, even though the sheet's used range extends to row 509. Only 29 of 47 offices have provider data:

**Covered**: Tremont/East Bronx, North Bronx, South Bronx, Brighton Beach, Brooklyn Heights, Bushwick (PM&R), Bushwick (Orthopedics), Canarsie, Flatbush, Sunset Park, Cedarhurst (Orthopedics), Cedarhurst (PT/PM&R), Hempstead, Merrick, Rockville Centre, Valley Stream, Westbury, Deer Park, Medford, Smithtown, Midtown Manhattan, Washington Heights, North Bergen, Teaneck, Astoria, Bellerose, Rego Park, New Rochelle, White Plains.

**Missing** (show "not yet available" until provided): the 5 Somers Orthopaedic locations (Danbury, Carmel, Fishkill, Mt. Kisco, Newburgh), the 5 NJ AOSMI locations (Belmar, Freehold, Manalapan, Monroe, Toms River), and the 8 Western NY Advanced Care PT locations (Amherst, Buffalo, Lockport, Niagara Falls, Orchard Park, Wheatfield, both Williamsville offices).

## Format

Each entry in `office.providers` is `"Name, Credential (Specialty)"`, e.g. `"Rafael Abramov, DO (Physical Medicine & Rehabilitation)"`. A couple of source cells had the specialty split across two lines (e.g. "Orthopedic Surgery" / "Sports Medicine") — these were joined with a space during extraction.

## To re-sync

Re-run the same extraction: for each location-header row in the "Provider Scheduling" sheet, collect the following provider rows (Provider Name + Specialty) until the next location header, map the location string via `location-mapping.json`, and write `"Name (Specialty)"` entries into `office.providers`. Update the mapping file first if location strings changed.
