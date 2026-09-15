# Extending the form layer — the `Forms` facade

`Forms` is the static accessor for `FormService`, bound in the container as `forms`. It is
`Reducible`: every extension point below is a named reducer stack, registered with
`Forms.reducer(name, callback, priority?)` — lower priority runs first. Register from a
`ServiceProvider.boot()`, or anywhere after `App.create()`.

**Neighbours:** the form these inputs live in → `forms.md` · the error bag they read from →
`form-requests.md` · where the auto-inputs are rendered → `model-forms.md`.

| Reducer | Signature | Use |
|---|---|---|
| `replaceFormInputComponent` | `(component, type) => component` | Swap the component rendered for an input type, app-wide |
| `replaceSubmitComponent` | `(component) => component` | Replace the submit button globally |
| `replaceSubmitProps` | `(props) => props` | Props of that button; the default is `{ style: { marginTop: '1rem' } }` |
| `getDefaultInputProps` | `(props, { attributes, confirmed, item, key }) => props \| props[]` | Rewrite one generated input, or split it into several |
| `selectDefaultInputsFor{Model}` | `(inputs, item) => inputs` | Filter, reorder or add auto-inputs for one model — `{Model}` is the model type in StudlyCase, e.g. `selectDefaultInputsForUser` |
| `expandUseFormProps` | `(state, data) => state` | Merge extra keys into the return of every `useForm` |
| `mapAttributeCastToInputTypes` | `(map, item, attribute) => map` | Override the cast → input map below |
| `mapAttributeTypeToInputTypes` | `(map, item, attribute) => map` | Override the column-type → input map below |

## Built-in input components

`Form.Input` resolves `type` through `replaceFormInputComponent`. Out of the box only `select`,
`radio`, `checkbox`, `textarea`, `datetime-local`, `file`, `text` and `csrf` have a component of
their own; every other type — `number`, `password`, `email`, `color`, `time`, `date` — falls
through to the `text` component, which renders `<input type={type}>` with whatever you passed.

## How auto-inputs are generated

`Forms.getDefaultInputsForModel(item, confirmed)` walks `item.fillable` and, for each key with a
matching attribute in the model schema, picks a type in this order — the first match wins:

| Where it looks | Value | Input type |
|---|---|---|
| attribute `cast` | `boolean` | `checkbox` |
| | `int`, `float` | `number` |
| | `datetime`, `timestamp` | `datetime-local` |
| | `date` | `date` |
| | `hashed` | `password`, plus `autoComplete: 'new-password'` |
| column `type` | `tinyint(1)` | `checkbox` |
| | `int`, `float` | `number` |
| | `timestamp` | `datetime-local` |
| | `date` | `date` |
| | `text`, `tinytext`, `mediumtext`, `longtext` | `textarea` |
| | `enum(...)` | `select`, options parsed out of the declaration, preceded by an empty `-- Select a value --` |
| otherwise | | `text` |

Each generated input gets `label: Str.human(key)` and
`id: luminix-form-{modelType}-{key or 'new'}-{attribute}`. A fillable key with no attribute in the
schema produces nothing. Every field named in `confirmed` is duplicated into a
`{field}_confirmation` input labelled `Confirm {label}`.

⚠️ The column-type reducer that actually runs is `mapAttributeTypeToInputTypes`, plural. The
exported `FormServicesReducers` type spells it `mapAttributeTypeToInputType`, and a reducer
registered under that name is never called.

## CSRF

`Forms.ensureFrontendRequestsAreStateful()` prepends a `csrf` input to the auto-inputs of every
model. The component reads `<meta name="csrf-token">` from the document, renders it as a hidden
`_token` field and subscribes a middleware that adds `_token` to the request body. It is part of
the generated input list, so a `<ModelForm>` with custom children has to render it:
`<Form.Input type="csrf" name="_token" />`.

## Swapping inputs from a plugin

```tsx
class MuiInputsProvider extends ServiceProvider {
    boot() {
        Forms.reducer('replaceFormInputComponent', (component, type) =>
            type === 'text' ? MuiTextInput : component);
    }
}
// <LuminixProvider providers={[MuiInputsProvider]} routes={routes} />
```

## Writing the component that gets swapped in

An input component receives the `InputProps` it was rendered with and reads everything else from
the form context: `inputProps` (or the factory matching its element) for the binding, `errorBag`
for the key to look the field error up under.

```tsx
function NativeTextFieldInput({ name, label, type, ...rest }) {
    const { inputProps, errorBag } = useCurrentForm();
    const { [`${Str.camel(name)}Error`]: error } = useErrors(errorBag);
    return (
        <>
            <TextField {...rest} {...inputProps(name)} label={label} type={type}
                       InputLabelProps={{ shrink: true }} />
            {error && <FormHelperText error>{error}</FormHelperText>}
        </>
    );
}
Forms.reducer('replaceFormInputComponent', (component, type) =>
    ['time', 'color'].includes(type) ? NativeTextFieldInput : component);
```
