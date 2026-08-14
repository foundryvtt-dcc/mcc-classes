# Content Tables and Automation

MCC roll support (mutation checks, AI/wetware program checks, artifact checks, glowburn manifestations, and patron taint) resolves against **RollTables** looked up by exact name. For each roll the module checks, in order:

1. **World RollTables** — a table in your world whose name matches wins outright, so a judge can supply or override any table with no compendium installed.
2. **Registered compendium packs** — normally the packs broadcast by the *Mutant Crawl Classics Core Book* (`mcc-core-book`) module, or a compendium you point at via the [module settings](Module-Settings.md).

If neither exists, the roll still happens — there is just no table result to draw.

## Automation
* **Patron Taint** — when an Invoke Patron AI check rolls a natural 1, the module automatically rolls that patron's 1d6 Patron Taint table (world tables named `Patron Taint: <PATRON>` also work).
* **Glowburn** — when a shaman burns ability points while running a patron program, the module rolls that patron's 1d4 glowburn manifestation table. The DCC "Spellburn" term is relabeled **Glowburn** throughout.
* **Crit and fumble tables** — MCC's crit and fumble tables take precedence over the DCC core book's identically-named tables, so MCC characters crit and fumble on the MCC tables.

## Running Without the Core Book
Without `mcc-core-book` the class sheets still function; the browser console notes that table integrations are idle. Build world RollTables with the matching names, or point the module settings at any RollTable compendium (e.g. a homebrew module's pack).
