import React from 'react';
import { renderHook } from '@testing-library/react';

import FormContext from '../../contexts/FormContext';
import ModelFormContext from '../../contexts/ModelFormContext';
import PaginationContext from '../../contexts/PaginationContext';
import useCurrentForm from '../../hooks/useCurrentForm';
import useModelFormItem from '../../hooks/useModelFormItem';
import usePagination from '../../hooks/usePagination';

// ─── useCurrentForm ───────────────────────────────────────────────────────────

describe('useCurrentForm', () => {
    it('returns the form object from FormContext', () => {
        const mockForm = { data: { name: 'test' }, isSubmitting: false };

        const { result } = renderHook(() => useCurrentForm(), {
            wrapper: ({ children }) => (
                <FormContext.Provider value={{ form: mockForm }}>
                    {children}
                </FormContext.Provider>
            ),
        });

        expect(result.current).toBe(mockForm);
    });

    it('returns null when rendered without a FormContext.Provider', () => {
        const { result } = renderHook(() => useCurrentForm());
        expect(result.current).toBeNull();
    });
});

// ─── useModelFormItem ─────────────────────────────────────────────────────────

describe('useModelFormItem', () => {
    it('returns the item from ModelFormContext', () => {
        const mockItem = { id: 42, name: 'Widget' } as any;

        const { result } = renderHook(() => useModelFormItem(), {
            wrapper: ({ children }) => (
                <ModelFormContext.Provider value={{ item: mockItem }}>
                    {children}
                </ModelFormContext.Provider>
            ),
        });

        expect(result.current).toBe(mockItem);
    });
});

// ─── usePagination ────────────────────────────────────────────────────────────

describe('usePagination', () => {
    it('returns the value provided by PaginationContext.Provider', () => {
        const mockValue = {
            refresh: vi.fn(),
            loading: false,
            error: null,
        } as any;

        const { result } = renderHook(() => usePagination(), {
            wrapper: ({ children }) => (
                <PaginationContext.Provider value={mockValue}>
                    {children}
                </PaginationContext.Provider>
            ),
        });

        expect(result.current).toBe(mockValue);
    });

    it('exposes an Error when rendered outside a PaginationContext.Provider', () => {
        const { result } = renderHook(() => usePagination());
        expect(result.current.error).toBeInstanceOf(Error);
    });
});
