# `@luminix/react`

React bindings for the Luminix stack: one provider that boots `@luminix/core` and hands React
Router the application routes, a form layer that reads model schemas, and hooks over the query
builder, collections and events.

## Where to read

| Read this | When |
|---|---|
| `references/getting-started.md` | installing, booting the app, why a route never matches, the stable-identity rule every hook depends on |
| `references/forms.md` | `useForm`, `<Form>`, prop factories, seeding a form from server data, hosting a form on another element |
| `references/form-requests.md` | what a submit sends, per-form request middleware, file upload, error bags |
| `references/model-forms.md` | `<ModelForm>`, auto-generated inputs, confirmation fields, what reaches `item.save()` |
| `references/form-extension.md` | swapping input components app-wide, attribute → input mapping, CSRF, writing an input plugin |
| `references/data-fetching.md` | `useQuery`, `useBrowsableQuery`, `<PaginationProvider>`, `useRequest` |
| `references/reactivity.md` | re-rendering on model, collection and event changes; running reducers as React values |

## Owned elsewhere

- models, query builder, `route()`, `error()`, `Http` → `@luminix/core`
- `Collection`, `Client`, `Str`, `Obj`, `ServiceProvider`, the `Reducible` mixin → `@luminix/support`
- the MUI admin panel built on this layer → `@luminix/mui-cms`
- MUI replacements for the built-in inputs → `@luminix/react-mui-inputs-plugin`
- the endpoints these requests hit → `luminix/backend`
- the boot payload the provider reads out of the DOM → `luminix/frontend`
