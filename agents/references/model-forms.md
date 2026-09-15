# `<ModelForm>`

A `<Form>` bound to a model instance. Initial values are `item.toJson()`; `action` and `method`
come from `item.getRouteForSave()`; the error bag is `item.getErrorBag('update')` when the model
exists and `item.getErrorBag('store')` when it is new.

**Neighbours:** the underlying hook and its prop factories → `forms.md` · the middleware stack it
reuses → `form-requests.md` · which inputs the schema produces, and how to replace them →
`form-extension.md`.

```tsx
// auto-inputs from the model schema, no children
<ModelForm item={user} submitText="Save User" onSuccess={() => navigate('/users')} />

// your own layout
<ModelForm item={user}>
    {(data, { inputProps }) => (
        <>
            <input {...inputProps('name')} placeholder="Name" />
            <ModelForm.Submit>Save</ModelForm.Submit>
        </>
    )}
</ModelForm>

// pairs every listed field with a `_confirmation` input
<ModelForm item={user} confirmed={['password']} />
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `item` | `ModelType` | — | **Required.** |
| `getSaveOptions` | `(data) => ModelSaveOptions` | `() => ({})` | Passed to `item.save()`. |
| `hideSubmit` | `boolean` | `false` | Only affects the auto-rendered button. |
| `submitText` | `string` | `'Submit'` | |
| `confirmed` | `string \| string[]` | `[]` | |
| `submitComponent` | `ComponentType` | `Forms.getSubmitComponent()` | |
| `children` | `ReactNode \| (data, form) => ReactNode` | the auto-inputs and the submit button | |

Everything else — `onSubmit`, `onChange`, `onError`, `errorBag`, `autoSave`, form attributes — is
forwarded to `<Form>`.

## What happens on submit

The request does not go through the form's own HTTP path. `ModelForm` handles submission itself:

1. `onSubmit(data)` is awaited, and returning `false` from it cancels the save;
2. `item.fill(data)`;
3. `item.save(saveOptions, applyMiddlewares)` — so any middleware subscribed by an input, the CSRF
   one included, applies to the model's request;
4. `onSuccess(response)` on resolve, `onError` on reject.

`getSaveOptions(data)` returns `ModelSaveOptions`; its `additionalPayload` is merged with the
`{field}_confirmation` values picked out of the form data for every `confirmed` field, which is how
they reach the server without being model attributes.

The component also listens for the model's `save` event and re-seeds the form with `item.toJson()`,
so values the server changed (ids, timestamps, computed columns) land back in the fields.

## Sub-components

- `ModelForm.Input` — the same component as `Form.Input`
- `ModelForm.DefaultInputs` — the auto-generated inputs, to place inside custom children;
  takes `confirmed`
- `ModelForm.Submit` — a `<button type="submit" class="luminix-form-submit">`, also the default
  submit component
