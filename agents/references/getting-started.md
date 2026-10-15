# Getting started

```bash
npm install @luminix/react @luminix/core @luminix/support react react-dom react-router-dom
```

Import the stylesheet once, at the entry point. Without it forms still work: the built-in inputs
render plain `<input>`, `<label>` and `<p>` elements carrying `luminix-form-*` classes and no
styling of their own.

```js
import '@luminix/react/css/ReactForms.css';
```

## Booting — `<LuminixProvider>`

Root component, and the only place `@luminix/core` is started. It calls `App.create()`, waits for
the `ready` event, builds a browser router out of `routes(app)` and renders it; until then it
renders `fallbackElement`. Unmounting calls `app.down()`.

```tsx
// main.tsx
const routes = (app: AppFacade): RouteObject[] => [
    { path: '/', element: <Home /> },
    { path: '/user/:id', element: <User /> },     // react-router syntax — see below
];

ReactDOM.createRoot(document.getElementById('root')!).render(
    <LuminixProvider
        routes={routes}
        config={{ app: { debug: true } }}
        providers={[MyProvider]}
        onReady={() => console.log('ready')}
        fallbackElement={<MySpinner />}
    />
);
```

| Prop | Type | Notes |
|---|---|---|
| `routes` | `(app: AppFacade) => RouteObject[]` | **Required.** Called after `ready`, with the booted app. |
| `config` | `AppConfiguration` | Merged into `@luminix/core` config before boot. |
| `providers` | `(typeof ServiceProvider)[]` | Registered alongside `ReactServiceProvider`. |
| `fallbackElement` | `ReactElement` | Rendered while booting and while the router runs its initial loaders. Default `<Fallback />`, the package's logo + spinner. Under React Router 7 it becomes the `hydrateFallbackElement` of each top-level route; a route that declares its own `HydrateFallback` or `hydrateFallbackElement` keeps it. |
| `onInit` / `onBooting` / `onBooted` / `onReady` / `onFlushing` / `onFlushed` | `ApplicationEvents[...]` | Bound to the matching app event before `create()`. |

Anything else is forwarded to `<RouterProvider>`.

⚠️ All of those props are dependencies of the effect that boots the app. An inline
`routes={() => [...]}`, `config={{ ... }}` or `providers={[...]}` is a fresh value on every render,
and the app is torn down and re-created each time. Declare them at module scope, or memoize.

`ReactServiceProvider` is always registered. It binds `FormService` into the container as `forms`,
and registers a `replaceRouteParams` reducer on the `Route` facade rewriting `{param}` to `:param`.

⚠️ That rewrite reaches only paths the `Route` facade builds without substituting parameters —
`route().path('user.show')` gives back the `/user/:id` template. The `routes` array is passed to
`createBrowserRouter` verbatim, so write `:param` there yourself: a `{param}` segment silently
never matches, and React Router reports "No routes matched location".

`basename` and a custom `window` reach `createBrowserRouter` through a `domRouterOptions` reducer
on the `Route` facade, which the provider runs over `{}` just before building the router.

## Stable identity

Every hook here re-runs when an argument changes identity, and most of them take a function or an
object: builder, factory, options, callback, reducer, transform. An unstable argument re-fires the
effect on every render — refetch loops in `useQuery` and `useRequest`, listener churn in `useOn`,
endless re-render when an effect depends on `setProp` and also calls it. Memoize with `useMemo` /
`useCallback`, or hoist to module scope. Each hook states what it needs stable.
