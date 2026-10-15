import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cx, joinIds } from './utils';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'filled' | 'outlined';
  label: string;
  helperText?: string;
  error?: boolean;
}

/** The ref is the <input>; className and style go to the root. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { variant = 'filled', label, helperText, error, className, style, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const helperId = `${inputId}-helper`;
  return (
    <div className={cx('q-field', `q-field--${variant}`, error && 'q-field--error', className)} style={style}>
      <div className="q-field__box">
        <input
          type="text"
          {...rest}
          ref={ref}
          id={inputId}
          className="q-field__input"
          // The floating label relies on :placeholder-shown, so the placeholder is always a single space.
          placeholder=" "
          aria-invalid={error || rest['aria-invalid'] || undefined}
          aria-describedby={joinIds(helperText && helperId, rest['aria-describedby'])}
        />
        <label className="q-field__label" htmlFor={inputId}>
          {label}
        </label>
      </div>
      {helperText ? (
        <p className="q-field__helper" id={helperId}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
});
