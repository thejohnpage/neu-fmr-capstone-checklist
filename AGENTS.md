# Repository Guidelines

## Project Structure & Module Organization

This is a standalone Angular application for reviewing team results. `.\src\main.ts` bootstraps the app; `.\src\app\app.component.ts` coordinates the review interface, browser persistence, team editing, and JSON import/export, while `.\src\app\app.component.html` contains its template. Shared review/team types and the default checklist data are defined in `.\src\app\checklist-data.ts`. Global presentation is in `.\src\styles.css`. Exported team configuration and result snapshots belong in the root `.\data\` directory; exports are not automatically synchronized with browser storage.

## Build, Test, and Development Commands

Use Node.js and npm. Run `npm ci` to install the lockfile-defined dependencies.

- `npm start` — serve the app locally with Angular's development server.
- `npm run build` — create the production build in `dist/leap-review-ratings`.
- `npm run watch` — continuously build with the development configuration.

`package.json` does not define a test or lint script, and no test files or test framework configuration are present.

## Coding Style & Naming Conventions

The project uses Angular 21 and TypeScript 5.9. Follow the existing standalone-component pattern and keep checklist/domain data in `src/app/checklist-data.ts` rather than duplicating it in the template. TypeScript is configured with `strict`, and Angular template checking is strict; preserve those checks when changing application code. No linter or formatter configuration is present.

## Commit & Pull Request Guidelines

The available history contains two initial commits and `Added README.md`; it is too limited to establish a consistent commit-message convention. No pull-request template was found. Include a concise description of user-visible changes and validation performed when preparing a contribution.
