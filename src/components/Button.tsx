import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Icon } from './Icon';
import { cx } from './utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** text (low emphasis, default) · outlined (medium) · contained (high, one per surface) */
  variant?: 'text' | 'outlined' | 'contained';
  /** Leading Material Symbols Outlined name, 18px. */
  icon?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'text', icon, className, children, ...rest },
  ref,
) {
  return (
    <button
      type="button"
      {...rest}
      ref={ref}
      className={cx(
        'q-btn',
        `q-btn--${variant}`,
        'q-state',
        'q-focusable',
        variant === 'contained' && 'q-on-fill',
        className,
      )}
    >
      {icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  );
});
