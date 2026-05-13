// Make Func.debounce and Func.throttle passthroughs so we don't need fake timers.
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
        bag: vi.fn(() => ({ on: vi.fn(() => vi.fn()) })),
        clear: vi.fn(),
    })),
    Http: {
        getClient: vi.fn(() => ({
            get: vi.fn(),
            post: vi.fn(),
        })),
    },
    log: vi.fn(() => ({ debug: vi.fn(), error: vi.fn() })),
}));

vi.mock('../../facades/Forms', () => ({
    default: {
        create: vi.fn((cb: (id: string) => void) => {
            cb('test-form-id');
            return vi.fn();
        }),
        applyMiddlewares: vi.fn((_id: string, client: unknown) => client),
        expandUseFormProps: vi.fn(() => ({})),
        subscribe: vi.fn(() => vi.fn()),
        listen: vi.fn(() => vi.fn()),
    },
}));

import { renderHook, act } from '@testing-library/react';
import useForm from '../../hooks/useForm';

type SimpleForm = { name: string; agree: boolean; colors: string[]; size: string };

const defaultValues: SimpleForm = {
    name: 'John',
    agree: false,
    colors: [],
    size: 'M',
};

describe('useForm', () => {
    it('initialises data with the supplied initialValues', () => {
        const { result } = renderHook(() =>
            useForm({ initialValues: defaultValues })
        );
        expect(result.current.data).toEqual(defaultValues);
    });

    it('isSubmitting is false on initial render', () => {
        const { result } = renderHook(() =>
            useForm({ initialValues: defaultValues })
        );
        expect(result.current.isSubmitting).toBe(false);
    });

    // ─── inputProps ───────────────────────────────────────────────────────────

    it('inputProps returns the correct name and value', () => {
        const { result } = renderHook(() =>
            useForm({ initialValues: defaultValues })
        );
        const props = result.current.inputProps('name');
        expect(props.name).toBe('name');
        expect(props.value).toBe('John');
    });

    it('inputProps onChange updates the field value', () => {
        const { result } = renderHook(() =>
            useForm({ initialValues: defaultValues })
        );

        act(() => {
            result.current
                .inputProps('name')
                .onChange({ target: { value: 'Jane' } } as any);
        });

        expect(result.current.data.name).toBe('Jane');
    });

    // ─── setProp ──────────────────────────────────────────────────────────────

    it('setProp updates a top-level field', () => {
        const { result } = renderHook(() =>
            useForm({ initialValues: defaultValues })
        );

        act(() => result.current.setProp('name', 'Alice'));

        expect(result.current.data.name).toBe('Alice');
    });

    it('setProp supports dot-notation for nested paths', () => {
        type NestedForm = { address: { city: string } };
        const { result } = renderHook(() =>
            useForm<NestedForm>({ initialValues: { address: { city: 'NY' } } })
        );

        act(() => result.current.setProp('address.city', 'LA'));

        expect(result.current.data.address.city).toBe('LA');
    });

    it('setProp with path "." replaces the entire form data', () => {
        const { result } = renderHook(() =>
            useForm({ initialValues: defaultValues })
        );
        const replacement = { name: 'Bob', agree: true, colors: ['red'], size: 'L' };

        act(() => result.current.setProp('.', replacement));

        expect(result.current.data).toEqual(replacement);
    });

    // ─── checkboxProps ────────────────────────────────────────────────────────

    it('checkboxProps reflects boolean field state', () => {
        const { result } = renderHook(() =>
            useForm({ initialValues: defaultValues })
        );
        expect(result.current.checkboxProps('agree').checked).toBe(false);
    });

    it('checkboxProps onChange toggles a boolean field', () => {
        const { result } = renderHook(() =>
            useForm({ initialValues: defaultValues })
        );

        act(() => {
            result.current
                .checkboxProps('agree')
                .onChange({ target: { checked: true } } as any);
        });

        expect(result.current.data.agree).toBe(true);
    });

    it('checkboxProps with value adds to an array field when checked', () => {
        const { result } = renderHook(() =>
            useForm({ initialValues: defaultValues })
        );

        act(() => {
            result.current
                .checkboxProps('colors[]', 'red')
                .onChange({ target: { checked: true } } as any);
        });

        expect(result.current.data.colors).toContain('red');
    });

    it('checkboxProps with value removes from an array field when unchecked', () => {
        const { result } = renderHook(() =>
            useForm({ initialValues: { ...defaultValues, colors: ['red', 'blue'] } })
        );

        act(() => {
            result.current
                .checkboxProps('colors[]', 'red')
                .onChange({ target: { checked: false } } as any);
        });

        expect(result.current.data.colors).not.toContain('red');
        expect(result.current.data.colors).toContain('blue');
    });

    // ─── radioProps ───────────────────────────────────────────────────────────

    it('radioProps marks the current value as checked', () => {
        const { result } = renderHook(() =>
            useForm({ initialValues: defaultValues })
        );
        expect(result.current.radioProps('size', 'M').checked).toBe(true);
        expect(result.current.radioProps('size', 'L').checked).toBe(false);
    });

    it('radioProps onChange updates the field to the new value', () => {
        const { result } = renderHook(() =>
            useForm({ initialValues: defaultValues })
        );

        act(() => {
            result.current
                .radioProps('size', 'L')
                .onChange({ target: { value: 'L' } } as any);
        });

        expect(result.current.data.size).toBe('L');
    });

    // ─── selectProps ──────────────────────────────────────────────────────────

    it('selectProps reflects the current field value', () => {
        const { result } = renderHook(() =>
            useForm({ initialValues: defaultValues })
        );
        expect(result.current.selectProps('size').value).toBe('M');
    });

    it('selectProps onChange updates the field', () => {
        const { result } = renderHook(() =>
            useForm({ initialValues: defaultValues })
        );

        act(() => {
            result.current
                .selectProps('size')
                .onChange({ target: { value: 'XL' } } as any);
        });

        expect(result.current.data.size).toBe('XL');
    });

    // ─── onChange callback ────────────────────────────────────────────────────

    it('calls onChange with the updated data whenever a field changes', () => {
        const onChange = vi.fn();
        const { result } = renderHook(() =>
            useForm({ initialValues: defaultValues, onChange })
        );

        act(() => result.current.setProp('name', 'Carol'));

        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'Carol' }));
    });

    // ─── onSubmit callback ────────────────────────────────────────────────────

    it('calls onSubmit with current form data when the form is submitted', async () => {
        const onSubmit = vi.fn(() => false as const);
        const { result } = renderHook(() =>
            useForm({ initialValues: defaultValues, onSubmit })
        );

        await act(async () => {
            result.current
                .formProps()
                .onSubmit?.({ preventDefault: vi.fn() } as any);
        });

        expect(onSubmit).toHaveBeenCalledWith(defaultValues);
    });
});
