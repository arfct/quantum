import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Button } from './Button';
import { cx } from './utils';

export interface SnackbarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  open?: boolean;
  message: ReactNode;
  /** One short action label, e.g. "Undo". */
  action?: string;
  onAction?: () => void;
  className?: string;
}

/** The ref is the snackbar <div>. */
export const Snackbar = forwardRef<HTMLDivElement, SnackbarProps>(function Snackbar(
  { open, message, action, onAction, className, ...rest },
  ref,
) {
  if (open === false) return null;
  return (
    <div role="status" aria-live="polite" {...rest} ref={ref} className={cx('q-snackbar', className)}>
      <div className="q-snackbar__label">{message}</div>
      {action ? <Button onClick={onAction}>{action}</Button> : null}
    </div>
  );
});
