import { useState, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from 'react';

/** Joins truthy class names. */
export function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ');
}

/** Props for Checkbox and Switch. Other input attributes go to the <input>; className and style go to the root <label>. */
export interface ToggleProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'defaultChecked' | 'onChange' | 'value' | 'children'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  label?: ReactNode;
  name?: string;
  value?: string;
  className?: string;
}

/** Controlled when `checked` is set, uncontrolled from `defaultChecked` otherwise. */
export function useToggle({
  checked,
  defaultChecked,
  onChange,
}: Pick<ToggleProps, 'checked' | 'defaultChecked' | 'onChange'>): [boolean, (e: ChangeEvent<HTMLInputElement>) => void] {
  const controlled = checked !== undefined;
  const [inner, setInner] = useState(!!defaultChecked);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!controlled) setInner(e.target.checked);
    onChange?.(e.target.checked, e);
  };
  return [controlled ? !!checked : inner, handleChange];
}

/** Joins space-separated id lists such as aria-describedby, dropping empty entries. */
export function joinIds(...ids: Array<string | false | null | undefined>): string | undefined {
  return cx(...ids) || undefined;
}
