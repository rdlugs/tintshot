# Contributing to Tintshot

Thanks for helping improve Tintshot. The project aims to stay small, fast,
accessible, and easy to understand.

Participation in this project is governed by the
[Code of Conduct](CODE_OF_CONDUCT.md). To report a security problem, follow the
[Security Policy](SECURITY.md) instead of opening an issue.

## Before you start

Every change must have an issue before work begins. Check the issue tracker for
an existing issue that covers the change; if there is not one, open a new issue
so the problem and proposed approach can be discussed.

All changes must be submitted through a pull request linked to that issue. Do
not push changes directly to the default branch or open a pull request without
an issue.

When reporting a bug, include:

- What you expected to happen and what happened instead
- Steps and, when useful, a sample image that reproduce the problem
- Your browser, operating system, and Node.js version
- Any relevant console errors or screenshots

Do not include confidential or personally identifiable content in sample
screenshots.

## Development setup

You need Node.js 22.22.2 or newer and npm. Node 20 is not supported: jsdom,
which the test suite runs on, requires Node 22.22.2 or newer.

```bash
git clone https://github.com/rdlugs/tintshot.git
cd tintshot
npm ci
npm run dev
```

Vite prints the local development URL in the terminal. Changes to source files
are reflected in the browser during development.

## Making a change

1. Find an existing issue for the change or open a new one.
2. Create a focused branch from the latest default branch.
3. Make the smallest change that solves the problem.
4. Add or update tests when changing layout, crop, or export behavior.
5. Check the interface at narrow and wide viewport sizes for visual changes.
6. Run the test suite and production build.
7. Open a pull request that links the issue and describes the problem, solution,
   and verification.

## Project guidelines

- Keep the app fully client-side; screenshot data must not leave the browser.
- Prefer browser APIs and existing utilities over adding dependencies.
- Preserve strict TypeScript checks and keep rendering calculations readable.
- Put reusable layout and export calculations in `src/lib/beautifier.ts` so they
  can be tested without the UI.
- Keep color extraction logic in `src/lib/colors.ts` focused and deterministic.
- Keep the rendering core in `src/lib/` free of React so it stays testable in
  isolation; anything touching browser APIs belongs in a hook under
  `src/hooks/`.
- Put editor state changes in the reducer in `src/state/settingsReducer.ts` and
  keep it pure and immutable. Components should read state and dispatch actions
  rather than hold their own copies.
- Style with Tailwind utilities. Reach for `src/index.css` only when a utility
  cannot express the rule (vendor pseudo-elements, multi-layer backgrounds), and
  put shared class strings in `src/components/styles.ts`.
- Maintain keyboard access, visible focus behavior, semantic labels, and useful
  status feedback when changing controls.
- Avoid committing generated files or unrelated formatting changes.

## Testing and validation

Run these checks before submitting a pull request. The same checks run in CI on
every pull request, on Node 22 and Node 24:

```bash
npm run format
npm run lint
npm test
npm run build
```

For visual or interaction changes, also verify the affected flow manually:

- Load an image by file picker, drag and drop, or clipboard paste.
- Try relevant frame and aspect-ratio combinations.
- Check crop positioning and keyboard controls where applicable.
- Export at the affected scale and inspect the resulting PNG.
- Confirm the editor remains usable on a narrow screen.

## Pull requests

Keep each pull request limited to one logical change. In its description:

- Explain the user-facing problem and the chosen solution.
- Link the issue the pull request resolves.
- List the checks you ran.
- Include before-and-after images for visual changes.
- Call out behavior changes, limitations, or follow-up work.

Please respond to review feedback with follow-up commits. Once the review is
complete, maintainers may squash commits when merging.
