import { act } from 'react';
import { render, screen } from '@testing-library/react';
import { Link, useSearchParams } from 'react-router-dom';

import { vi, describe, expect, it, beforeEach } from 'vitest';

const { app, domRouterOptions } = vi.hoisted(() => {
    const handlers: Record<string, Array<() => void>> = {};
    const app = {
        handlers,
        withConfiguration: vi.fn(),
        on: vi.fn((event: string, handler: () => void) => {
            (handlers[event] ??= []).push(handler);
        }),
        create: vi.fn(),
        down: vi.fn(),
        ready: () => (handlers.ready ?? []).forEach((handler) => handler()),
    };
    return { app, domRouterOptions: vi.fn((opts: object) => opts) };
});

vi.mock('@luminix/core', () => ({
    App: { withProviders: () => app },
    Route: { domRouterOptions },
}));

import LuminixProvider from '../../components/LuminixProvider';

const Search = () => {
    const [params] = useSearchParams();
    return <p>q={params.get('q')}</p>;
};

const routes = () => [
    { path: '/', element: <Link to="/search?q=luminix">go</Link> },
    { path: '/search', element: <Search /> },
];

describe('LuminixProvider', () => {
    beforeEach(() => {
        Object.keys(app.handlers).forEach((key) => delete app.handlers[key]);
        window.history.replaceState(null, '', '/');
    });

    it('renders the fallback until the app is ready', () => {
        render(<LuminixProvider routes={routes} fallbackElement={<p>booting</p>} />);

        expect(screen.getByText('booting')).toBeInTheDocument();
        expect(app.create).toHaveBeenCalled();
    });

    it('builds a browser router from the routes once the app is ready', async () => {
        render(<LuminixProvider routes={routes} fallbackElement={<p>booting</p>} />);

        await act(async () => app.ready());

        expect(screen.queryByText('booting')).not.toBeInTheDocument();
        expect(domRouterOptions).toHaveBeenCalledWith({});

        await act(async () => screen.getByText('go').click());

        expect(screen.getByText('q=luminix')).toBeInTheDocument();
    });
});
