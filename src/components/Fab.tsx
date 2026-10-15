import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Icon } from './Icon';
import { cx } from './utils';

export interface FabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
  /** Present → extended FAB (48px tall, label in caps). */
  label?: string;
  /** 40px mini FAB; ignored when extended. */
  mini?: boolean;
}

export const Fab = forwardRef<HTMLButtonElement, FabProps>(function Fab(
  { icon, label, mini, className, ...rest },
  ref,
) {
  const extended = !!label;
  return (
    <button
      type="button"
      {...rest}
      ref={ref}
      aria-label={rest['aria-label'] ?? label ?? icon}
      className={cx(
        'q-fab',
        'q-state',
        'q-focusable',
        mini && !extended && 'q-fab--mini',
        extended && 'q-fab--extended',
        extended && !icon && 'q-fab--no-icon',
        className,
      )}
    >
      {icon ? <Icon name={icon} /> : null}
      {extended ? <span>{label}</span> : null}
    </button>
  );
});
