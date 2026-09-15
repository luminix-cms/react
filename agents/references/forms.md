# Forms — `useForm` and `<Form>`

`useForm` holds the state of one form: field values, the bindings for every kind of input, and the
submission flag. `<Form>` is that hook wrapped in a `<form>` element plus the context the input
components read.

**Neighbours:** what a submit actually sends, and where errors land → `form-requests.md` · a form
driven by a model → `model-forms.md` · replacing inputs app-wide → `form-extension.md`.

```tsx
const {
    data, setProp, formProps, inputProps, checkboxProps, radioProps, selectProps,
    textareaProps, datetimeLocalProps, isSubmitting, form, errorBag,
    subscribe, applyMiddlewares,
} = useForm({
    initialValues: { email: '', password: '', remember: false },
    action: route().url('login'),
    method: 'post',
    onSuccess: () => navigate('/dashboard'),
});

<form {...formProps()}>
    <input type="email" {...inputProps('email')} />
    <input type="checkbox" {...checkboxProps('remember')} />
    <button disabled={isSubmitting}>Login</button>
</form>
```

| Option | Type | Default | Notes |
|---|---|---|---|
| `initialValues` | `T` | — | **Required.** |
| `action` | `string` | — | Request URL. Without it nothing is sent. |
| `method` | `HttpMethod` | `'get'` | Also the `method` attribute `formProps()` puts on the element, uppercased. |
| `onSubmit` | `(data) => false \| void \| Promise<false \| void>` | — | Awaited before the request; returning `false` skips it. |
| `onChange` | `(data) => void` | — | Receives the next state on every `setProp`. |
| `onSuccess` | `(response: Response) => void` | — | 2xx only. |
| `onError` | `(error: unknown) => void` | — | A failed `Response`, or whatever was thrown. |
| `transformPayload` | `(payload: T) => T` | identity | Reshapes the body only, never the state. |
| `tap` | `(client: Client) => Client` | identity | Applied to the client just before the request. |
| `preventDefault` | `boolean` | `true` | `false` → `formProps()` omits `onSubmit` and the browser submits natively. |
| `errorBag` | `string` | `'default'` | |
| `autoSave` | `boolean` | `false` | Dispatches a submit event on the form element, debounced. |
| `debounce` | `number` | `1000` | Auto-save delay, in ms. |
| `debug` | `boolean` | `false` | Throttled log of every state change and of the middleware stack. |

## Binding inputs

| Factory | Element | Binding |
|---|---|---|
| `inputProps(name, sanitize?)` | `<input>` | `value` / `onChange`; `sanitize` maps the change event to the stored value, default `e.target.value` |
| `textareaProps(name, sanitize?)` | `<textarea>` | the same function as `inputProps` |
| `selectProps(name)` | `<select>` | `value` / `onChange` |
| `checkboxProps(name)` | boolean checkbox | `checked` from the truthiness of the field |
| `checkboxProps('tags[]', value)` | one checkbox of a set | keeps an array under `tags`; needs both the `[]` suffix and a `value` |
| `radioProps(name, value)` | `<input type="radio">` | `checked` when the field equals `value` |
| `datetimeLocalProps(name)` | `<input type="datetime-local">` | reads a `Date` or date string, writes back an ISO string, or `null` when cleared |

`formProps()` returns `onSubmit`, `action`, `method` and the `ref` that `autoSave`, `form` and
native submission depend on — spread it on whatever element hosts the fields, even when that
element is not a literal `<form>`.

`setProp(path, value)` writes with dot notation (`'address.city'`); the path `'.'` replaces the
whole state. `form` is the `HTMLFormElement`, `undefined` before the first commit.

⚠️ `setProp` and the prop factories are rebuilt on every data change, and their memo also depends
on the option callbacks — usually inline arrows, so a new identity every render. An effect that
lists `setProp` in its deps and calls it unconditionally re-renders forever. It stays silent in
production; only dev surfaces it, as repeated React warnings. Hence the seeding recipe below.

⚠️ `autoSave` starts its timer on mount, not on first change, so a form mounted with it submits
once `debounce` ms later without any user input.

## `<Form>`

Takes `UseFormOptions` plus the usual `<form>` attributes, adds the `luminix-form` class, and
provides the form context. Children may be a render function `(data, form) => ReactNode`, where
`form` is the `useForm` return minus `data`. A ref on `<Form>` exposes `applyMiddlewares`.

`<Form.Input>` resolves the component registered for `type` and wraps it in a
`luminix-form-control` div, marked `luminix-form-control-error` while that field has an error. It
reads the enclosing form from context, so it works only inside `<Form>` or `<ModelForm>`.

```tsx
<Form initialValues={{ name: '' }} action="/api/users" method="post" onSuccess={() => alert('Created!')}>
    <Form.Input type="text" name="title" label="Title" />
    <Form.Input type="select" name="status" label="Status" options={[{ value: 'active', label: 'Active' }]} />
    <button type="submit">Save</button>
</Form>
```

`useCurrentForm()` returns the same form object from any descendant, which is how custom inputs
reach `inputProps` and `errorBag` → `form-extension.md`.

## Seeding a form from async server data

One-shot ref guard, because of the identity trap above:

```tsx
const seededRef = React.useRef(false);
React.useEffect(() => {
    if (!serverData || seededRef.current) return;
    seededRef.current = true;
    setProp('.', mapServerData(serverData));      // '.' replaces the whole state
}, [serverData, setProp]);
```

## A form that is not a `<form>` element

Spread `formProps()` onto whatever hosts the fields — MUI's `component="form"`, for instance:

```tsx
const form = useForm({
    initialValues: INITIAL_VALUES,
    action: route().url('admin.site_options.update'),
    method: 'post',
});

<Grid component="form" {...form.formProps()}>
    <TextField {...form.inputProps('name')} />
    <Button type="submit" disabled={form.isSubmitting}>Save</Button>
</Grid>
```
