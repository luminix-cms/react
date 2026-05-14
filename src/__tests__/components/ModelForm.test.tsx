import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

import { vi, describe, expect, it } from 'vitest';

vi.mock('@luminix/support', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@luminix/support')>();
    return {
        ...actual,
        Func: {
            ...actual.Func,
            debounce: (fn: (...args: unknown[]) => unknown) => fn,
            throttle: (fn: (...args: unknown[]) => unknown) => fn,
        },
    };
});

vi.mock('@luminix/core', () => ({
    route: vi.fn(() => ({
        url: vi.fn(() => '/posts'),
        methods: vi.fn(() => ['post']),
    })),
    error: vi.fn(() => ({
        set: vi.fn(),
        bag: vi.fn(() => ({ on: vi.fn(() => vi.fn()), all: vi.fn(() => ({})) })),
        clear: vi.fn(),
    })),
    Http: { getClient: vi.fn(() => ({ get: vi.fn(), post: vi.fn() })) },
    log: vi.fn(() => ({ debug: vi.fn(), error: vi.fn() })),
}));

vi.mock('../../facades/Forms', () => ({
    default: {
        create: vi.fn((cb: (id: string) => void) => { cb('form-id'); return vi.fn(); }),
        applyMiddlewares: vi.fn((_id: string, client: unknown) => client),
        expandUseFormProps: vi.fn(() => ({})),
        subscribe: vi.fn(() => vi.fn()),
        listen: vi.fn(() => vi.fn()),
        getFormInputComponent: vi.fn(() => () => null),
        getDefaultInputsForModel: vi.fn(() => []),
    },
}));

import ModelForm from '../../components/ModelForm';

const makeModel = (overrides: Record<string, unknown> = {}) => ({
    getRouteForSave: vi.fn(() => 'luminix.posts.store'),
    getErrorBag: vi.fn(() => 'default'),
    toJson: vi.fn(() => ({ title: 'Draft', body: '' })),
    fill: vi.fn(),
    save: vi.fn(() => Promise.resolve()),
    exists: false,
    on: vi.fn(() => vi.fn()),
    ...overrides,
});

describe('ModelForm', () => {
    it('renders a <form> element', () => {
        const item = makeModel();
        const { container } = render(<ModelForm item={item as any} />);
        expect(container.querySelector('form')).toBeInTheDocument();
    });

    it('renders the default submit button', () => {
        const item = makeModel();
        render(<ModelForm item={item as any} />);
        expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('hides the submit button when hideSubmit is true', () => {
        const item = makeModel();
        render(<ModelForm item={item as any} hideSubmit />);
        expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
    });

    it('uses a custom submitText label', () => {
        const item = makeModel();
        render(<ModelForm item={item as any} submitText="Publish" />);
        expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
    });

    it('renders static children instead of the default inputs', () => {
        const item = makeModel();
        render(
            <ModelForm item={item as any}>
                <span data-testid="custom-child" />
            </ModelForm>
        );
        expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    });

    it('passes data and form methods to function children', () => {
        const item = makeModel();
        const child = vi.fn(() => <span data-testid="fn-child" />);
        render(<ModelForm item={item as any}>{child}</ModelForm>);

        expect(screen.getByTestId('fn-child')).toBeInTheDocument();
        expect(child).toHaveBeenCalledWith(
            expect.objectContaining({ title: 'Draft' }),
            expect.any(Object)
        );
    });

    it('calls item.fill with form data when the form is submitted', async () => {
        const item = makeModel();
        const { container } = render(<ModelForm item={item as any} />);

        await act(async () => {
            fireEvent.submit(container.querySelector('form')!);
        });

        expect(item.fill).toHaveBeenCalledWith(
            expect.objectContaining({ title: 'Draft' })
        );
    });

    it('calls onSubmit callback before saving', async () => {
        const item = makeModel();
        const onSubmit = vi.fn();
        const { container } = render(<ModelForm item={item as any} onSubmit={onSubmit} />);

        await act(async () => {
            fireEvent.submit(container.querySelector('form')!);
        });

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ title: 'Draft' })
        );
    });
});
