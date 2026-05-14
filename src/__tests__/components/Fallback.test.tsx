import React from 'react';
import { render } from '@testing-library/react';
import Fallback from '../../components/Fallback';

describe('Fallback', () => {
    afterEach(() => {
        document.body.style.margin = '';
    });

    it('renders the root container', () => {
        const { container } = render(<Fallback />);
        const root = container.firstChild as HTMLElement;
        expect(root).toBeInTheDocument();
    });

    it('renders the Luminix logo image', () => {
        const { getByAltText } = render(<Fallback />);
        expect(getByAltText('Luminix')).toBeInTheDocument();
    });

    it('sets document.body margin on mount', () => {
        render(<Fallback />);
        // jsdom normalises '0' to '0px'
        expect(document.body.style.margin).toMatch(/^0/);
    });

    it('resets document.body margin on unmount', () => {
        const { unmount } = render(<Fallback />);
        unmount();
        expect(document.body.style.margin).toBe('');
    });
});
