# PTSource workbook cross-check

`row-to-office-map.json` maps each row number in the "Office Locations" sheet of `PTSource Scheduling Reference Workbook.xlsx` to the matching office `name` in `offices.json`. Used to cross-verify manager names, phone numbers, hours, and escalation contacts against `offices.json`.

## What was checked (as of the 2026-09-02 workbook)

- **Escalation routing**: the workbook's `1st Level Escalation` column notes 9 offices where non-appointment requests should go to the office manager instead of the default "Marcus" ("Unless it pertains to Dr. Simela, then should be office manager") — Bushwick (Orthopedics), Canarsie, Sunset Park, Cedarhurst (PT/PM&R), Hempstead, Merrick, Valley Stream, Westbury, Midtown Manhattan. All 9 already had `escalation` set to the office manager in `offices.json` — no changes needed.
- **Hours**: two real discrepancies found and fixed — Freehold (missing the PT-only vs. appointment-only Saturday split) and Monroe (missing the every-other-week Wednesday hours). Everything else that looked different was just punctuation/formatting noise in the workbook (missing commas, inconsistent AM/PM spacing, one typo — "Satursday" for North Bergen).
- **Manager names, phone numbers, emails**: all matched. The only naming difference is "Kristy Frye" vs. our "Kristy Frye (VP, Operations)" — intentional formatting on our side, not an error.
- **Marcus's escalation phone** (516.231.4624) couldn't be verified against this workbook — it isn't listed here. Nothing contradicts it either.

## To re-run this check with a newer workbook

Load `offices.json` and the workbook's "Office Locations" sheet (via Excel COM automation — this machine has no Python/Node), map rows to offices using `row-to-office-map.json` (update it first if rows shifted), and diff `phone`, `medEmail`, `hours`, `manager`, and `escalation` per office. Compare phone/fax by digits only; hours and other free-text fields need whitespace/punctuation normalized before comparing, since the source workbook is inconsistent about commas vs. line breaks between day segments.
