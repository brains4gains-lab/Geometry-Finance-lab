# Geometry Finance Lab · Site Design Rules 0.1

Status: active implementation contract.

This file joins the rules developed across the Geometry Finance Lab, Nik-Cody reading-interface, and CKeepA design discussions. It is the working source of truth for this site. A future change must satisfy it or explicitly revise it.

## Rule hierarchy

### Layer 1: site-wide invariants

These rules apply to every page in this site:

1. **One open.** Only one menu item or accordion may be open at a time. Opening another closes the previous one. This is a focus rule, not merely a visual preference.
2. **Fixed typography.** Responsive layout may reflow spatially, but menu state does not resize the established type scale. Letter spacing stays calm and readable.
3. **Clear separation.** Context contains substantive content and navigation. Tools contains actions, settings, and operational controls. Do not mix the two casually.
4. **Evidence before decoration.** Stories and research pages distinguish what happened, what is documented, what is interpreted, and what remains a hypothesis.
5. **Quiet usefulness.** Prefer familiar navigation, readable density, direct labels, and no decorative feature that competes with the question being read.
6. **Phone first.** Touch targets, readable spacing, and comfortable panel width take priority on small screens. Desktop density must not make the phone experience worse.
7. **Minimal language.** Show only words that serve our actual work. Omit conventional website copy, explanations, labels, and status text unless they are necessary for orientation or action.

### Layer 2: this site's visual and interaction shell

1. **Always dark.** Use Oxford navy and warm beige-pink as the principal palette. There is no light-mode switch.
2. **Left menu is content.** The Context panel covers approximately two-thirds of the desktop page, leaves the underlying page visible, and dims it while open.
3. **Right menu is tools.** The Tools panel keeps actions and settings separate from the laboratory map. It contains a dedicated `Design rules` line leading to this page.
4. **Quiet sound.** Panel transitions may use one restrained page-like sound. Reduced-motion preferences disable sound and motion.
5. **No ornamental drift.** Avoid gradients, bright SaaS colors, unnecessary cards, decorative frames, and extra accent colors unless a new rule is approved.
6. **Selected page only.** The workspace shows the selected page; menu navigation closes the active panel and restores a clear reading surface.
7. **Ockham test.** Every visible element must justify its space. When two versions work equally well, keep the quieter and shorter one.
8. **Compact header A.** Use the selected 38px header with the small uppercase `Geometry Finance Lab` title as the site-wide header standard.
9. **Regular body text.** Keep ordinary text at the readable regular weight; reserve bold for headings and section labels.
10. **Closer beginning.** Keep the workspace content near the top edge; the default top breathing space is intentionally reduced.
11. **Compact reading rhythm.** Use the communication page’s readable regular body size and tighter vertical spacing as the default for ordinary pages.

### Layer 3: specialist interfaces

These rules are preserved where they belong and are not flattened into the general site shell:

- Trading sheets keep content-width columns, compact value paths, fresh rows first, quiet closed rows, visible open and closed totals, and their established dot language.
- TV walls keep their placement contracts and visible operational panes.
- Blue text remains a real clickable promise where the specialist interface uses blue clickability.
- Long-reading/editorial pages may use the shared two-color reading theme: charcoal `#171916` and warm beige-pink `#ead8d2`, without replacing operational UI standards.

The principle is: inherit the shell, then adopt only the specialist rules that genuinely belong to the artifact.

## Enforcement map

- `index.html`: menu structure, the visible Design rules page, and the `Design rules` line in the right Tools menu.
- `app.js`: `DESIGN_RULES`, dark-theme marker, panel state, global one-open accordion behavior, and reduced-motion sound gate.
- `styles.css`: dark palette, fixed type scale, panel widths, dimmed workspace, readable controls, and phone breakpoints.

## Change gate

Before adding or changing a component:

1. Read this file and identify the applicable rule layer.
2. Classify the change as visual, behavioral, or content-related.
3. Preserve one-open behavior, dark mode, phone usability, and Context/Tools boundaries.
4. Preserve specialist rules when touching a specialist artifact.
5. Check desktop and phone layouts and refresh the changed page when practical.
6. Update this file when a rule itself changes.

## Source decisions

This synthesis reflects the project `AGENTS.md`, `reports/ckeep-design-rules-old-new-2026-07-26.md`, `reports/nik-cody-reading-theme.md`, and the Geometry Finance Lab handoff. Those documents remain the detailed records for their own scopes.
