import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, type InputProps } from './Input';

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightElement'> {
  showToggle?: boolean;
}

export function PasswordInput({
  showToggle = true,
  className,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const ToggleBtn = showToggle ? (
    <button
      type="button"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      className="p-2 text-gray-400 hover:text-gray-600"
      onClick={() => setShowPassword((v) => !v)}
      tabIndex={-1}
    >
      {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
    </button>
  ) : null;

  return (
    <Input
      {...props}
      type={showPassword ? 'text' : 'password'}
      className={className}
      rightElement={ToggleBtn}
    />
  );
}
