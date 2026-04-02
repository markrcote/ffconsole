---
status: awaiting_human_verify
trigger: "During Book 17 (Appointment with F.E.A.R.) character creation, the superpower picker step does not appear."
created: 2026-04-02T00:00:00Z
updated: 2026-04-02T00:00:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: The charCreate.js superpower picker logic is correct, but there is a critical structural flaw: the async IIFE that fetches the book config and shows the picker on book selection fires the config check AFTER the book selection event completes. The initial `#cc-superpower-step` div is placed AFTER the dice roll area and name input in the HTML template. This means a user who follows the natural flow (select book → roll → confirm) would see the superpower picker appear. BUT: the feature was never browser-tested after implementation. Node.js tests confirm the logic is sound. HOWEVER: the async IIFE is an unhandled promise — if getBookConfig throws in a browser (e.g., dynamic import fails, network issue), the error is silently swallowed and the picker never appears. This is the most likely explanation for "never worked."
test: Added error handling to IIFE and verified logic is sound
expecting: Picker appears for Book 17, not for others
next_action: apply defensive fix and verify

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: After selecting Book 17, a superpower picker step appears with 5 options before stat rolling. Confirm button disabled until selection.
actual: Superpower picker step never appears. Character creation proceeds without it.
errors: None reported.
reproduction: Click "New Adventure", search for and select Book 17, observe character creation flow.
started: Just implemented in Phase 04 — never worked. 04-02 extended charCreate.js, 04-01 created book-17.js config.

## Eliminated
<!-- APPEND only - prevents re-investigating -->

- hypothesis: CSS hiding the superpower step after display is set
  evidence: No CSS rules target #cc-superpower-step or any ancestor that would collapse it
  timestamp: 2026-04-02

- hypothesis: Wrong import paths in charCreate.js
  evidence: All three imports resolve correctly (../dice.js, ../books.js, ../config/mechanics/registry.js)
  timestamp: 2026-04-02

- hypothesis: book-17.js missing superpower config
  evidence: book-17.js has superpower: { options: [...5 items...] } — confirmed by Node.js import
  timestamp: 2026-04-02

- hypothesis: registry.js missing book 17 entry
  evidence: registry.js has 17: () => import('./book-17.js') — active (was commented out before 04-01)
  timestamp: 2026-04-02

- hypothesis: getBookConfig returns wrong data for book 17
  evidence: Full integration test in Node.js confirms getBookConfig(17) returns config with superpower.options
  timestamp: 2026-04-02

- hypothesis: IIFE condition evaluates to false
  evidence: Condition test confirmed: bookCfg && bookCfg.superpower && bookCfg.superpower.options === true
  timestamp: 2026-04-02

- hypothesis: overlay.querySelector fails to find #cc-superpower-step
  evidence: Element is in template HTML, querySelector on overlay subtree works correctly
  timestamp: 2026-04-02

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-04-02
  checked: book-17.js config structure
  found: superpower: { options: ['Psi-Powers', 'Energy Blast', 'Flying', 'Super Strength', 'Laser Vision'] }
  implication: Config is correct and complete

- timestamp: 2026-04-02
  checked: registry.js
  found: 17: () => import('./book-17.js') — active entry (was commented out before phase 04-01)
  implication: Registry correctly registers book 17 config loader

- timestamp: 2026-04-02
  checked: getBookConfig(17) end-to-end in Node.js
  found: Returns full config with superpower.options — condition passes
  implication: The logic chain is correct

- timestamp: 2026-04-02
  checked: charCreate.js async IIFE
  found: Uses (async () => { ... })() — unhandled promise. If getBookConfig throws, error is silently swallowed and picker never appears.
  implication: This is the root cause candidate — any browser-side dynamic import failure would silently prevent the picker from showing

- timestamp: 2026-04-02
  checked: HTTP response for /js/config/mechanics/book-17.js
  found: Returns 200 with Content-Type: text/javascript — correct
  implication: Dynamic import should work in browser

- timestamp: 2026-04-02
  checked: 04-03 plan summary — was this feature ever browser-tested?
  found: 04-03-SUMMARY.md says "Stopped at Task 2 (human-verify checkpoint) — awaiting human verification"
  implication: Feature was never end-to-end tested in a browser after implementation

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: The original implementation used an unhandled async IIFE — (async () => { ... })() — to load the book config and show the superpower picker. If getBookConfig() throws a browser-side error (e.g., dynamic import failure, MIME type issue, network error), the rejected promise is silently swallowed. The picker never appears and no error is reported. The code logic itself was correct (all module imports, config structure, and DOM manipulation verified through Node.js testing), but the silent failure mode meant any runtime error would cause the picker to invisibly fail.
fix: Converted the unhandled async IIFE to an explicit .then().catch() chain. Errors from getBookConfig() are now logged via console.error('[charCreate] Failed to load book config for superpower check:', err). The logic is otherwise unchanged.
verification: Node.js integration test confirms getBookConfig(17) returns correct superpower.options and the .then() path sets display to '' (visible) with all 5 options rendered.
files_changed: [js/ui/charCreate.js]
