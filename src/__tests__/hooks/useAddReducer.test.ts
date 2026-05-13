import { renderHook } from '@testing-library/react';
import useAddReducer from '../../hooks/useAddReducer';

const makeReducible = () => {
    const off = vi.fn();
    const reducible = { reducer: vi.fn(() => off) };
    return { reducible, off };
};

describe('useAddReducer', () => {
    it('registers the reducer with the given name and priority', () => {
        const { reducible } = makeReducible();
        const reducer = vi.fn();

        renderHook(() => useAddReducer(reducible as any, 'myReducer', reducer, 5));

        expect(reducible.reducer).toHaveBeenCalledWith('myReducer', reducer, 5);
    });

    it('defaults to priority 10 when none is supplied', () => {
        const { reducible } = makeReducible();
        const reducer = vi.fn();

        renderHook(() => useAddReducer(reducible as any, 'myReducer', reducer));

        expect(reducible.reducer).toHaveBeenCalledWith('myReducer', reducer, 10);
    });

    it('calls the cleanup function returned by reducible.reducer on unmount', () => {
        const { reducible, off } = makeReducible();

        const { unmount } = renderHook(() =>
            useAddReducer(reducible as any, 'myReducer', vi.fn())
        );

        unmount();
        expect(off).toHaveBeenCalled();
    });

    it('re-registers when the reducer function changes', () => {
        let callCount = 0;
        const off1 = vi.fn();
        const off2 = vi.fn();
        const reducible = { reducer: vi.fn(() => (callCount++ === 0 ? off1 : off2)) };
        const reducer1 = vi.fn();
        const reducer2 = vi.fn();

        const { rerender } = renderHook(
            ({ reducer }) => useAddReducer(reducible as any, 'myReducer', reducer),
            { initialProps: { reducer: reducer1 } }
        );

        rerender({ reducer: reducer2 });

        expect(off1).toHaveBeenCalled();
        expect(reducible.reducer).toHaveBeenCalledWith('myReducer', reducer2, 10);
    });
});
