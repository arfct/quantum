import { forwardRef } from 'react';
import { cx, useToggle, type ToggleProps } from './utils';

export type CheckboxProps = ToggleProps;

/** The ref is the <input>. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { checked, defaultChecked, onChange, label, className, style, ...rest },
  ref,
) {
  const [isChecked, handleChange] = useToggle({ checked, defaultChecked, onChange });
  return (
    <label className={cx('q-control', 'q-checkbox', rest.disabled && 'q-control--disabled', className)} style={style}>
      <input {...rest} ref={ref} type="checkbox" checked={isChecked} onChange={handleChange} />
      <span className="q-control__ripple">
        <span className="q-checkbox__box">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4.1 12.7 9 17.6 20.3 6.3" />
          </svg>
        </span>
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  );
});
