import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import {
  BottomNavigation,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  Fab,
  Icon,
  Snackbar,
  Switch,
  TextField,
} from '../src';

const destinations = [
  { icon: 'restore', label: 'Recents' },
  { icon: 'favorite', label: 'Favorites' },
  { icon: 'location_on', label: 'Nearby' },
];

describe('render', () => {
  it('Icon renders its ligature hidden from assistive technology', () => {
    const { container } = render(<Icon name="favorite" fill size={36} />);
    const icon = container.querySelector('.q-icon');
    expect(icon).toHaveTextContent('favorite');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveClass('q-icon--filled');
    expect(icon).toHaveStyle({ fontSize: '36px' });
  });

  it('Button renders a typed button with its variant', () => {
    render(<Button variant="contained">Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('q-btn--contained');
  });

  it('Fab takes its accessible name from aria-label or the extended label', () => {
    render(
      <>
        <Fab icon="add" aria-label="Create" />
        <Fab icon="navigation" label="Navigate" />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Create' })).toHaveClass('q-fab');
    expect(screen.getByRole('button', { name: 'Navigate' })).toHaveClass('q-fab--extended');
  });

  it('Card renders title, subtitle, body and actions', () => {
    render(
      <Card title="Our changing planet" subtitle="by Kurt Wagner" actions={<Button>Read</Button>}>
        Body copy
      </Card>,
    );
    expect(screen.getByRole('heading', { name: 'Our changing planet' })).toBeInTheDocument();
    expect(screen.getByText('by Kurt Wagner')).toBeInTheDocument();
    expect(screen.getByText('Body copy')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Read' })).toBeInTheDocument();
  });

  it('TextField labels its input and links helper text', () => {
    render(<TextField label="Password" helperText="Use 8 or more characters" error aria-describedby="extra" />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Use 8 or more characters');
    expect(input.getAttribute('aria-describedby')).toMatch(/ extra$/);
  });

  it('Chip sets aria-pressed only when selectable', () => {
    render(
      <>
        <Chip>Nearby</Chip>
        <Chip selected>Vegetarian</Chip>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Nearby' })).not.toHaveAttribute('aria-pressed');
    expect(screen.getByRole('button', { name: 'Vegetarian' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('Checkbox renders a labelled checkbox', () => {
    render(<Checkbox label="Email updates" defaultChecked />);
    expect(screen.getByRole('checkbox', { name: 'Email updates' })).toBeChecked();
  });

  it('Switch renders a labelled switch', () => {
    render(<Switch label="Wi-Fi" />);
    expect(screen.getByRole('switch', { name: 'Wi-Fi' })).not.toBeChecked();
  });

  it('BottomNavigation marks the current destination', () => {
    render(<BottomNavigation items={destinations} defaultValue={1} />);
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Favorites' })).toHaveAttribute('aria-current', 'page');
  });

  it('Dialog is labelled by its title and hidden when closed', () => {
    const { rerender } = render(<Dialog open title="Discard draft?">Body</Dialog>);
    expect(screen.getByRole('dialog', { name: 'Discard draft?' })).toHaveAttribute('aria-modal', 'true');
    rerender(<Dialog open={false} title="Discard draft?">Body</Dialog>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Snackbar renders a polite status with its action', () => {
    render(<Snackbar message="Photo archived" action="Undo" />);
    expect(screen.getByRole('status')).toHaveTextContent('Photo archived');
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });
});

describe('refs', () => {
  it('forward to the underlying element', () => {
    const refs = {
      icon: createRef<HTMLSpanElement>(),
      button: createRef<HTMLButtonElement>(),
      fab: createRef<HTMLButtonElement>(),
      chip: createRef<HTMLButtonElement>(),
      card: createRef<HTMLDivElement>(),
      field: createRef<HTMLInputElement>(),
      checkbox: createRef<HTMLInputElement>(),
      toggle: createRef<HTMLInputElement>(),
      nav: createRef<HTMLElement>(),
      dialog: createRef<HTMLDivElement>(),
      snackbar: createRef<HTMLDivElement>(),
    };
    render(
      <>
        <Icon ref={refs.icon} name="home" />
        <Button ref={refs.button}>Save</Button>
        <Fab ref={refs.fab} icon="add" aria-label="Create" />
        <Chip ref={refs.chip}>Nearby</Chip>
        <Card ref={refs.card} />
        <TextField ref={refs.field} label="Name" />
        <Checkbox ref={refs.checkbox} label="Email" />
        <Switch ref={refs.toggle} label="Wi-Fi" />
        <BottomNavigation ref={refs.nav} items={destinations} />
        <Dialog ref={refs.dialog} contained title="Title" />
        <Snackbar ref={refs.snackbar} message="Saved" />
      </>,
    );
    expect(refs.icon.current).toHaveClass('q-icon');
    expect(refs.button.current).toHaveClass('q-btn');
    expect(refs.fab.current).toHaveClass('q-fab');
    expect(refs.chip.current).toHaveClass('q-chip');
    expect(refs.card.current).toHaveClass('q-card');
    expect(refs.field.current).toBe(screen.getByLabelText('Name'));
    expect(refs.checkbox.current).toBe(screen.getByRole('checkbox'));
    expect(refs.toggle.current).toBe(screen.getByRole('switch'));
    expect(refs.nav.current?.tagName).toBe('NAV');
    expect(refs.dialog.current).toHaveClass('q-dialog');
    expect(refs.snackbar.current).toHaveClass('q-snackbar');
  });
});
