# Getting Started

## What MCC Classes Is
Mutant Crawl Classics Class Character Sheets (MCC) is a Foundry VTT **module**, not a standalone system. It modifies the [Dungeon Crawl Classics (DCC) system](https://foundryvtt.com/packages/dcc) so it supports the Mutant Crawl Classics ruleset: a dedicated character sheet for each MCC class, Glowburn, Patron Taint, mutation/program/artifact check tables, and MCC-flavored UI touches.

## Requirements
* The **DCC system** — MCC declares a minimum DCC version in its manifest, and Foundry will warn you if your DCC install is too old.
* The **Mutant Crawl Classics Core Book** (`mcc-core-book`) module is *recommended* — it provides the mutation, AI program, artifact, glowburn, and patron taint roll tables the sheets draw on. Without it the class sheets still function, and rolls resolve against world tables or a compendium you configure instead — see [Content Tables and Automation](Content-Tables.md).

## Installation
1. Install the DCC system from the Foundry package browser and create a DCC world.
2. Install the *Mutant Crawl Classics (MCC) Class Character Sheets* module (and the *Mutant Crawl Classics Core Book* module if you own it) from the package browser.
3. Enable both modules in your world's **Manage Modules** dialog.

## Where Things Live
* MCC character sheets are selected per-actor via **Sheet Configuration** — see [Character Classes](Character-Classes.md).
* DCC's data-oriented tools (Fleeting Luck, the GM's Request Roll) live in the **MCC Tools** sidebar tab (the green M near the bottom of the right-hand sidebar tab bar).
* Module options are under **Configure Settings** — see [Module Settings](Module-Settings.md).
