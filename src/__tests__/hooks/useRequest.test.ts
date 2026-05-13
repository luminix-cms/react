import { renderHook, waitFor } from '@testing-library/react';

vi.mock('@luminix/core', () => ({
    App: { hasDebugModeEnabled: vi.fn(() => false) },
    Error: { set: vi.fn() },
    Http: { getClient: vi.fn() },
    Log: { error: vi.fn() },
    Route: {
        url: vi.fn((r: string) => `/${r}`),
        methods: vi.fn(() => ['get']),
        clientError: vi.fn(),
    },
}));

import { Http, App, Log } from '@luminix/core';
import useRequest from '../../hooks/useRequest';

const makeResponse = (overrides: Record<string, unknown> = {}) => ({
    successful: vi.fn(() => true),
    failed: vi.fn(() => false),
    has: vi.fn(() => false),
    json: vi.fn((key?: string) => (key ? overrides[key] : overrides)),
    throw: vi.fn(),
    ...overrides,
});

const OPTIONS = { url: '/api/users', method: 'get' as const };

describe('useRequest', () => {
    const mockGet = vi.fn();
    const mockWithOptions = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockWithOptions.mockReturnValue({ get: mockGet, post: vi.fn() });
        vi.mocked(Http.getClient).mockReturnValue({ withOptions: mockWithOptions } as any);
    });

    it('starts in the loading state', () => {
        mockGet.mockReturnValue(new Promise(() => {})); // never resolves

        const { result } = renderHook(() => useRequest(OPTIONS));

        expect(result.current.loading).toBe(true);
        expect(result.current.response).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('stores the parsed JSON response on success', async () => {
        const payload = { users: [{ id: 1 }] };
        mockGet.mockResolvedValue(makeResponse(payload));

        const { result } = renderHook(() => useRequest(OPTIONS));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.response).toEqual(payload);
        expect(result.current.error).toBeNull();
    });

    it('stores the error and clears loading when the request throws', async () => {
        const networkError = new Error('Network failure');
        mockGet.mockRejectedValue(networkError);

        const { result } = renderHook(() => useRequest(OPTIONS));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe(networkError);
        expect(result.current.response).toBeNull();
    });

    it('logs errors when App debug mode is enabled', async () => {
        vi.mocked(App.hasDebugModeEnabled).mockReturnValue(true);
        const err = new Error('oops');
        mockGet.mockRejectedValue(err);

        const { result } = renderHook(() => useRequest(OPTIONS));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(Log.error).toHaveBeenCalledWith(err);
    });

    it('exposes a refresh function that re-runs the request', async () => {
        mockGet.mockResolvedValue(makeResponse({ count: 1 }));

        const { result } = renderHook(() => useRequest(OPTIONS));
        await waitFor(() => expect(result.current.loading).toBe(false));

        mockGet.mockResolvedValue(makeResponse({ count: 2 }));
        result.current.refresh();

        await waitFor(() =>
            expect((result.current.response as any)?.count).toBe(2)
        );
    });
});
