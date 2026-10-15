import { forwardRef, useState, type HTMLAttributes } from 'react';
import { Icon } from './Icon';
import { cx } from './utils';

export interface BottomNavigationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange' | 'defaultValue' | 'children'> {
  /** 3 to 5 destinations. */
  items: { icon: string; label: string }[];
  value?: number;
  defaultValue?: number;
  onChange?: (index: number) => void;
  className?: string;
  'aria-label'?: string;
}

/** The ref is the <nav>. */
export const BottomNavigation = forwardRef<HTMLElement, BottomNavigationProps>(function BottomNavigation(
  { items, value, defaultValue = 0, onChange, className, 'aria-label': ariaLabel = 'Primary', ...rest },
  ref,
) {
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue);
  const current = controlled ? value : inner;
  return (
    <nav {...rest} ref={ref} className={cx('q-bottom-nav', className)} aria-label={ariaLabel}>
      {items.map((item, i) => (
        <button
          key={item.label}
          type="button"
          className="q-bottom-nav__item q-state q-focusable"
          aria-current={i === current ? 'page' : undefined}
          onClick={() => {
            if (!controlled) setInner(i);
            onChange?.(i);
          }}
        >
          <Icon name={item.icon} />
          <span className="q-bottom-nav__label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
});
