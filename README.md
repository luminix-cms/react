# @luminix/react

Camada de integração React para o framework Luminix — conecta seu backend Laravel ao frontend com componentes, hooks e serviços prontos para uso.

## Instalação

```bash
npm install @luminix/react @luminix/core @luminix/support react react-dom react-router-dom
```

## Início rápido

### 1. Configure o provider

Envolva toda a aplicação com `LuminixProvider`, passando as rotas do React Router:

```tsx
// main.tsx
import { LuminixProvider } from '@luminix/react';
import { routes } from './routes';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <LuminixProvider routes={() => routes} />,
);
```

 > Verifique a documentação do [React Router](https://reactrouter.com/6.30.3/route/route) para entender como declarar corretamente suas rotas.

### 2. Crie um formulário

```tsx
import { useForm } from '@luminix/react';
import { route } from '@luminix/core';

export default function LoginForm() {
    const { formProps, inputProps, isSubmitting } = useForm({
        initialValues: { email: '', password: '' },
        action: route().url('login'),
        method: 'post',
        onSuccess: () => { window.location.href = '/dashboard'; },
    });

    return (
        <form {...formProps()}>
            <input type="email" placeholder="E-mail" {...inputProps('email')} />
            <input type="password" placeholder="Senha" {...inputProps('password')} />
            <button type="submit" disabled={isSubmitting}>Entrar</button>
        </form>
    );
}
```

### 3. Liste e edite modelos

```tsx
import { useBrowsableQuery, ModelForm } from '@luminix/react';
import { Model } from '@luminix/core';

// Listagem com paginação integrada à URL
function UserList() {
    const { data, loading } = useBrowsableQuery(() => Model.make('user').query());
    if (loading) return <p>Carregando...</p>;
    return <ul>{data?.map(u => <li key={u.id}>{u.get('name')}</li>)}</ul>;
}

// Formulário de edição automático
function UserEdit({ user }) {
    return <ModelForm item={user} onSuccess={() => alert('Salvo!')} />;
}
```

## Documentação completa

Consulte a [documentação completa](docs/README.md) para referência detalhada de todos os componentes, hooks e opções de configuração.
