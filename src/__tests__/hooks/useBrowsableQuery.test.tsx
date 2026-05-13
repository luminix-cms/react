import React from 'react';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Isolate from the real useQuery and @luminix/core so this test only covers
// useBrowsableQuery's own logic (URL param extraction, builder setup, cleanup).
vi.mock('../../hooks/useQuery', () => ({
    default: vi.fn(() => ({
        loading: false,
        data: null,
        error: null,
        refresh: vi.fn(),
    })),
}));

vi.mock('@luminix/core', () => ({
    collect: vi.fn(),
    log: vi.fn(() => ({ error: vi.fn() })),
}));

import useQuery from '../../hooks/useQuery';
import useBrowsableQuery from '../../hooks/useBrowsableQuery';

const makeBuilder = () => {
    const builder = {
        include: vi.fn(),
    };
    builder.include.mockReturnValue(builder);
    return builder;
};

const wrap =
    (initialPath = '/list') =>
    ({ children }: { children: React.ReactNode }) =>
        <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>;

describe('useBrowsableQuery', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls queryFactory and builder.include with current search params on mount', () => {
        const builder = makeBuilder();
        const queryFactory = vi.fn(() => builder as any);

        renderHook(() => useBrowsableQuery(queryFactory), { wrapper: wrap('/list?status=active') });

        expect(queryFactory).toHaveBeenCalled();
        expect(builder.include).toHaveBeenCalled();
    });

    it('defaults to page 1 when the URL has no "page" param', () => {
        const builder = makeBuilder();
        renderHook(() => useBrowsableQuery(() => builder as any), {
            wrapper: wrap('/list'),
        });

        // useQuery is called with the builder and page: 1 (default)
        expect(vi.mocked(useQuery)).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ page: 1 })
        );
    });

    it('reads the "page" param from the URL and passes it to useQuery', () => {
        const builder = makeBuilder();
        renderHook(() => useBrowsableQuery(() => builder as any), {
            wrapper: wrap('/list?page=4'),
        });

        expect(vi.mocked(useQuery)).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ page: 4 })
        );
    });

    it('forwards the loading / data / error state from useQuery', () => {
        vi.mocked(useQuery).mockReturnValue({
            loading: true,
            data: undefined,
            error: null,
            refresh: vi.fn(),
        } as any);

        const builder = makeBuilder();
        const { result } = renderHook(
            () => useBrowsableQuery(() => builder as any),
            { wrapper: wrap('/list') }
        );

        expect(result.current.loading).toBe(true);
        expect(result.current.error).toBeNull();
    });
});
