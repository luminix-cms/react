# Reacting to models, collections and events

Luminix models, collections and services are event sources that mutate in place. React does not see
those mutations; these hooks subscribe for the component's lifetime and turn them into state.
Every callback, transform and value below must be stable → `getting-started.md`.

## `useAttributes(item, options?)`

Model attributes as a plain object, re-read whenever the model emits `change`. Keys are camelCased,
so `created_at` arrives as `createdAt`.

```tsx
const { name, email, createdAt } = useAttributes(user);
```

`options.cast` defaults to `true`, which reads each attribute through the model's casts and
reducers. `false` returns the raw attribute bag, with the original keys.

## `useCollection(collection, transform?)`

Subscribes to a `Collection`'s `change` event and returns a copy, so mutating the collection
anywhere re-renders the component. With `transform`, the hook returns whatever it produces.

```tsx
const filtered = useCollection(allUsers, React.useCallback(
    (col) => col.where('active', true),
    []));
```

## `useOn(eventSource, eventName, callback)`

Adds the listener on mount, removes it on unmount, and accepts `null` as the source for the window
where the object does not exist yet.

```tsx
const handleSave = React.useCallback(({ source }) => console.log('Saved:', source), []);
useOn(user, 'save', handleSave);
```

## `useAddReducer(reducible, name, reducer, priority?)`

Registers a reducer on any `Reducible` while the component is mounted, and removes it on unmount —
extension scoped to one screen instead of the whole app. `priority` defaults to `10`; lower runs
first.

```tsx
const titleReducer = React.useCallback((value: string) => value.toUpperCase(), []);
useAddReducer(model(), 'modelPostGetTitleAttribute', titleReducer);
```

## `useApplyReducers(reducible, name, value, ...params)`

Runs a reducer stack over `value` and returns the result as a React value, re-rendering when the
stack itself changes — which is what makes a component follow reducers registered after it
mounted.

```tsx
const submitProps = useApplyReducers(Forms, 'replaceSubmitProps', { style: {} });
```
