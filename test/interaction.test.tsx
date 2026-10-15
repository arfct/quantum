import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BottomNavigation, Button, Checkbox, Dialog, Switch } from '../src';

const destinations = [
  { icon: 'restore', label: 'Recents' },
  { icon: 'favorite', label: 'Favorites' },
  { icon: 'location_on', label: 'Nearby' },
];

describe.each([
  ['Checkbox', Checkbox, 'checkbox'],
  ['Switch', Switch, 'switch'],
] as const)('%s', (_, Toggle, role) => {
  it('toggles when uncontrolled and reports each change', async () => {
    const onChange = vi.fn();
    render(<Toggle label="Option" onChange={onChange} />);
    const input = screen.getByRole(role, { name: 'Option' });
    await userEvent.click(input);
    expect(input).toBeChecked();
    await userEvent.click(screen.getByText('Option'));
    expect(input).not.toBeChecked();
    expect(onChange.mock.calls.map(([checked]) => checked)).toEqual([true, false]);
  });

  it('follows the checked prop when controlled', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<Toggle label="Option" checked={false} onChange={onChange} />);
    const input = screen.getByRole(role, { name: 'Option' });
    await userEvent.click(input);
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
    expect(input).not.toBeChecked();
    rerender(<Toggle label="Option" checked onChange={onChange} />);
    expect(input).toBeChecked();
  });

  it('does not toggle when disabled', async () => {
    const onChange = vi.fn();
    render(<Toggle label="Option" disabled onChange={onChange} />);
    await userEvent.click(screen.getByRole(role, { name: 'Option' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole(role, { name: 'Option' })).not.toBeChecked();
  });
});

describe('BottomNavigation', () => {
  const current = () => screen.getByRole('button', { current: 'page' });

  it('moves the current item when uncontrolled', async () => {
    const onChange = vi.fn();
    render(<BottomNavigation items={destinations} onChange={onChange} />);
    expect(current()).toHaveTextContent('Recents');
    await userEvent.click(screen.getByText('Nearby'));
    expect(current()).toHaveTextContent('Nearby');
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('follows value when controlled', async () => {
    function Controlled() {
      const [value, setValue] = useState(0);
      return (
        <>
          <BottomNavigation items={destinations} value={value} onChange={() => {}} />
          <Button onClick={() => setValue(1)}>Go to favorites</Button>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByText('Nearby'));
    expect(current()).toHaveTextContent('Recents');
    await userEvent.click(screen.getByRole('button', { name: 'Go to favorites' }));
    expect(current()).toHaveTextContent('Favorites');
  });
});

describe('Dialog', () => {
  it('takes focus on open, closes on Escape and returns focus', async () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Discard draft</Button>
          <Dialog open={open} onClose={() => setOpen(false)} title="Discard draft?" actions={<Button>Cancel</Button>} />
        </>
      );
    }
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Discard draft' });
    await userEvent.click(trigger);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
