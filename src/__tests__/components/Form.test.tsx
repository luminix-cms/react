import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

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
    },
}));

import Form from '../../components/Form';
import FormContext from '../../contexts/FormContext';
import useCurrentForm from '../../hooks/useCurrentForm';

describe('Form', () => {
    it('renders a <form> element', () => {
        const { container } = render(
            <Form initialValues={{ name: '' }}>
                <span />
            </Form>
        );
        expect(container.querySelector('form')).toBeInTheDocument();
    });

    it('applies the "luminix-form" base class', () => {
        const { container } = render(
            <Form initialValues={{ name: '' }}>
                <span />
            </Form>
        );
        expect(container.querySelector('form')).toHaveClass('luminix-form');
    });

    it('merges a custom className with the base class', () => {
        const { container } = render(
            <Form initialValues={{ name: '' }} className="my-form">
                <span />
            </Form>
        );
        const form = container.querySelector('form')!;
        expect(form).toHaveClass('luminix-form');
        expect(form).toHaveClass('my-form');
    });

    it('renders static children inside the form', () => {
        render(
            <Form initialValues={{ name: '' }}>
                <span data-testid="child" />
            </Form>
        );
        expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('passes data and form methods to function children', () => {
        const child = vi.fn(() => <span data-testid="fc" />);

        render(
            <Form initialValues={{ name: 'Alice' }}>
                {child}
            </Form>
        );

        expect(screen.getByTestId('fc')).toBeInTheDocument();
        // First argument to the function child is the form data
        expect(child).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Alice' }),
            expect.any(Object)
        );
    });

    it('provides FormContext to children', () => {
        let capturedForm: ReturnType<typeof useCurrentForm> | undefined;

        const Child = () => {
            capturedForm = useCurrentForm();
            return null;
        };

        render(
            <Form initialValues={{ value: 42 }}>
                <Child />
            </Form>
        );

        expect(capturedForm).toBeTruthy();
        expect(typeof capturedForm!.inputProps).toBe('function');
    });

    it('calls onSubmit with the current form data when submitted', async () => {
        const onSubmit = vi.fn(() => false as const);

        const { container } = render(
            <Form initialValues={{ email: 'test@example.com' }} onSubmit={onSubmit}>
                <button type="submit">Go</button>
            </Form>
        );

        fireEvent.submit(container.querySelector('form')!);

        await vi.waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({ email: 'test@example.com' })
            )
        );
    });

    it('exposes applyMiddlewares via the imperative ref', () => {
        const ref = React.createRef<{ applyMiddlewares: (c: unknown) => unknown }>();

        render(
            <Form initialValues={{}} ref={ref as any}>
                <span />
            </Form>
        );

        expect(typeof ref.current?.applyMiddlewares).toBe('function');
    });
});
