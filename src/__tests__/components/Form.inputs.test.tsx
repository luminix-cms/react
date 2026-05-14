/**
 * Tests for leaf input components: Text, Checkbox, Radio, Select, Textarea,
 * DatetimeLocal, File, Csrf.
 *
 * All input components consume FormContext and useErrors. We provide a mock
 * FormContext and mock useErrors to stay focused on each component's markup
 * and event-wiring, not on error-bag infrastructure.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Control useErrors return value per-test.
vi.mock('../../hooks/useErrors', () => ({ default: vi.fn(() => ({})) }));

import { default as useErrors } from '../../hooks/useErrors';
import FormContext from '../../contexts/FormContext';

import Text from '../../components/Form/Input/Text';
import Checkbox from '../../components/Form/Input/Checkbox';
import Radio from '../../components/Form/Input/Radio';
import Select from '../../components/Form/Input/Select';
import Textarea from '../../components/Form/Input/Textarea';
import DatetimeLocal from '../../components/Form/Input/DatetimeLocal';
import File from '../../components/Form/Input/File';
import Csrf from '../../components/Form/Input/Csrf';

// ─── helpers ─────────────────────────────────────────────────────────────────

const makeForm = (values: Record<string, unknown> = {}) => ({
    inputProps: vi.fn((name: string) => ({
        name,
        value: (values[name] as string) ?? '',
        onChange: vi.fn(),
    })),
    checkboxProps: vi.fn((name: string, value?: string) => ({
        name,
        checked: !!(values[name]),
        onChange: vi.fn(),
        value,
    })),
    radioProps: vi.fn((name: string, value: string) => ({
        name,
        value,
        checked: values[name] === value,
        onChange: vi.fn(),
    })),
    textareaProps: vi.fn((name: string) => ({
        name,
        value: (values[name] as string) ?? '',
        onChange: vi.fn(),
    })),
    selectProps: vi.fn((name: string) => ({
        name,
        value: (values[name] as string) ?? '',
        onChange: vi.fn(),
    })),
    datetimeLocalProps: vi.fn((name: string) => ({
        name,
        value: (values[name] as string) ?? '',
        onChange: vi.fn(),
    })),
    subscribe: vi.fn(() => vi.fn()),
    errorBag: 'default',
    data: values,
});

const Wrapper = ({ form }: { form: ReturnType<typeof makeForm> }) =>
    ({ children }: { children: React.ReactNode }) =>
        <FormContext.Provider value={{ form }}>{children}</FormContext.Provider>;

// ─── Text ─────────────────────────────────────────────────────────────────────

describe('Text input', () => {
    it('renders an <input> with the given name', () => {
        const form = makeForm();
        render(<Text name="email" type="text" />, { wrapper: Wrapper({ form }) });
        expect(screen.getByRole('textbox')).toHaveAttribute('name', 'email');
    });

    it('renders a label when the label prop is supplied', () => {
        const form = makeForm();
        // id is required to wire htmlFor → label association
        render(<Text name="email" type="text" label="Email address" id="email" />, {
            wrapper: Wrapper({ form }),
        });
        expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    });

    it('calls inputProps with the field name', () => {
        const form = makeForm();
        render(<Text name="username" type="text" />, { wrapper: Wrapper({ form }) });
        expect(form.inputProps).toHaveBeenCalledWith('username', undefined);
    });

    it('shows an error message when useErrors returns one', () => {
        const form = makeForm();
        vi.mocked(useErrors).mockReturnValue({ emailError: 'Email is required' });
        render(<Text name="email" type="text" />, { wrapper: Wrapper({ form }) });
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        vi.mocked(useErrors).mockReturnValue({});
    });

    it('applies custom className to the input', () => {
        const form = makeForm();
        render(<Text name="q" type="text" className="my-input" />, { wrapper: Wrapper({ form }) });
        expect(screen.getByRole('textbox')).toHaveClass('my-input');
    });
});

// ─── Checkbox ─────────────────────────────────────────────────────────────────

describe('Checkbox input', () => {
    it('renders an <input type="checkbox">', () => {
        const form = makeForm();
        render(<Checkbox name="agree" type="checkbox" />, { wrapper: Wrapper({ form }) });
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('renders a label when supplied', () => {
        const form = makeForm();
        render(<Checkbox name="agree" type="checkbox" id="agree" label="I agree" />, {
            wrapper: Wrapper({ form }),
        });
        expect(screen.getByLabelText('I agree')).toBeInTheDocument();
    });

    it('calls checkboxProps with the field name and value', () => {
        const form = makeForm();
        render(<Checkbox name="colors[]" type="checkbox" value="red" />, { wrapper: Wrapper({ form }) });
        expect(form.checkboxProps).toHaveBeenCalledWith('colors[]', 'red');
    });

    it('shows an error message when useErrors returns one', () => {
        const form = makeForm();
        vi.mocked(useErrors).mockReturnValue({ agreeError: 'You must agree' });
        render(<Checkbox name="agree" type="checkbox" />, { wrapper: Wrapper({ form }) });
        expect(screen.getByText('You must agree')).toBeInTheDocument();
        vi.mocked(useErrors).mockReturnValue({});
    });
});

// ─── Radio ────────────────────────────────────────────────────────────────────

describe('Radio input', () => {
    const options = [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
    ];

    it('renders one radio input per option', () => {
        const form = makeForm({ decision: 'yes' });
        render(<Radio name="decision" type="radio" options={options} />, {
            wrapper: Wrapper({ form }),
        });
        expect(screen.getAllByRole('radio')).toHaveLength(2);
    });

    it('renders option labels', () => {
        const form = makeForm();
        render(<Radio name="decision" type="radio" options={options} />, {
            wrapper: Wrapper({ form }),
        });
        expect(screen.getByText('Yes')).toBeInTheDocument();
        expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('renders a group label when the label prop is set', () => {
        const form = makeForm();
        render(<Radio name="decision" type="radio" options={options} label="Decision" />, {
            wrapper: Wrapper({ form }),
        });
        expect(screen.getByText('Decision')).toBeInTheDocument();
    });

    it('shows an error message when useErrors returns one', () => {
        const form = makeForm();
        vi.mocked(useErrors).mockReturnValue({ decisionError: 'Pick one' });
        render(<Radio name="decision" type="radio" options={options} />, {
            wrapper: Wrapper({ form }),
        });
        expect(screen.getByText('Pick one')).toBeInTheDocument();
        vi.mocked(useErrors).mockReturnValue({});
    });
});

// ─── Select ───────────────────────────────────────────────────────────────────

describe('Select input', () => {
    const options = [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
    ];

    it('renders a <select> element', () => {
        const form = makeForm();
        render(<Select name="status" type="select" options={options} />, {
            wrapper: Wrapper({ form }),
        });
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders an <option> for each supplied option', () => {
        const form = makeForm();
        render(<Select name="status" type="select" options={options} />, {
            wrapper: Wrapper({ form }),
        });
        expect(screen.getByRole('option', { name: 'Draft' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Published' })).toBeInTheDocument();
    });

    it('renders a label when supplied', () => {
        const form = makeForm();
        render(
            <Select name="status" type="select" options={options} label="Status" id="status" />,
            { wrapper: Wrapper({ form }) }
        );
        expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });

    it('shows an error message when useErrors returns one', () => {
        const form = makeForm();
        vi.mocked(useErrors).mockReturnValue({ statusError: 'Required' });
        render(<Select name="status" type="select" options={options} />, {
            wrapper: Wrapper({ form }),
        });
        expect(screen.getByText('Required')).toBeInTheDocument();
        vi.mocked(useErrors).mockReturnValue({});
    });
});

// ─── Textarea ─────────────────────────────────────────────────────────────────

describe('Textarea input', () => {
    it('renders a <textarea> element', () => {
        const form = makeForm();
        render(<Textarea name="bio" type="textarea" />, { wrapper: Wrapper({ form }) });
        // textarea has implicit role of textbox
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders a label when supplied', () => {
        const form = makeForm();
        render(<Textarea name="bio" type="textarea" label="Biography" id="bio" />, {
            wrapper: Wrapper({ form }),
        });
        expect(screen.getByLabelText('Biography')).toBeInTheDocument();
    });

    it('calls textareaProps with the field name', () => {
        const form = makeForm();
        render(<Textarea name="bio" type="textarea" />, { wrapper: Wrapper({ form }) });
        expect(form.textareaProps).toHaveBeenCalledWith('bio', undefined);
    });

    it('shows an error message when useErrors returns one', () => {
        const form = makeForm();
        vi.mocked(useErrors).mockReturnValue({ bioError: 'Too long' });
        render(<Textarea name="bio" type="textarea" />, { wrapper: Wrapper({ form }) });
        expect(screen.getByText('Too long')).toBeInTheDocument();
        vi.mocked(useErrors).mockReturnValue({});
    });
});

// ─── DatetimeLocal ───────────────────────────────────────────────────────────

describe('DatetimeLocal input', () => {
    it('renders an <input type="datetime-local">', () => {
        const form = makeForm();
        render(<DatetimeLocal name="published_at" type="datetime-local" />, {
            wrapper: Wrapper({ form }),
        });
        // datetime-local has no textbox ARIA role in jsdom; query directly.
        expect(document.querySelector('input[type="datetime-local"]')).toBeInTheDocument();
    });

    it('calls datetimeLocalProps with the field name', () => {
        const form = makeForm();
        render(<DatetimeLocal name="published_at" type="datetime-local" />, {
            wrapper: Wrapper({ form }),
        });
        expect(form.datetimeLocalProps).toHaveBeenCalledWith('published_at');
    });
});

// ─── File ─────────────────────────────────────────────────────────────────────

describe('File input', () => {
    it('renders an <input type="file">', () => {
        const form = makeForm();
        render(<File name="avatar" type="file" />, { wrapper: Wrapper({ form }) });
        expect(document.querySelector('input[type="file"]')).toBeInTheDocument();
    });

    it('subscribes to the form with asForm() on mount', () => {
        const form = makeForm();
        render(<File name="avatar" type="file" />, { wrapper: Wrapper({ form }) });
        expect(form.subscribe).toHaveBeenCalled();
    });

    it('renders a label when supplied', () => {
        const form = makeForm();
        render(<File name="avatar" type="file" label="Profile picture" id="avatar" />, {
            wrapper: Wrapper({ form }),
        });
        expect(screen.getByText('Profile picture')).toBeInTheDocument();
    });
});

// ─── Csrf ─────────────────────────────────────────────────────────────────────

describe('Csrf input', () => {
    const TOKEN = 'test-csrf-token-abc123';

    beforeEach(() => {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'csrf-token');
        meta.setAttribute('content', TOKEN);
        document.head.appendChild(meta);
    });

    afterEach(() => {
        document.head.querySelector('meta[name="csrf-token"]')?.remove();
    });

    it('renders a hidden input named "_token"', () => {
        const form = makeForm();
        render(<Csrf name="_token" type="hidden" />, { wrapper: Wrapper({ form }) });
        const input = document.querySelector('input[type="hidden"][name="_token"]');
        expect(input).toBeInTheDocument();
    });

    it('sets the hidden input value to the CSRF token', () => {
        const form = makeForm();
        render(<Csrf name="_token" type="hidden" />, { wrapper: Wrapper({ form }) });
        const input = document.querySelector<HTMLInputElement>('input[name="_token"]');
        expect(input?.value).toBe(TOKEN);
    });

    it('subscribes to the form to inject the CSRF token as middleware', () => {
        const form = makeForm();
        render(<Csrf name="_token" type="hidden" />, { wrapper: Wrapper({ form }) });
        expect(form.subscribe).toHaveBeenCalled();
    });
});
