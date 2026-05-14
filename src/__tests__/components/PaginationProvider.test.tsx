import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Isolate from real HTTP / router internals.
vi.mock('../../hooks/useBrowsableQuery', () => ({
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

import useBrowsableQuery from '../../hooks/useBrowsableQuery';
import PaginationProvider from '../../components/PaginationProvider';
import usePagination from '../../hooks/usePagination';

const factory = vi.fn(() => ({} as any));

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>{children}</MemoryRouter>
);

describe('PaginationProvider', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders its children', () => {
        render(
            <PaginationProvider factory={factory}>
                <span data-testid="child" />
            </PaginationProvider>,
            { wrapper }
        );
        expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('exposes the loading state from useBrowsableQuery via PaginationContext', () => {
        vi.mocked(useBrowsableQuery).mockReturnValue({
            loading: true,
            data: undefined,
            error: null,
            refresh: vi.fn(),
        });

        const Consumer = () => {
            const { loading } = usePagination();
            return <span data-testid="state">{String(loading)}</span>;
        };

        render(
            <PaginationProvider factory={factory}>
                <Consumer />
            </PaginationProvider>,
            { wrapper }
        );

        expect(screen.getByTestId('state')).toHaveTextContent('true');
    });

    it('exposes the error state from useBrowsableQuery via PaginationContext', () => {
        const err = new Error('Query failed');
        vi.mocked(useBrowsableQuery).mockReturnValue({
            loading: false,
            data: undefined,
            error: err,
            refresh: vi.fn(),
        });

        const Consumer = () => {
            const { error } = usePagination();
            return <span data-testid="err">{error?.message ?? 'none'}</span>;
        };

        render(
            <PaginationProvider factory={factory}>
                <Consumer />
            </PaginationProvider>,
            { wrapper }
        );

        expect(screen.getByTestId('err')).toHaveTextContent('Query failed');
    });

    it('calls factory once to create the initial query', () => {
        render(
            <PaginationProvider factory={factory}>
                <span />
            </PaginationProvider>,
            { wrapper }
        );
        expect(useBrowsableQuery).toHaveBeenCalledWith(factory);
    });
});
