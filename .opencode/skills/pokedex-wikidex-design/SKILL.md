---
name: pokedex-wikidex-design
description: Design system and UI conventions for the Pokédex Offline app, a WikiDex-inspired Pokémon encyclopedia with a Pokédex-red accent, warm paper surfaces, editorial serif headings, type badges, and explicit cache/offline/sync states. Use when adding or changing screens, components, copy, or styles in this repository.
---

# Pokédex Offline — WikiDex-inspired design

## When to use this skill

Use it when you:

- Create or modify a screen under `src/app/`.
- Add a component under `src/components/ui/` or a feature folder.
- Change colors, typography, spacing, radii, shadows, or responsive behavior.
- Write user-facing Spanish copy, especially around offline, cache, and synchronization.
- Review whether a UI change still matches the project's encyclopedia identity.

The goal is an **editorial Pokémon encyclopedia**, not a generic Material or dashboard app.

---

## 1. Visual thesis

The interface should feel like a printed collector's encyclopedia that happens to be interactive:

- **Warm paper, not pure white.** The page background is cream; cards are white.
- **Pokédex red is the signature accent**, used sparingly for identity, actions, and highlights.
- **Serif for names and titles, sans for controls and data.** This creates the WikiDex/editorial contrast.
- **Thin rules, soft shadows, restrained borders.** Avoid heavy elevation and neon gradients.
- **Data first.** The Pokémon sprite, dex number, name, and types win the hierarchy.
- **States are honest.** Cached, pending, confirmed, and failed data must look different.

Do not drift toward:
- Purple/blue SaaS gradients.
- Glassmorphism or blur-heavy surfaces.
- Rounded-square "finance app" cards with saturated icons.
- Pure black backgrounds in light mode.
- Decorative animations that compete with content.

---

## 2. Color tokens

Always import from `src/constants/theme.ts` and use `useTheme()`; never hardcode a color in a screen unless it is part of a type/personal-type palette.

### Light

| Token | Value | Use |
| --- | --- | --- |
| `background` | `#F7F4EE` | Page background, warm paper |
| `surface` | `#FFFFFF` | Cards, sheets, form panels |
| `surfaceMuted` | `#F1EDE6` | Tracks, inset blocks |
| `backgroundElement` | `#EEE9E1` | Secondary fills |
| `backgroundSelected` | `#E2DCD1` | Selected neutral |
| `border` | `#DCD4C7` | Default hairline |
| `borderStrong` | `#C7BDAD` | Secondary button border |
| `text` | `#191B20` | Primary ink |
| `textSecondary` | `#5E6470` | Body/supporting copy |
| `inkMuted` | `#8A8F99` | Labels, timestamps |
| `accent` | `#C62828` | Pokédex red |
| `accentDark` | `#8E1B1B` | Pressed/strong red |
| `accentSoft` | `#FBE9E7` | Red-tinted surfaces |
| `onAccent` | `#FFFFFF` | Text on red |
| `success` | `#2E7D32` | Confirmed/captured |
| `successSoft` | `#E6F4EA` | Success background |
| `warning` | `#A15C00` | Pending/offline |
| `warningSoft` | `#FFF3DE` | Warning background |
| `danger` | `#B3261E` | Errors |
| `dangerSoft` | `#FDECEA` | Error background |
| `info` | `#1565C0` | In progress/sync |
| `infoSoft` | `#E7F1FB` | Info background |
| `shadow` | `#2A2118` | Warm shadow |
| `skeleton` | `#E7E1D7` | Loading blocks |

### Dark

The same semantic roles exist in `Colors.dark`; use them through `useTheme()`. Do not assume a dark value equals the light one.

### Type and personal-type colors

- Pokémon types live in `src/constants/pokemon.ts` (`POKEMON_TYPE_STYLES`). Use `getTypeStyle(type)` and the `TypeBadge` component.
- Personal categories live in `PERSONAL_TYPES` / `getPersonalTypeStyle`.
- These palettes are intentionally more saturated than the app chrome. They are content, not UI accent.

### Rules

- One red primary action per visual block.
- Never use red for both "error" and "brand emphasis" in the same area without a label.
- Do not use `success` for "synced" and `accent` for "captured"; captured uses `success`, pending uses `warning`, sync-in-progress uses `info`.
- Text on colored badges must pass contrast; use the `text` value paired with each background.

---

## 3. Typography

`Fonts` comes from `src/constants/theme.ts`.

| Role | Family | Size | Weight | Notes |
| --- | --- | --- | --- | --- |
| Screen title | `Fonts.serif` | 34 | 700 | `PageHeader.title`, line height 40 |
| Detail name | `Fonts.serif` | 38 | 700 | Hero Pokémon name |
| Card name | sans | 17 | 800 | Tight letter spacing |
| Form identity name | `Fonts.serif` | 26 | 700 | |
| Section title | sans | 18–20 | 800 | |
| Body | sans | 14–15 | 400 | Line height 21–22 |
| Support | sans | 12–13 | 400–600 | Line height 18–19 |
| Kicker/eyebrow | sans | 9–11 | 900 | Uppercase, letter spacing 1.2–2 |
| Number | sans | 11–12 | 900 | `#0025` style, tabular feel |

Rules:

- Use serif only for **titles, names, and editorial flavor text**, not for buttons or metadata.
- Do not introduce new font families unless `expo-font` is configured and the design is reviewed.
- Keep line lengths readable: `MaxReadingWidth = 720`.
- Uppercase labels always get letter spacing; never uppercase a full paragraph.

---

## 4. Spacing, radius, and layout

### Spacing scale

`Spacing`: `half: 2`, `one: 4`, `two: 8`, `three: 16`, `four: 24`, `five: 32`, `six: 64`.

- Screen horizontal padding: `Spacing.three` (16).
- Card padding: `Spacing.three` or `Spacing.four` for editorial panels.
- Gaps between major blocks: `Spacing.four` (24).
- Inline chip gaps: `Spacing.one` (4) or `Spacing.two` (8).
- Bottom padding for tab screens: `BottomTabInset + Spacing.five`.

### Radius

`Radius`: `sm: 8`, `md: 12`, `lg: 18`, `xl: 26`, `pill: 999`.

- Cards: `lg`.
- Banners, notices, compact panels: `md`.
- Hero panels: `xl`.
- Buttons and chips: `pill`.
- Avoid mixing three different radii in one card.

### Width and breakpoints

- `MaxContentWidth = 960`; `MaxReadingWidth = 720`.
- Pokédex grid: 1 column below 580, 2 columns from 580, 3 from 820.
- Detail hero: stacked below 620, row from 620.
- Use `useWindowDimensions()`, not `Dimensions.get()` at module scope.
- Use `Content`/`PageScroll` from `src/components/ui/page.tsx` for centering.

### Elevation

- Cards: `shadowOpacity` 0.05–0.07, radius 12–20, offset `{ width: 0, height: 5–8 }`, `elevation` 2–3.
- Always pair shadow with a 1 px border; shadows alone are weak on Android.
- Do not stack shadows on nested cards.

---

## 5. Core components

Reuse these before creating new primitives:

| Component | File | Rules |
| --- | --- | --- |
| `Screen` / `Content` / `PageScroll` | `components/ui/page.tsx` | Safe area, max width, bottom inset |
| `PageHeader` | `components/ui/page-header.tsx` | Brand row, connection pill, back, eyebrow, serif title, rule |
| `Section` | `components/ui/section.tsx` | Kicker + title + optional action |
| `Button` | `components/ui/button.tsx` | `primary`, `secondary`, `ghost`, `danger`; 48 px min height |
| `Chip` / `ChipRow` | `components/ui/chip.tsx` | Filters, regions, categories |
| `FeedbackState` | `components/ui/feedback.tsx` | Empty/error card with symbol and action |
| `DataStatusLine` | `components/ui/feedback.tsx` | Fresh/cached/restoring/no-data status |
| `SyncStatusBanner` | `components/ui/sync-status-banner.tsx` | Offline, paused, syncing, confirmed, failed |
| `PokemonCard` | `features/pokedex/...` | List row with number, sprite, name, types |
| `TypeBadge` | `features/pokedex/...` | Always use type palette |
| `CollectionCard` | `features/collection/...` | Status rail, personal badges, priority |
| `CollectionForm` | `features/collection/...` | Region, capture, priority, personal type |

### Button hierarchy

- `primary`: red filled; one per block.
- `secondary`: white with strong border; pagination, secondary navigation.
- `ghost`: text-only; low-emphasis inline actions.
- `danger`: destructive only. The app currently has no delete action; do not add one casually.
- Disabled: opacity 0.45, no press handler, `accessibilityState`.

### Chips

- Use for filters, region selection, category selection, and sort.
- Selected chip uses accent or the category's own palette; unselected uses `surface`/`border`.
- Keep labels short: `Todos (12)`, `Kanto`, `Favorito`.

---

## 6. Screen patterns

### Pokédex list (`/`)

Order:

1. `PageHeader` with eyebrow, title, subtitle.
2. Search field.
3. Search result or search state.
4. `SyncStatusBanner`.
5. Section with page counter and `DataStatusLine`.
6. Offline hint if needed.
7. Error/empty/loading states.
8. Grid of `PokemonCard`.
9. Pagination footer and species count.

Rules:
- 20 items per page.
- Show the dex number even before the sprite loads.
- Types may load after the card; use a quiet placeholder, not a spinner per card.
- Disable pagination offline or when busy; never show mismatched page numbers.

### Detail (`/pokemon/[id]`)

Order:

1. Header.
2. Hero: sprite, number, serif name, genus, type badges, data status.
3. Description card with species flavor text.
4. Base stats panel with thin tracks.
5. Encyclopedic facts grid (height, weight, habitat, generation, capture rate, etc.).
6. Collection CTA panel.

Rules:
- Keep the statistic fill color tied to the primary type.
- Label the language fallback when the flavor text is not Spanish.
- If the species request is paused offline, say so without hiding the main detail.
- Do not render empty fact rows; use `No disponible`.

### Collection (`/collection`)

Order:

1. Header.
2. `SyncStatusBanner`.
3. Section with counters and chips.
4. Sort row.
5. Data status and offline hint.
6. Collection cards.
7. Empty state.

Rules:
- Unsynced records sort first, then priority descending, then name A–Z.
- Pending records are visually distinct but not alarming.
- Confirmed records open the edit form; pending ones do not (no stable remote id yet).

### Forms (`/collection/new`, `/collection/[id]`)

Order:

1. Header with back.
2. Identity card (sprite, number, name).
3. Notice about online/offline behavior.
4. Region chips.
5. Capture switch and priority stepper.
6. Personal category chips.
7. Original `createdAt` on edit.
8. Offline notice.
9. Validation/submit error.
10. Primary submit button.
11. Footnote about remote confirmation.

Rules:
- Validate region and identity before submitting.
- Preserve `createdAt` on edit.
- Disable the submit button only for invalid/disabled states, not merely for offline.
- When offline, the action is still allowed; the mutation is queued.

---

## 7. State semantics and copy

Every state needs a distinct, honest treatment.

| State | Visual | Copy pattern |
| --- | --- | --- |
| Restoring cache | Info line/dot | «Restaurando caché local…» |
| Fresh | Green dot | «Actualizado · HH:MM» |
| Stale | Muted dot | «Datos en caché» |
| Refreshing | Info dot | «Actualizando…» |
| No data | Muted dot | «Sin datos cargados» |
| Error with cache | Warning dot | «Mostrando copia guardada» |
| Offline | Warning banner | «Sin conexión» |
| Pending mutation | Info banner + badge | «Cambios pendientes», «Sin sincronizar» |
| Syncing | Info banner + spinner | «Sincronizando con MockAPI…» |
| Failed sync | Danger banner | «Sincronización fallida» |
| Confirmed | Success banner | «Última operación confirmada por MockAPI» |

Copy rules:

- Spanish, direct, no exclamation marks.
- Never say «guardado» for an optimistic record. Say «pendiente de sincronizar» or «sin sincronizar».
- Never say «offline» as a guarantee for data that was never cached.
- Explain the consequence: «Se reintentará al volver a estar en línea».
- Use «MockAPI» and «PokéAPI» with their exact capitalization.
- Use «Pokémon» with accent; plural «Pokémon».
- Keep error copy actionable: what happened + what to do.

---

## 8. Offline and sync affordances

- A pending record must always show **«Sin sincronizar»**, not only a color.
- Do not use a spinner for a paused mutation. Paused means waiting for connectivity, not loading.
- A failed mutation must be distinguishable from a paused one.
- Show the last confirmed timestamp when useful.
- Offline hints should explain what is available: cached pages, cached details, editable confirmed records.
- Do not block reading cached data because the network is down.
- Do not present placeholder or previous-page data as the requested page.

---

## 9. Accessibility and responsiveness

- Every pressable needs `accessibilityRole="button"` and a meaningful label.
- Icon-only controls need `accessibilityLabel`; decorative marks use `accessibilityElementsHidden`.
- Minimum touch target: 44×44; buttons are 48 px high.
- Do not encode status by color alone; pair with text.
- Support dynamic text: avoid fixed heights on text containers; use padding and line height.
- Test at 320 px width, 768 px, and desktop.
- Use `SafeAreaView` edges and account for native tab bars.
- Keep contrast at WCAG AA for body text; muted text is for secondary metadata only.

---

## 10. Code conventions for UI

- Screens live in `src/app/`; reusable UI lives outside.
- Import theme tokens; do not hardcode hex values in screen styles (type colors excepted).
- Use `StyleSheet.create` for static styles and inline objects only for theme-dependent values.
- Prefer `gap` over margins between siblings.
- Use `Fonts.serif` for editorial titles; never the literal string `'serif'`.
- Use `Pressable` with a pressed opacity around 0.78–0.85.
- Keep components under ~250 lines; extract cards and forms.
- Use typed route objects (`pathname` + `params`) with Expo Router.
- Do not add animation libraries for simple state changes; use `ActivityIndicator`, opacity, and layout.
- When adding a new screen, update the root stack and the tab layout if it is a tab.

---

## 11. Review checklist

Before finishing a UI change:

- [ ] Does it use theme tokens rather than new colors?
- [ ] Is there exactly one primary red action in the block?
- [ ] Are titles serif and controls sans?
- [ ] Does it work at 320 px and in two/three columns where relevant?
- [ ] Are loading, empty, error, cached, offline, pending, and confirmed states covered?
- [ ] Is optimistic data labeled as unsynced?
- [ ] Is copy honest about what is cached and what is confirmed?
- [ ] Are touch targets and accessibility labels present?
- [ ] Does it still look like a Pokémon encyclopedia rather than a generic dashboard?
- [ ] Did `npx tsc --noEmit` and `npx expo lint` pass?
