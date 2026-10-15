import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { cx } from './utils';

/** A Material Symbols Outlined ligature, e.g. name="favorite". Decorative (aria-hidden); label the control that holds it. */
export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  /** Symbol name in snake_case, from the Material Symbols catalogue (Outlined style). */
  name: string;
  /** Pixel size; also sets the optical-size axis (clamped 20–48). Default 24. */
  size?: 18 | 20 | 24 | 36 | 40 | 48;
  /** FILL axis: true draws the filled form, for active or selected states. Default false. */
  fill?: boolean;
  /** wght axis, 100–700. Default 400. */
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  /** GRAD axis, -25, 0 or 200. Default 0 (dark theme -25). */
  grade?: -25 | 0 | 200;
}

export const Icon = forwardRef<HTMLSpanElement, IconProps>(function Icon(
  { name, size, fill, weight, grade, className, style, ...rest },
  ref,
) {
  const vars: Record<string, string | number> = {};
  if (size) {
    vars.fontSize = `${size}px`;
    vars['--q-icon-opsz'] = Math.min(48, Math.max(20, size));
  }
  if (weight) vars['--q-icon-wght'] = weight;
  if (grade !== undefined) vars['--q-icon-grad'] = grade;
  return (
    <span
      aria-hidden="true"
      {...rest}
      ref={ref}
      className={cx('q-icon', fill && 'q-icon--filled', className)}
      style={{ ...(vars as CSSProperties), ...style }}
    >
      {name}
    </span>
  );
});
