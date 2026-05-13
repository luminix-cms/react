import { renderHook, waitFor } from '@testing-library/react';
import { Collection } from '@luminix/support';

vi.mock('@luminix/core', () => ({
    collect: vi.fn((items: unknown[]) => new Collection(items)),
    log: vi.fn(() => ({ error: vi.fn(), debug: vi.fn() })),
}));

import useQuery from '../../hooks/useQuery';

const makeBuilder = () => {
    const mockBuilder = {
        get: vi.fn(),
        first: vi.fn(),
        all: vi.fn(),
        find: vi.fn(),
    };
    return mockBuilder;
};

describe('useQuery', () => {
    it('starts in the loading state', () => {
        const builder = makeBuilder();
        builder.get.mockReturnValue(new Promise(() => {})); // never resolves

        const { result } = renderHook(() => useQuery(builder as any));

        expect(result.current.loading).toBe(true);
        expect(result.current.error).toBeNull();
        expect(result.current.data).toBeUndefined();
    });

    it('resolves data and clears loading after a successful "get" call', async () => {
        const builder = makeBuilder();
        const mockData = new Collection([{ id: 1 }, { id: 2 }]);
        builder.get.mockResolvedValue({
            data: mockData,
            meta: { current_page: 1, last_page: 1 },
            links: {},
        });

        const { result } = renderHook(() => useQuery(builder as any, { method: 'get' }));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.data).toBe(mockData);
        expect(result.current.error).toBeNull();
    });

    it('resolves data from an "all" call as a Collection', async () => {
        const builder = makeBuilder();
        const allItems = new Collection([{ id: 1 }]);
        builder.all.mockResolvedValue(allItems);

        const { result } = renderHook(() => useQuery(builder as any, { method: 'all' }));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.data).toBe(allItems);
    });

    it('wraps a single "first" result in a Collection', async () => {
        const builder = makeBuilder();
        const singleItem = { id: 99 };
        builder.first.mockResolvedValue(singleItem);

        const { result } = renderHook(() => useQuery(builder as any, { method: 'first' }));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect((result.current.data as Collection<unknown>).all()).toEqual([singleItem]);
    });

    it('sets an error and clears loading when the query rejects', async () => {
        const builder = makeBuilder();
        const networkError = new Error('Network failure');
        builder.get.mockRejectedValue(networkError);

        const { result } = renderHook(() => useQuery(builder as any));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe(networkError);
        expect(result.current.data).toBeUndefined();
    });

    it('does not trigger a request when query is null', () => {
        const { result } = renderHook(() => useQuery(null));

        // Loading stays true (initial) but no builder method is called.
        expect(result.current.loading).toBe(true);
    });

    it('passes the page option to the "get" call', async () => {
        const builder = makeBuilder();
        builder.get.mockResolvedValue({ data: new Collection([]), meta: {}, links: {} });

        renderHook(() => useQuery(builder as any, { method: 'get', page: 3 }));

        await waitFor(() =>
            expect(builder.get).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }))
        );
    });
});
