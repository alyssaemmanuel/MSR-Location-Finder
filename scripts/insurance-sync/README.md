# Insurance data sync

`offices.json`'s `insurances` field was built from `HPM All Status Report` (an internal payer-enrollment/credentialing export, one row per provider x insurance plan). These two files capture the manual mapping work so a future re-sync doesn't have to redo it from scratch:

- `location-mapping.json` — maps each report location string (e.g. `"111 Wadsworth Ave"`) to the matching office `name`(s) in `offices.json`. A few offices map from two different report strings for the same physical address (e.g. Cedarhurst appears as both `"657 CENTRAL AVE"` and `"SIO-Cedarhurst"`). Two report locations (`Park Club-180 Park Club Lane`, `West Seneca- 10 French Lea Rd`) aren't in `offices.json` at all — they may be worth adding as new offices.
- `payer-normalization.json` — maps the report's ~103 raw payer name variants (e.g. `"Aetna (NY)"`, `"Aetna via CHS"`, `"1199 Via Aetna"`) down to ~40 carrier-level names (e.g. `"Aetna"`) for display.

## What was excluded, and why

- Only rows where `Enroll Current Action == "Participating"` count as accepted.
- 7 offices have no rows in this report at all (Brighton Beach, Cedarhurst PT/PM&R, and the 5 NJ Advanced Orthopedics locations — Belmar, Freehold, Manalapan, Monroe, Toms River), likely credentialed under a different management group. Their cards show a "call to confirm" note instead of a list.
- 3 more (Canarsie, Midtown Manhattan, Sunset Park) had only 1 payer listed — almost certainly incomplete source data rather than an accurate accepted-insurance list — so they also show the "call to confirm" note.
- No-Fault / Workers' Comp is barely represented in the report (it doesn't require the same payer-panel enrollment as commercial insurance in NY), so instead of per-office data it's shown as a single site-wide note in `index.html` (`.global-note`).

## To re-sync when a new report comes in

1. Get the new `HPM All Status Report ....xlsx` (currently pulled manually from Downloads via Excel COM automation, since this machine has no Python/Node — see below).
2. Re-run the same extraction logic: for each row where `Enroll Current Action == "Participating"`, look up the location via `location-mapping.json` and the payer via `payer-normalization.json`, and collect the unique set per office.
3. Diff the result against the current `insurances` fields in `offices.json` before merging — flag anything unexpected (e.g. an office losing most of its insurances, which likely means bad source data rather than a real change).
4. Update the two mapping files here if the new report introduces payer name variants or location strings not already covered.

This hasn't been wired into a scheduled/automatic job yet — that's a separate step (needs a decision on where the source file lives long-term, e.g. an automated SharePoint pull vs. a manual drop-in, and whether updates auto-deploy or wait for review).
