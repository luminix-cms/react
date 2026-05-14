import React from 'react';
import { render, screen } from '@testing-library/react';
import Submit from '../../components/ModelForm/Submit';

describe('Submit', () => {
    it('renders a button with type="submit"', () => {
        render(<Submit>Save</Submit>);
        expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'submit');
    });

    it('renders children as the button label', () => {
        render(<Submit>Publish</Submit>);
        expect(screen.getByRole('button')).toHaveTextContent('Publish');
    });

    it('includes the base CSS class and any custom className', () => {
        render(<Submit className="my-btn">OK</Submit>);
        const btn = screen.getByRole('button');
        expect(btn).toHaveClass('luminix-form-submit');
        expect(btn).toHaveClass('my-btn');
    });

    it('forwards additional HTML attributes to the button', () => {
        render(<Submit data-testid="submit-btn" disabled>Submit</Submit>);
        const btn = screen.getByTestId('submit-btn');
        expect(btn).toBeDisabled();
    });
});
