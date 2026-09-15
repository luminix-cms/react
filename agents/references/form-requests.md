# What a form sends, and what comes back

**Neighbours:** the options named here → `forms.md` · a model form, which replaces this whole
chain with `item.save()` → `model-forms.md` · requests that are not a form → `data-fetching.md`.

Submitting runs, in order:

1. `onSubmit(data)`, awaited — returning `false` stops here;
2. nothing else happens unless `action` is set;
3. the client is built: the per-form middleware stack, then `tap`;
4. the request goes out as `method` with `transformPayload(data)` as the body;
5. 2xx → `onSuccess(response)`. A failed response reaches `onError` as the `Response` itself, and
   a 422 fills the error bag on the way; anything thrown reaches `onError` unwrapped.

`isSubmitting` is true for the whole chain, including `onSubmit`.

## Per-form request middleware — `subscribe`

Mutates the client of this form only; global configuration is untouched. `subscribe` returns its
own unsubscribe function, so it doubles as the effect cleanup:

```tsx
const { subscribe } = useForm({ /* ... */ });

React.useEffect(() => subscribe(
    (client) => client.withHeaders({ 'X-Custom': 'value' })
), [subscribe]);
```

This is how the built-in inputs extend the request: the file input switches the client to
multipart, the CSRF input appends `_token` → `form-extension.md`. `applyMiddlewares(client)` runs
that stack by hand, for a request the form does not make itself — it is what `<ModelForm>` hands to
`item.save()`.

## File upload

`<Form.Input type="file">` subscribes the multipart middleware (`client.asForm()`) and stores the
field as the input's `FileList`:

```tsx
<Form initialValues={{ file: null }} action={route().url('luminix.player.import')} method="post"
    onSuccess={() => { notify('Imported'); navigate(-1); }}
    onError={(e) => notify({ message: e?.response?.data?.message ?? 'Error', severity: 'error' })}>
    <Form.Input name="file" label="File" type="file" required accept=".csv,.xlsx" />
    <button type="submit">Import</button>
</Form>
```

## Errors — `useErrors(bag?)`

A 422 fills the form's error bag, one entry per field, each field's messages joined with `, `.
`useErrors` subscribes to a bag and returns `{ camelCaseFieldName }Error` keys — `email` becomes
`emailError`, `birth_date` becomes `birthDateError`. It clears the bag when the component unmounts.

The `errorBag` option is what keeps two forms on the same page from showing each other's messages;
the built-in inputs read it from the form context and display their own field error unprompted.

```tsx
const { formProps, inputProps, isSubmitting } = useForm({
    initialValues: { email: '', password: '' },
    action: route().url('login'), method: 'post',
    errorBag: 'login',
});
const { emailError, passwordError } = useErrors('login');

<form {...formProps()}>
    <input {...inputProps('email')} />
    {emailError && <span>{emailError}</span>}
    <button disabled={isSubmitting}>Login</button>
</form>
```
