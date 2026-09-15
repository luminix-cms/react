# Developing `@luminix/react`

`src/` is the whole product; everything else here is tests, documentation or packaging.

## Two audiences, two trees

| Tree | Written for | Language | Ships |
|---|---|---|---|
| `agents/AGENTS.md` + `agents/references/` | an agent **consuming** the package in an app | English | yes, inside `dist/` |
| `AGENTS.md` (this file), `CLAUDE.md` | an agent **developing** the package | English | no |
| `README.md` | a human landing on npm | Portuguese | yes |
| `docs/` | a human reading at tutorial length | Portuguese | no |

`.npmignore` decides what ships, and because it exists npm ignores `.gitignore` — which is how the
gitignored `dist/` and `types/` still reach the tarball. `npm pack --dry-run` must list
`dist/AGENTS.md` and `dist/references/`, and never `AGENTS.md`, `CLAUDE.md`, `agents/`, `src/` or
`docs/`. The three documentation entries are anchored (`/AGENTS.md`) on purpose: unanchored, the
pattern matches at any depth and takes the published copy in `dist/` down with the root file.

The consumer guide is read from `node_modules/@luminix/react/dist/`, so a fix here reaches an app
on its next install of the package.

## Writing `agents/`

- update it when a change is observable from a consuming app: an export, a prop, a hook argument, a
  reducer name, a class name on the rendered markup, the shape of a request. Internal refactors
  leave it alone
- an API described there that `src/` does not have is a bug in `agents/`
- it describes the behaviour of this commit. What an older release did belongs to the release notes
- every sentence serves the reader's current task and says something the agent could not get from a
  glance at the repository
- describe the package, not the documentation system: no prose about where the guide ships from,
  how it is copied, or what else exists in the ecosystem. Name the neighbouring package when the
  answer lives outside this one

## Working here

There is no host app, and no playground either: `index.html` boots `src/main.tsx`, which is not in
the repo, so `npm run dev` fails. The tests are the only way to run the code — vitest on jsdom,
with globals enabled and `src/__tests__/setup.ts` loading the jest-dom matchers.

```bash
npm run test          # vitest run
npm run lint          # eslint, --max-warnings 0
npm run build         # rm -rf types && tsc && vite build && cp -R agents/. dist/
```

`tsc` type-checks against `tsconfig.json`, which excludes `src/__tests__`: nothing type-checks the
test files, and `tsconfig.test.json` exists only so the editor resolves vitest globals and jest-dom.

The build emits one ESM bundle, `dist/react.js`, plus `types/index.d.ts` from `vite-plugin-dts`.
`module` and `types` point at those and there is no `main`, so the package has no CJS entry.
Whatever the package exposes has to be re-exported from `src/index.ts` — that single file is the
bundle entry and the types entry. Externals are `Object.keys(peerDependencies)` plus
`react/jsx-runtime`, read from `package.json` by `vite.config.js`: a new peer that is not declared
there gets bundled into the output instead.

`css/ReactForms.css` is hand-written, never passes through the build, and ships from the package
root for consumers to import as `@luminix/react/css/ReactForms.css`. Its selectors are the class
names the components emit (`luminix-form`, `luminix-form-control`, `luminix-form-{type}-input`), so
renaming one in `src/` silently unstyles that input.

`postbuild` copies `agents/` into `dist/`. Vite empties `dist/` on every build, so that copy has to
stay part of the build chain, never a one-off.

## Git

- `v1.x` is the release branch; work on `feat/`/`fix/` branches and merge into it
- every push to `v1.x` runs the tests, builds, publishes to npm and cuts a tag + GitHub Release
- semver comes from the commit subject: `(MAJOR)` -> major, `(MINOR)` -> minor, absence -> patch
- `version` in `package.json` is deliberately empty — the workflow computes it and stamps it in
  before publishing. Never commit one; a manual `npm run publish:beta` has to set it first
- commit messages and branch names in português
