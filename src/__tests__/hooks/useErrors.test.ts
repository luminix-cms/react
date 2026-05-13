import { renderHook, act } from '@testing-library/react';

vi.mock('@luminix/core', () => ({
    error: vi.fn(),
}));

import { error } from '@luminix/core';
import useErrors from '../../hooks/useErrors';

describe('useErrors', () => {
    const mockOff = vi.fn();
    const mockOn = vi.fn(() => mockOff);
    const mockBag = { on: mockOn };
    const mockClear = vi.fn();
    const mockErrorService = {
        bag: vi.fn(() => mockBag),
        clear: mockClear,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockOn.mockReturnValue(mockOff);
        mockErrorService.bag.mockReturnValue(mockBag);
        vi.mocked(error).mockReturnValue(mockErrorService as any);
    });

    it('returns an empty errors object on initial render', () => {
        const { result } = renderHook(() => useErrors());
        expect(result.current).toEqual({});
    });

    it('subscribes to the named error bag on mount', () => {
        renderHook(() => useErrors('payments'));

        expect(mockErrorService.bag).toHaveBeenCalledWith('payments');
        expect(mockOn).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('uses "default" as the bag name when none is supplied', () => {
        renderHook(() => useErrors());
        expect(mockErrorService.bag).toHaveBeenCalledWith('default');
    });

    it('updates errors in camelCase with "Error" suffix when the bag changes', () => {
        const { result } = renderHook(() => useErrors());
        const changeHandler = mockOn.mock.calls[0][1];

        act(() => {
            changeHandler({
                source: {
                    all: () => ({
                        email: 'Email is required',
                        first_name: 'First name is required',
                    }),
                },
            });
        });

        expect(result.current).toMatchObject({
            emailError: 'Email is required',
            firstNameError: 'First name is required',
        });
    });

    it('unsubscribes and clears the bag on unmount', () => {
        const { unmount } = renderHook(() => useErrors('orders'));
        unmount();
        expect(mockOff).toHaveBeenCalled();
        expect(mockClear).toHaveBeenCalledWith('orders');
    });
});
