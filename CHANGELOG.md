# Dashboard UI refinement

## Latest iteration: scroll-linked illustration

- Removed the five floating metric cards and their leader lines, including the sleep, mood, and resting-heart-rate metrics; removed the Log mood quick action.
- Added a custom SVG anatomy illustration with fine vascular and organ-inspired linework. Its scan trace advances from head to feet with the existing scroll progress, and the active region gains a soft highlight.
- Kept the existing ScrollControls container and region navigation as the scroll driver. The 3D canvas output is visually hidden; its source component and GLB remain unchanged.
- Verification: `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass.
- No new dependency or model asset was added.

- Added a dark glass dashboard overlay with five metric cards, sparklines, health trends, leader lines, and a compact activity summary.
- Added region detail panels, overview-only hotspots, active navigation states, tooltips, responsive layouts, reduced-motion support, and accessible quick-action forms with confirmation toasts.
- Added CSS theme variables and layered green background treatment. Kept the existing body scene, scroll/camera logic, and model assets unchanged.
- Edit `src/data/mockHealth.ts` to replace the placeholder metrics, region stats, status values, and activity summary with live data.
- Verification: `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass.
- Intentionally deferred: live health-data connections and browser/Lighthouse visual measurements. This repository currently provides mock data, and no browser audit was available in this run.

## Files changed

- `src/app/globals.css` — design tokens, layered background, typography, glass components, responsive and reduced-motion styling.
- `src/app/page.tsx` — dashboard overlay and descriptive region navigation labels.
- `src/components/DashboardUI.tsx` — metric cards, summary rings, region panels, hotspots, and quick actions.
- `src/data/mockHealth.ts` — typed editable mock data.
