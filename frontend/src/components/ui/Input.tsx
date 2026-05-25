import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import './ui.css';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className = '', id, ...rest }: InputProps) {
  const inputId = id ?? rest.name;
  return (
    <div className="input-group">
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input-field ${error ? 'input-error' : ''} ${className}`}
        {...rest}
      />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function Textarea({
  label,
  error,
  className = '',
  id,
  ...rest
}: TextareaProps) {
  const inputId = id ?? rest.name;
  return (
    <div className="input-group">
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`input-field textarea-field ${error ? 'input-error' : ''} ${className}`}
        {...rest}
      />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
}
