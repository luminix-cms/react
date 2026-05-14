import { renderHook, act } from '@testing-library/react';
import { Collection } from '@luminix/support';
import useCollection from '../../hooks/useCollection';

import { describe, expect, it } from 'vitest';

describe('useCollection', () => {
    it('returns a snapshot of the collection on mount', () => {
        const col = new Collection([1, 2, 3]);
        const { result } = renderHook(() => useCollection(col));
        expect((result.current as Collection<number>).all()).toEqual([1, 2, 3]);
    });

    it('updates state when the collection is mutated', () => {
        const col = new Collection([1, 2]);
        const { result } = renderHook(() => useCollection(col));

        act(() => col.push(3));

        expect((result.current as Collection<number>).all()).toEqual([1, 2, 3]);
    });

    it('applies a transform function on mount', () => {
        const col = new Collection([1, 2, 3]);
        const { result } = renderHook(() =>
            useCollection(col, (c) => c.count())
        );
        expect(result.current).toBe(3);
    });

    it('re-applies the transform when the collection changes', () => {
        const col = new Collection([1, 2]);
        const { result } = renderHook(() =>
            useCollection(col, (c) => c.count())
        );
        expect(result.current).toBe(2);

        act(() => col.push(3));

        expect(result.current).toBe(3);
    });

    it('returns a new collection instance (not the same reference) after change', () => {
        const col = new Collection([1]);
        const { result } = renderHook(() => useCollection(col));

        const before = result.current;
        act(() => col.push(2));

        expect(result.current).not.toBe(before);
        expect((result.current as Collection<number>).all()).toEqual([1, 2]);
    });
});
