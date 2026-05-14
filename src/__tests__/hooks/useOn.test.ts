import { renderHook } from '@testing-library/react';
import useOn from '../../hooks/useOn';

import { vi, describe, expect, it } from 'vitest';

const makeSource = () => {
    const off = vi.fn();
    const source = { on: vi.fn(() => off) };
    return { source, off };
};

describe('useOn', () => {
    it('registers the event listener on mount', () => {
        const { source } = makeSource();
        const callback = vi.fn();

        renderHook(() => useOn(source as any, 'change', callback));

        expect(source.on).toHaveBeenCalledWith('change', callback);
    });

    it('calls the unsubscribe function on unmount', () => {
        const { source, off } = makeSource();

        const { unmount } = renderHook(() => useOn(source as any, 'change', vi.fn()));
        unmount();

        expect(off).toHaveBeenCalled();
    });

    it('does not throw when eventSource is null', () => {
        expect(() =>
            renderHook(() => useOn(null, 'change', vi.fn()))
        ).not.toThrow();
    });

    it('unsubscribes from the old event and re-registers when the event name changes', () => {
        let callCount = 0;
        const off1 = vi.fn();
        const off2 = vi.fn();
        const source = { on: vi.fn(() => (callCount++ === 0 ? off1 : off2)) };
        const callback = vi.fn();

        const { rerender } = renderHook(
            ({ name }: { name: string }) => useOn(source as any, name, callback),
            { initialProps: { name: 'change' } }
        );

        rerender({ name: 'update' });

        expect(off1).toHaveBeenCalled();
        expect(source.on).toHaveBeenCalledWith('update', callback);
    });

    it('unsubscribes and re-registers when the callback changes', () => {
        let callCount = 0;
        const off1 = vi.fn();
        const off2 = vi.fn();
        const source = { on: vi.fn(() => (callCount++ === 0 ? off1 : off2)) };
        const cb1 = vi.fn();
        const cb2 = vi.fn();

        const { rerender } = renderHook(
            ({ cb }) => useOn(source as any, 'change', cb),
            { initialProps: { cb: cb1 } }
        );

        rerender({ cb: cb2 });

        expect(off1).toHaveBeenCalled();
        expect(source.on).toHaveBeenLastCalledWith('change', cb2);
    });
});
