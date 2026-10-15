import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Icon } from './Icon';
import { cx } from './utils';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Set for choice and filter chips; leave undefined for action chips. */
  selected?: boolean;
  /** Leading icon; replaced by a check when selected (filter chips). */
  icon?: string;
  /** false keeps the leading icon when selected (choice chips). */
  filter?: boolean;
  outlined?: boolean;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { selected, icon, filter, outlined, className, children, ...rest },
  ref,
) {
  const leading = selected && filter !== false ? 'check' : icon;
  return (
    <button
      type="button"
      aria-pressed={selected === undefined ? undefined : !!selected}
      {...rest}
      ref={ref}
      className={cx(
        'q-chip',
        'q-state',
        'q-focusable',
        selected && 'q-chip--selected',
        outlined && 'q-chip--outlined',
        className,
      )}
    >
      {leading ? <Icon name={leading} /> : null}
      {children}
    </button>
  );
});
