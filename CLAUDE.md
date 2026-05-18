# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@luminix/react` is the React binding layer for the Luminix full-stack framework. It sits between `@luminix/core` (framework logic) and the consuming React application, providing components, hooks, and services for forms, routing, and app initialization.

Full documentation can be found in `README.md` and `docs/README.md`.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Compile TypeScript + bundle with Vite (outputs dist/react.js + types/)
npm run test         # Run test suite
npm run build        # Build dist version
```

## Ecosystem Architecture

The Luminix stack has two sides:

**Backend (PHP/Laravel):**
- `luminix/backend` — Generates RESTful CRUD endpoints from Eloquent models with the `LuminixModel` trait. All routes are under `/luminix-api/{model-plural}`.
- `luminix/frontend` — Prepares bootstrap data (model schema, named routes, auth state, CSRF token) and embeds it into the HTML DOM via `@luminixEmbed()` Blade directive.

**Frontend (JavaScript):**
- `@luminix/support` — Foundation: `Application` service container, `Collection`, `PropertyBag`, `EventSource`, HTTP `Client`, `Reducible`/`Macroable`/`MakeFacade` mixins, and utility classes (`Str`, `Obj`, `Arr`, `Func`, `Query`, `DateTime`).
- `@luminix/core` (`../js-core`) — Framework-agnostic layer: reads the DOM embed, provides `App`, `Model`, `Auth`, `Config`, `Http`, `Route`, `Log`, and `Error` facades. Contains the Eloquent-like `Model` system with relations (HasOne, HasMany, BelongsTo, BelongsToMany, morph variants) and a query builder.
- **`@luminix/react` (this repo)** — React bindings: `LuminixProvider`, form hooks/components, routing integration, and the `FormService`.

### Bootstrap Flow

1. Laravel renders `@luminixEmbed()` → embeds JSON in the DOM.
2. `<LuminixProvider>` calls `App.create()` which reads the embed, registers services, and generates React Router routes by converting Laravel `{param}` syntax to `:param`.
3. Components and hooks access services via facades (`Forms`) or React context.

## Source Structure

```
src/
├── components/
│   ├── LuminixProvider.tsx     # Root provider — initializes App, sets up react-router-dom
│   ├── Form.tsx                # Generic form wrapper around useForm
│   ├── ModelForm.tsx           # Model-aware form (create/update with auto-inputs)
│   ├── PaginationProvider.tsx
│   ├── Fallback.tsx            # Loading UI shown during App initialization
│   ├── Form/Input/             # Built-in input components (Text, Checkbox, Radio, Select,
│   │                           #   Textarea, DatetimeLocal, File, Csrf)
│   └── ModelForm/              # Submit button + DefaultFormInputs
├── contexts/                   # React Contexts (LuminixContext, FormContext,
│                               #   ModelFormContext, PaginationContext)
├── hooks/                      # 13 custom hooks
├── services/FormService.ts     # Maps model attribute types → input components;
│                               #   manages middleware stacks; handles CSRF
├── facades/Forms.ts            # Facade over FormService (singleton accessor)
├── types/Form.ts               # All TypeScript types for forms
├── ReactServiceProvider.ts     # Registers FormService; converts route param syntax
└── index.ts                    # Public exports
```

## Key Abstractions

### `LuminixProvider`
Wraps the entire app. Accepts `routes` (React Router route objects), `config` (merged into `@luminix/core` config), `providers` (additional `ServiceProvider` instances), and lifecycle callbacks (`onInit`, `onBooting`, `onBooted`, `onReady`, `onFlushing`, `onFlushed`). Renders `<Fallback>` until `App` is booted.

### `useForm`
Core hook for all form state. Manages field values with dot-notation paths, handles submission (including `transformPayload`), auto-save with debounce, middleware stacks, and multi-bag error handling. Returns typed props factories: `inputProps(name)`, `checkboxProps(name, value)`, `radioProps(name, value)`, `selectProps(name)`, `textareaProps(name)`, `datetimeLocalProps(name)`.

### `FormService` + `Forms` facade
`FormService` is a `Reducible` service registered into the `Application` container. It:
- Maps model attribute types to input component constructors (e.g., `string` → `Text`, `boolean` → `Checkbox`).
- Provides a global middleware stack for outgoing form requests (used to inject CSRF token).
- Is extended via `Forms.subscribe(reducer)` or `Forms.listen(event, handler)`.

The `Forms` facade is the static accessor: `Forms.create()`, `Forms.applyMiddlewares(client)`, `Forms.expandUseFormProps(props)`.

### `ModelForm`
Renders a form driven by a Luminix `Model` instance. Calls `model.save()` or `model.update()` under the hood. Accepts `getSaveOptions()` for `ModelSaveOptions`, `confirmed` (array of field names requiring a confirmation dialog), `hideSubmit`, and `submitText`.

### `useRequest` / `useQuery` / `useBrowsableQuery`
- `useRequest` — Wraps `@luminix/core`'s HTTP facade with React lifecycle (loading state, error handling, middleware application).
- `useQuery` — Binds form data to URL query parameters.
- `useBrowsableQuery` — Enhanced version that resets state on unmount.

### `useCollection`
Manages a `@luminix/support` `Collection` as React state, re-rendering on `change` events.

## Patterns to Follow

**Reducible/Middleware extension** — To add global behavior to form requests, use `Forms.subscribe(middleware)` rather than modifying `FormService` directly. Reducers receive a priority number (lower = earlier).

**Route param conversion** — `ReactServiceProvider` converts all `{param}` in route paths to `:param` for React Router. When adding new route handling, maintain this convention.

**Build output** — The library is ESM-only (`dist/react.js`). All peer dependencies (`react`, `react-dom`, `react-router-dom`, `@luminix/core`, `@luminix/support`) are externalized and must not be bundled.

**Type generation** — `vite-plugin-dts` auto-generates `types/index.d.ts` from `src/index.ts` exports. Everything the library exposes must be re-exported from `src/index.ts`.

**Testing and Documentation** - When modifying the source code, make sure to update the documentation in `README.md` and `docs/README.md`. Also, write tests for new features.
