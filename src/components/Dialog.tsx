import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cx } from './utils';

export interface DialogProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'role' | 'children'> {
  open?: boolean;
  title?: ReactNode;
  children?: ReactNode;
  /** Text Buttons, dismissive first, confirming last. */
  actions?: ReactNode;
  /** Called on Escape and on a click on the scrim. */
  onClose?: () => void;
  /** Render in flow inside its parent instead of a fixed full-screen scrim. */
  contained?: boolean;
  role?: 'dialog' | 'alertdialog';
}

const focusableSelector = 'button:not(:disabled), [href], input:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])';

/** The ref is the dialog <div>; other HTML attributes go to it as well. */
export const Dialog = forwardRef<HTMLDivElement, DialogProps>(function Dialog(
  { open, title, children, actions, onClose, contained, role = 'dialog', className, ...rest },
  ref,
) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => dialogRef.current as HTMLDivElement);
  const visible = open !== false;

  // A modal dialog takes focus when it opens and hands it back when it closes. Contained dialogs sit in the
  // page flow (documentation, previews), so they leave focus alone.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!visible || contained || !dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    (dialog.querySelector<HTMLElement>(focusableSelector) ?? dialog).focus();
    return () => previous?.focus();
  }, [visible, contained]);

  if (!visible) return null;
  return (
    <div
      className={cx('q-scrim', contained && 'q-scrim--contained')}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && onClose) {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div
        tabIndex={-1}
        {...rest}
        ref={dialogRef}
        className={cx('q-dialog', className)}
        role={role}
        aria-modal={contained ? undefined : true}
        aria-labelledby={rest['aria-labelledby'] ?? (title ? titleId : undefined)}
      >
        {title ? (
          <h2 className="q-dialog__title" id={titleId}>
            {title}
          </h2>
        ) : null}
        {children ? <div className="q-dialog__content">{children}</div> : null}
        {actions ? <div className="q-dialog__actions">{actions}</div> : null}
      </div>
    </div>
  );
});
