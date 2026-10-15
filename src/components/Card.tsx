import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from './utils';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  outlined?: boolean;
  /** true → a 160px placeholder block in primary-variant; or pass your own media element. */
  media?: boolean | ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Usually two text Buttons. */
  actions?: ReactNode;
  children?: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { outlined, media, title, subtitle, actions, className, children, ...rest },
  ref,
) {
  return (
    <div {...rest} ref={ref} className={cx('q-card', outlined && 'q-card--outlined', className)}>
      {media === true ? <div className="q-card__media" role="presentation" /> : media || null}
      {title || subtitle ? (
        <div className="q-card__header">
          {title ? <h2 className="q-card__title">{title}</h2> : null}
          {subtitle ? <p className="q-card__subtitle">{subtitle}</p> : null}
        </div>
      ) : null}
      {children ? <div className="q-card__body">{children}</div> : null}
      {actions ? <div className="q-card__actions">{actions}</div> : null}
    </div>
  );
});
