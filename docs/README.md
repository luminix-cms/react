# @luminix/react — Documentação Completa

## Índice

- [Visão Geral](#visão-geral)
- [Instalação](#instalação)
- [LuminixProvider](#luminixprovider)
- [Formulários](#formulários)
  - [useForm](#useform)
  - [Form](#form)
  - [ModelForm](#modelform)
- [Consultas e Dados](#consultas-e-dados)
  - [useQuery](#usequery)
  - [useBrowsableQuery](#usebrowsablequery)
  - [useRequest](#userequest)
  - [useAttributes](#useattributes)
  - [useCollection](#usecollection)
- [Hooks de Contexto](#hooks-de-contexto)
  - [useCurrentForm](#usecurrentform)
  - [useModelFormItem](#usemodelformitem)
  - [useErrors](#useerrors)
  - [usePagination](#usepagination)
- [Hooks de Extensão](#hooks-de-extensão)
  - [useOn](#useon)
  - [useAddReducer](#useaddreducer)
  - [useApplyReducers](#useapplyreducers)
- [Facade Forms](#facade-forms)
- [Extensibilidade](#extensibilidade)

---

## Visão Geral

`@luminix/react` é a camada React do framework Luminix. Ela conecta o backend Laravel (via `luminix/backend`) ao frontend React, fornecendo:

- **Bootstrap automático** — lê o embed JSON gerado pela diretiva `@luminixEmbed()` e inicializa a aplicação.
- **Formulários reativos** — `useForm`, `<Form>` e `<ModelForm>` com gerenciamento de estado, validação e envio.
- **Consultas a modelos** — `useQuery` e `useBrowsableQuery` sincronizados com a URL.
- **Extensibilidade** — middleware de formulário, reducers e facades para customização sem modificar o núcleo.

### Arquitetura do ecossistema

```
Laravel (backend)
  └─ luminix/backend   → endpoints CRUD /luminix-api/{model}
  └─ luminix/frontend  → @luminixEmbed() insere JSON no DOM

JavaScript (frontend)
  └─ @luminix/support  → Application, Collection, Http Client, utilitários
  └─ @luminix/core     → App, Model, Auth, Route, Http, Error (fachadas)
  └─ @luminix/react    → LuminixProvider, hooks, Form, ModelForm  ← você está aqui
```

---

## Instalação

```bash
npm install @luminix/react @luminix/core @luminix/support react react-dom react-router-dom
```

**Peer dependencies obrigatórias:**

| Pacote | Versão mínima |
|---|---|
| `react` | `^18.3` |
| `react-dom` | `^18.3` |
| `react-router-dom` | `^6.25` |
| `@luminix/core` | `^0.4` |
| `@luminix/support` | `^0.4.9` |

---

## LuminixProvider

Componente raiz que inicializa o framework e configura o roteamento.

```tsx
import { LuminixProvider } from '@luminix/react';
import { RouteObject } from 'react-router-dom';

const routes: RouteObject[] = [
    { path: '/', element: <Home /> },
    { path: '/users', element: <UserList /> },
];

ReactDOM.createRoot(document.getElementById('root')!).render(
    <LuminixProvider
        routes={() => routes}
        config={{ app: { debug: true } }}
        onReady={() => console.log('Luminix pronto')}
    />,
);
```

### Props

| Prop | Tipo | Descrição |
|---|---|---|
| `routes` | `(app: AppFacade) => RouteObject[]` | **Obrigatório.** Função que retorna as rotas do React Router. Recebe a instância da aplicação já inicializada. |
| `config` | `AppConfiguration` | Configuração extra mesclada à configuração do `@luminix/core`. |
| `providers` | `(typeof ServiceProvider)[]` | Service providers adicionais a registrar. |
| `fallbackElement` | `ReactElement` | Elemento exibido enquanto o bootstrap não termina. Padrão: `<Fallback />` (spinner). |
| `onInit` | `ApplicationEvents['init']` | Disparado antes do bootstrap. |
| `onBooting` | `ApplicationEvents['booting']` | Disparado no início do boot. |
| `onBooted` | `ApplicationEvents['booted']` | Disparado após todos os providers serem registrados. |
| `onReady` | `ApplicationEvents['ready']` | Disparado quando a aplicação está pronta para uso. |
| `onFlushing` | `ApplicationEvents['flushing']` | Disparado antes de destruir a aplicação. |
| `onFlushed` | `ApplicationEvents['flushed']` | Disparado após a destruição. |

> **Nota:** As rotas do Laravel usam `{param}`, que são convertidas automaticamente para `:param` do React Router pelo `ReactServiceProvider`.

---

## Formulários

### useForm

Hook central para gerenciamento de estado de formulários.

```tsx
import { useForm } from '@luminix/react';
import { route } from '@luminix/core';

function LoginForm() {
    const { formProps, inputProps, checkboxProps, isSubmitting } = useForm({
        initialValues: {
            email: '',
            password: '',
            remember: false,
        },
        action: route().url('login'),
        method: 'post',
        onSuccess: (response) => {
            console.log('Login OK', response.json());
        },
        onError: (error) => {
            console.error('Erro', error);
        },
    });

    return (
        <form {...formProps()}>
            <input type="email" {...inputProps('email')} />
            <input type="password" {...inputProps('password')} />
            <input type="checkbox" {...checkboxProps('remember')} />
            <button type="submit" disabled={isSubmitting}>Entrar</button>
        </form>
    );
}
```

#### Opções (`UseFormOptions<T>`)

| Opção | Tipo | Padrão | Descrição |
|---|---|---|---|
| `initialValues` | `T` | — | **Obrigatório.** Valores iniciais do formulário. |
| `action` | `string` | — | URL de envio. |
| `method` | `HttpMethod` | `'get'` | Método HTTP (`'get'`, `'post'`, `'put'`, `'patch'`, `'delete'`). |
| `onSubmit` | `(data: T) => false \| void \| Promise<...>` | — | Executado antes do envio. Retornar `false` cancela a requisição HTTP. |
| `onSuccess` | `(response: Response) => void` | — | Executado após resposta bem-sucedida. |
| `onError` | `(error: unknown) => void` | — | Executado em erros de rede ou validação. |
| `onChange` | `(data: T) => void` | — | Chamado a cada mudança de campo. |
| `transformPayload` | `(data: T) => T` | identidade | Transforma o payload antes do envio. |
| `tap` | `(client: Client) => Client` | identidade | Customiza o cliente HTTP antes do envio. |
| `errorBag` | `string` | `'default'` | Nome do bag de erros de validação. |
| `autoSave` | `boolean` | `false` | Submete automaticamente após `debounce` ms de inatividade. |
| `debounce` | `number` | `1000` | Tempo em ms para o auto-save. |
| `preventDefault` | `boolean` | `true` | Chama `event.preventDefault()` no submit. |
| `debug` | `boolean` | `false` | Loga mudanças de estado no console. |

#### Retorno (`UseForm<T>`)

| Propriedade | Tipo | Descrição |
|---|---|---|
| `data` | `T` | Estado atual do formulário. |
| `setProp(path, value)` | `fn` | Define um campo pelo caminho (suporta notação de ponto). Use `'.'` para substituir todo o estado. |
| `formProps()` | `fn` | Props para o elemento `<form>`. |
| `inputProps(name, sanitizeFn?)` | `fn` | Props para `<input>` de texto. |
| `checkboxProps(name, value?)` | `fn` | Props para `<input type="checkbox">`. Suporta seleção múltipla via `name[]`. |
| `radioProps(name, value)` | `fn` | Props para `<input type="radio">`. |
| `textareaProps(name, sanitizeFn?)` | `fn` | Props para `<textarea>`. |
| `selectProps(name)` | `fn` | Props para `<select>`. |
| `datetimeLocalProps(name)` | `fn` | Props para `<input type="datetime-local">`. Converte para/de ISO 8601. |
| `isSubmitting` | `boolean` | `true` enquanto a requisição está em andamento. |
| `subscribe(middleware)` | `fn` | Adiciona middleware ao stack de envio deste formulário. Retorna função de remoção. |
| `applyMiddlewares(client)` | `fn` | Aplica todos os middlewares registrados ao cliente HTTP. |
| `errorBag` | `string` | Nome do bag de erros atual. |

---

### Form

Componente wrapper em torno de `useForm`. Expõe o estado do formulário via contexto para todos os filhos.

```tsx
import { Form } from '@luminix/react';

// Com filhos estáticos
<Form initialValues={{ name: '' }} action="/api/save" method="post">
    <Form.Input type="text" name="name" label="Nome" />
    <button type="submit">Salvar</button>
</Form>

// Com render prop (acessa dados e métodos do form)
<Form initialValues={{ name: '' }} action="/api/save" method="post">
    {(data, form) => (
        <>
            <input {...form.inputProps('name')} />
            <span>{data.name}</span>
            <button type="submit">Salvar</button>
        </>
    )}
</Form>
```

#### `Form.Input`

Componente de input que consome o contexto do `<Form>`. Renderiza o tipo correto automaticamente.

```tsx
<Form.Input type="text" name="email" label="E-mail" />
<Form.Input type="checkbox" name="active" label="Ativo" />
<Form.Input type="select" name="role" label="Perfil" options={[
    { value: 'admin', label: 'Administrador' },
    { value: 'user', label: 'Usuário' },
]} />
```

**Tipos suportados:** `text`, `email`, `password`, `number`, `tel`, `url`, `search`, `color`, `date`, `time`, `month`, `week`, `range`, `hidden`, `image`, `file`, `checkbox`, `radio`, `select`, `textarea`, `datetime-local`.

---

### ModelForm

Formulário especializado que opera sobre uma instância de `Model` do Luminix. Detecta automaticamente se é criação ou atualização e chama `model.save()`.

```tsx
import { ModelForm } from '@luminix/react';
import { Model } from '@luminix/core';

// Formulário automático (gera inputs a partir do schema do modelo)
function EditUser({ user }) {
    return (
        <ModelForm
            item={user}
            submitText="Atualizar usuário"
            onSuccess={() => alert('Salvo!')}
        />
    );
}

// Formulário customizado com render prop
function EditUser({ user }) {
    return (
        <ModelForm item={user} onSuccess={() => alert('Salvo!')}>
            {(data, form) => (
                <>
                    <input {...form.inputProps('name')} placeholder="Nome" />
                    <ModelForm.Submit>Salvar</ModelForm.Submit>
                </>
            )}
        </ModelForm>
    );
}

// Campos com confirmação (ex.: alteração de senha)
<ModelForm
    item={user}
    confirmed={['password']}
    // Envia automaticamente `password_confirmation` no payload
/>
```

#### Props (`ModelFormProps`)

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `item` | `Model` | — | **Obrigatório.** Instância do modelo Luminix. |
| `children` | `ReactNode \| (data, form) => ReactNode` | — | Conteúdo customizado. Se omitido, usa `DefaultFormInputs`. |
| `getSaveOptions` | `(data) => ModelSaveOptions` | `() => ({})` | Opções extras para `model.save()`. |
| `confirmed` | `string \| string[]` | `[]` | Campos que exigem campo de confirmação (`*_confirmation`). |
| `hideSubmit` | `boolean` | `false` | Oculta o botão de submit padrão. |
| `submitText` | `string` | `'Submit'` | Texto do botão de submit. |
| `submitComponent` | `React.ComponentType<ButtonHTMLAttributes>` | — | Componente customizado para o botão de submit. Substitui o padrão apenas nesta instância. Tem precedência sobre o reducer `replaceSubmitComponent`. |

**Sub-componentes disponíveis:**

- `ModelForm.Input` — mesmo que `Form.Input`
- `ModelForm.DefaultInputs` — renderiza todos os inputs gerados pelo schema
- `ModelForm.Submit` — botão de submit estilizado

---

## Consultas e Dados

### useQuery

Busca uma lista de modelos a partir de um query builder do Luminix.

```tsx
import { useQuery } from '@luminix/react';
import { Model } from '@luminix/core';

function UserList() {
    const query = React.useMemo(() => Model.make('user').query().orderBy('name'), []);
    const { data, loading, error, refresh } = useQuery(query);

    if (loading) return <p>Carregando...</p>;
    if (error) return <p>Erro: {error.message}</p>;

    return (
        <>
            <ul>{data?.map(u => <li key={u.id}>{u.get('name')}</li>)}</ul>
            <button onClick={refresh}>Atualizar</button>
        </>
    );
}
```

 > Sempre que a instância `query` for alterada, o hook `useQuery` será reexecutado e atualizará o estado da consulta.

#### Opções

| Opção | Tipo | Padrão | Descrição |
|---|---|---|---|
| `method` | `'get' \| 'first' \| 'all' \| 'find'` | `'get'` | Método do query builder a executar. |
| `page` | `number` | `1` | Número da página (para `method: 'get'`). |
| `id` | `number \| string` | — | ID do registro (para `method: 'find'`). |

#### Retorno

| Propriedade | Descrição |
|---|---|
| `data` | `Collection<Model>` com os registros retornados. |
| `loading` | `true` enquanto a requisição está em andamento. |
| `error` | Objeto de erro, ou `null`. |
| `meta` | Metadados de paginação (`current_page`, `last_page`, `total`, etc.). |
| `links` | Links de paginação. |
| `refresh()` | Função para re-executar a consulta. |

---

### useBrowsableQuery

Versão de `useQuery` integrada aos parâmetros de URL (`useSearchParams`). Ideal para listagens com paginação e filtros na URL.

```tsx
import { useBrowsableQuery, usePagination } from '@luminix/react';
import { PaginationProvider } from '@luminix/react';
import { Model } from '@luminix/core';
import { useCallback } from 'react';

function UserList() {
    // queryFactory deve ser memorizada com useCallback
    const queryFactory = useCallback(
        () => Model.make('user').query().orderBy('name'),
        []
    );

    const { data, loading } = useBrowsableQuery(queryFactory);

    if (loading) return <p>Carregando...</p>;
    return <ul>{data?.map(u => <li key={u.id}>{u.get('name')}</li>)}</ul>;
}

// Para usar paginação, envolva com PaginationProvider
function UserListPage() {
    const queryFactory = useCallback(
        () => Model.make('user').query(),
        []
    );

    return (
        <PaginationProvider queryFactory={queryFactory}>
            <UserList />
            <Pagination />
        </PaginationProvider>
    );
}
```

> O hook reseta o estado ao ser desmontado e redireciona automaticamente para a última página se a página atual for inválida.

---

### useRequest

Hook para requisições HTTP avulsas com gerenciamento de estado de loading/error.

```tsx
import { useRequest } from '@luminix/react';

// A opção deve ser declarada fora do componente (ou com useMemo) para evitar
// requisições repetidas a cada render.
const OPTIONS = {
    route: 'luminix.user.index',
    method: 'get',
    params: { per_page: 30 },
};

function Dashboard() {
    const { response, loading, error, refresh } = useRequest<{ total: number }>(OPTIONS);

    if (loading) return <p>Carregando...</p>;
    return <p>Total de usuários: {response?.total}</p>;
}
```

| Opção | Tipo | Descrição |
|---|---|---|
| `route` | `RouteGenerator` | Nome da rota Laravel (usa o facade `Route`). |
| `url` | `string` | URL direta (alternativa a `route`). |
| `method` | `HttpMethod` | Método HTTP. |
| `params` | `object` | Parâmetros de query string. |

---

### useAttributes

Retorna os atributos de uma instância de `Model` como estado React, re-renderizando quando o modelo é atualizado.

```tsx
import { useAttributes } from '@luminix/react';

function UserCard({ user }) {
    const { name, email } = useAttributes(user);
    return (
        <>
            <input value={name} onChange={({ target }) => { user.name = target.value }} />
            <input value={email} onChange={({ target }) => { user.email = target.value }} />
        </>
    );
}
```

---

### useCollection

Mantém uma `Collection` do `@luminix/support` como estado React, re-renderizando quando a coleção muda.

```tsx
import { useCollection } from '@luminix/react';
import { collect } from '@luminix/support';

const myCollection = collect([1, 2, 3]);

function Counter() {
    const items = useCollection(myCollection);

    return (
        <>
            <button onClick={() => items.push(items.count() + 1)}>
                Adicionar item
            </button>
            <p>Items: {items.count()}</p>
        </>
    );
}
```

---

## Hooks de Contexto

Estes hooks só funcionam dentro dos componentes correspondentes.

### useCurrentForm

Retorna o objeto `UseForm` do `<Form>` ou `<ModelForm>` mais próximo na árvore.

```tsx
import { useCurrentForm } from '@luminix/react';

function SubmitButton() {
    const { isSubmitting } = useCurrentForm();
    return <button type="submit" disabled={isSubmitting}>Salvar</button>;
}
```

---

### useModelFormItem

Retorna a instância de `Model` do `<ModelForm>` mais próximo.

```tsx
import { useModelFormItem } from '@luminix/react';

function ModelInfo() {
    const item = useModelFormItem();
    return <span>{item.exists ? 'Editando' : 'Criando'}</span>;
}
```

---

### useErrors

Retorna os erros de validação de um bag específico.

```tsx
import { useErrors } from '@luminix/react';

function FieldError({ name }) {
    const errors = useErrors(); // bag 'default'
    return errors[name] ? <span className="error">{errors[name]}</span> : null;
}

// Bag customizado
const errors = useErrors('registration');
```

---

### usePagination

Retorna os dados de paginação dentro de um `<PaginationProvider>`.

```tsx
import { usePagination } from '@luminix/react';
import { useSearchParams } from 'react-router-dom';

function Pagination() {
    const { meta } = usePagination();
    const [, setParams] = useSearchParams();

    if (!meta) return null;

    return (
        <div>
            Página {meta.current_page} de {meta.last_page}
            <button onClick={() => setParams({ page: String(meta.current_page + 1) })}>
                Próxima
            </button>
        </div>
    );
}
```

---

## Hooks de Extensão

### useOn

Adiciona um listener de evento a um `EventSource` durante o ciclo de vida do componente, removendo-o automaticamente ao desmontar.

```tsx
import { useOn } from '@luminix/react';
import { Model } from '@luminix/core';

function UserForm({ user }) {
    useOn(user, 'save', () => {
        console.log('Usuário salvo!', user.toJson());
    });

    return <ModelForm item={user} />;
}
```

---

### useAddReducer

Registra um reducer em um `Reducible` durante o ciclo de vida do componente.

```tsx
import { useAddReducer, Forms } from '@luminix/react';

function WithCustomReducer() {
    // Adiciona o reducer enquanto o componente está montado
    useAddReducer(Forms, 'expandUseFormProps', (state, data) => ({
        ...state,
        // Adiciona campo extra ao estado do form
        upperName: data.name?.toUpperCase(),
    }));

    return <Form initialValues={{ name: '' }}>{/* ... */}</Form>;
}
```

---

### useApplyReducers

Executa todos os reducers de um método de um `Reducible` e retorna o resultado.

```tsx
import { useApplyReducers, Forms } from '@luminix/react';

function FormPreview({ data }) {
    const expanded = useApplyReducers(Forms, 'expandUseFormProps', {}, data);
    return <pre>{JSON.stringify(expanded, null, 2)}</pre>;
}
```

---

## Facade Forms

`Forms` é a fachada para o `FormService`, acessível globalmente.

```tsx
import { Forms } from '@luminix/react';

// Substituir o componente de input padrão para um tipo
Forms.reducer('replaceFormInputComponent', (component, type) => {
    if (type === 'text') return MyCustomTextInput;
    return component;
});

// Obter o componente registrado para um tipo
const TextComponent = Forms.getFormInputComponent('text');
```

### Principais métodos

| Método | Descrição |
|---|---|
| `Forms.create(callback)` | Cria um formulário gerenciado e chama `callback(id)` com o ID. Retorna função de limpeza. |
| `Forms.subscribe(id, middleware)` | Adiciona middleware ao stack de um formulário específico. Use `Forms.GLOBAL_MIDDLEWARE_ID` para todos. |
| `Forms.applyMiddlewares(id, client)` | Aplica os middlewares de um formulário ao cliente HTTP. |
| `Forms.expandUseFormProps(state, data)` | Executa os reducers `expandUseFormProps` e retorna estado expandido. |
| `Forms.getFormInputComponent(type)` | Retorna o componente React registrado para o tipo de input. |
| `Forms.getSubmitComponent()` | Retorna o componente de submit após aplicar o reducer `replaceSubmitComponent`. |
| `Forms.getSubmitProps()` | Retorna as props do botão de submit após aplicar o reducer `getSubmitProps`. O valor padrão é `{ style: { marginTop: '1rem' } }`. |
| `Forms.getDefaultInputsForModel(item, confirmed?)` | Gera a lista de `InputProps` a partir do schema do modelo. |
| `Forms.ensureFrontendRequestsAreStateful()` | Registra middleware global de CSRF/cookie (chamado automaticamente). |

---

## Extensibilidade

### Substituir componentes de input

Troque o componente de um tipo de input em todos os `ModelForm`:

```tsx
import { Forms } from '@luminix/react';
import MyDatePicker from './MyDatePicker';

Forms.reducer('replaceFormInputComponent', (component, type) => {
    if (type === 'date') return MyDatePicker;
    return component;
});
```

### Substituir o botão de submit globalmente

Use o reducer `replaceSubmitComponent` para trocar o botão de submit em **todos** os `ModelForm` que usam inputs padrão. Ideal para plugins de UI (ex.: `@luminix/react-mui-inputs-plugin`):

```tsx
import { Forms } from '@luminix/react';
import { Button } from '@mui/material';

Forms.reducer('replaceSubmitComponent', () => Button);
```

O componente recebe as mesmas props de `React.ButtonHTMLAttributes<HTMLButtonElement>`, incluindo `children` (o texto do botão) e `style`.

### Substituir o botão de submit por instância

Use a prop `submitComponent` diretamente no `<ModelForm>` para substituir o botão apenas naquele formulário, sem afetar os demais:

```tsx
import { ModelForm } from '@luminix/react';

function MyCustomButton({ children, ...props }) {
    return <button className="btn btn-primary" {...props}>{children}</button>;
}

<ModelForm item={user} submitComponent={MyCustomButton} submitText="Salvar usuário" />
```

> **Precedência:** `submitComponent` (por instância) tem prioridade sobre o reducer `replaceSubmitComponent` (global). Ambos respeitam `hideSubmit` — quando `hideSubmit={true}`, nenhum botão é renderizado.

### Customizar as props do botão de submit

Use o reducer `getSubmitProps` para controlar as props HTML passadas ao botão de submit em **todos** os `ModelForm`. O valor inicial (antes de qualquer reducer) é `{ style: { marginTop: '1rem' } }`.

```tsx
import { Forms } from '@luminix/react';

// Trocar o estilo padrão
Forms.reducer('getSubmitProps', (props) => ({
    ...props,
    style: { marginTop: '0.5rem' },
    className: 'btn btn-primary',
}));

// Remover o estilo padrão completamente
Forms.reducer('getSubmitProps', () => ({
    className: 'btn btn-primary',
}));

// Adicionar atributos extras sem remover os padrões
Forms.reducer('getSubmitProps', (props) => ({
    ...props,
    disabled: someCondition,
}));
```

O reducer recebe as props acumuladas até aquele ponto e deve retornar o objeto de props final. Múltiplos reducers são encadeados em ordem de registro.

### Customizar inputs por modelo

Adicione um reducer para personalizar os inputs de um modelo específico:

```tsx
import { Forms } from '@luminix/react';

Forms.reducer('selectDefaultInputsForUser', (inputList, user) => [
    ...inputList,
    {
        name: 'role',
        type: 'select',
        label: 'Role',
        options: [
            { value: 'admin', label: 'Admin' },
            { value: 'user', label: 'User' }
        ]
    }
]);
```

### Service Provider customizado

Encapsule configurações em um `ServiceProvider`:

```tsx
import { ServiceProvider } from '@luminix/support';
import { Forms } from '@luminix/react';

class AppServiceProvider extends ServiceProvider {
    boot() {
        Forms.reducer(/** adicione aqui os reducers para personalização */);
    }
}

// No LuminixProvider
<LuminixProvider
    routes={() => routes}
    providers={[AppServiceProvider]}
/>
```

---

## Tipos exportados

```ts
import type {
    LuminixProviderProps,  // Props do LuminixProvider
    FormProps,             // Props do <Form>
    ModelFormProps,        // Props do <ModelForm>
    InputProps,            // Props de um <Form.Input>
    InputPropTypeMap,      // Mapa de tipos de input para suas props HTML
} from '@luminix/react';
```
