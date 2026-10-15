import { forwardRef } from 'react';
import { cx, useToggle, type ToggleProps } from './utils';

export type SwitchProps = ToggleProps;

/** The ref is the <input>. */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { checked, defaultChecked, onChange, label, className, style, ...rest },
  ref,
) {
  const [isChecked, handleChange] = useToggle({ checked, defaultChecked, onChange });
  return (
    <label className={cx('q-control', 'q-switch', rest.disabled && 'q-control--disabled', className)} style={style}>
      <span className="q-switch__wrap">
        <input {...rest} ref={ref} type="checkbox" role="switch" checked={isChecked} onChange={handleChange} />
        <span className="q-switch__track" />
        <span className="q-control__ripple">
          <span className="q-switch__thumb" />
        </span>
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  );
});
