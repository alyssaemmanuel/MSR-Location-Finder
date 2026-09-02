# Services data sync

`office.services` in `offices.json` was built from the "Approved Services" sheet of `Services.xlsx` — a Yes/No matrix per office across 9 service categories (PM&R, Interventional Pain Management, Orthopedics, Sports Medicine, Physical Therapy, Acupuncture, EMG/NCS, Injections/Procedures), keyed by Location Name + Practice Name (needed to disambiguate offices sharing a location name, like the two Bushwick and two Cedarhurst offices).

`location-mapping.json` maps each `"Location Name|Practice Name"` key to the matching office `name` in `offices.json`.

## Coverage

Same 29 offices as `providers` (see `../provider-sync/README.md`) — this sheet doesn't cover the 5 Somers Orthopaedic, 5 NJ AOSMI, or 8 Western NY Advanced Care PT locations either.

## To re-sync

For each row in "Approved Services" (columns 3-10, in that fixed order so tags stay consistently ordered), collect the category names where the cell is exactly `"Yes"`, look up the office via `location-mapping.json`, and write the list into `office.services`.
