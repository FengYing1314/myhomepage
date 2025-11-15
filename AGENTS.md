# Repository Guidelines

## Project Structure & Module Organization
This Vite-powered Vue 3 SPA keeps all source inside `src/`, with `main.ts` mounting `App.vue` as the single entry. Shared UI belongs in `src/components/` where each PascalCase `.vue` file exports exactly one component, while reusable assets sit in `src/assets/` or `public/` for static passthrough. Global styles live in `src/style.css`, and TypeScript plus build configuration is centralized in `tsconfig*.json` and `vite.config.ts`. The production build writes to `dist/`; do not edit generated files directly.

## Build, Test, and Development Commands
Run `npm install` after each clone or pull to sync dependencies recorded in `package-lock.json`. Use `npm run dev` to start the Vite dev server on http://localhost:5173 with HMR for manual verification. `npm run build` executes `vue-tsc -b` for strict type checks before bundling via `vite build`, ensuring regressions fail fast. `npm run preview` serves the latest build from `dist/` so you can smoke-test production assets without deploying.

## Coding Style & Naming Conventions
Write `<script setup lang="ts">` blocks with TypeScript only, remove unused locals to satisfy `tsconfig.app.json`. Follow two-space indentation, prefer single quotes in scripts, and keep kebab-case class names inside `src/style.css`. Components stay in PascalCase (for example, `HeroBanner.vue`) and co-locate composables or helpers near their usage for clarity. Reference media through relative imports so Vite can fingerprint them automatically.

## Testing Guidelines
Automated tests are not wired up yet, so exercise every change manually through `npm run dev` or `npm run preview` and note the steps in your PR. When adding Vitest coverage, place the `.spec.ts` file beside the component it targets and use the component¡¯s name in the describe block for easy discovery. Treat `npm run build` as a gating check because its `vue-tsc` invocation catches typing mistakes absent a dedicated test suite.

## Commit & Pull Request Guidelines
Write imperative, present-tense commits such as `fix: resolve nav overlap`, and scope each commit to one logical change. Pull requests must summarize the problem and solution, link any tracking issues, and capture testing evidence (commands run, screenshots, or screen captures). Call out adjustments to Vite config, TypeScript options, or dependencies so reviewers can focus their review on risky areas.
