/**
 * Tests for Form/Input — the generic wrapper that delegates to a component
 * resolved from the Forms facade and applies the luminix-form-control classes.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

vi.mock('@luminix/core', () => ({
    error: vi.fn(() => ({
        bag: vi.fn(() => ({ on: vi.fn(() => vi.fn()), all: vi.fn(() => ({})) })),
        clear: vi.fn(),
    })),
}));

vi.mock('../../facades/Forms', () => ({
    default: {
        getFormInputComponent: vi.fn(),
    },
}));

// Directly mock useErrors so the error-class test can control the returned value.
vi.mock('../../hooks/useErrors', () => ({ default: vi.fn(() => ({})) }));

import Forms from '../../facades/Forms';
import { default as useErrors } from '../../hooks/useErrors';
import FormContext from '../../contexts/FormContext';
import Input from '../../components/Form/Input';

const MockTextInput = ({ name }: { name: string }) => (
    <input data-testid="mock-input" name={name} />
);

const mockForm = {
    errorBag: 'default',
    inputProps: vi.fn((n: string) => ({ name: n, value: '', onChange: vi.fn() })),
    checkboxProps: vi.fn(),
    radioProps: vi.fn(),
    textareaProps: vi.fn(),
    selectProps: vi.fn(),
    datetimeLocalProps: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    data: {},
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FormContext.Provider value={{ form: mockForm }}>
        {children}
    </FormContext.Provider>
);

describe('Form/Input wrapper', () => {
    beforeEach(() => {
        vi.mocked(Forms.getFormInputComponent).mockReturnValue(MockTextInput as any);
    });

    it('resolves the component via Forms.getFormInputComponent', () => {
        render(<Input name="title" type="text" />, { wrapper });
        expect(Forms.getFormInputComponent).toHaveBeenCalledWith('text');
    });

    it('renders the resolved component inside a form-control div', () => {
        render(<Input name="title" type="text" />, { wrapper });
        expect(screen.getByTestId('mock-input')).toBeInTheDocument();
        expect(document.querySelector('.luminix-form-control')).toBeInTheDocument();
    });

    it('adds the type-specific CSS class to the wrapper div', () => {
        render(<Input name="title" type="text" />, { wrapper });
        expect(document.querySelector('.luminix-form-text-control')).toBeInTheDocument();
    });

    it('adds the error class when useErrors returns an error for the field', () => {
        vi.mocked(useErrors).mockReturnValue({ titleError: 'Title is required' });

        render(<Input name="title" type="text" />, { wrapper });

        expect(document.querySelector('.luminix-form-control-error')).toBeInTheDocument();

        vi.mocked(useErrors).mockReturnValue({});
    });
});
