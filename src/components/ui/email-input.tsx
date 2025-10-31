"use client";

import { useState } from "react";

interface EmailInputProps {
  id?: string;
  name?: string;
  defaultValue?: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
  hasError?: boolean;
  onChange?: (value: string) => void;
}

export function EmailInput({
  id,
  name,
  defaultValue = "",
  className = "",
  placeholder = "email@example.com",
  required = false,
  hasError = false,
  onChange,
}: EmailInputProps) {
  const [email, setEmail] = useState(defaultValue);

  const handleChange = (value: string) => {
    setEmail(value);
    onChange?.(value);
  };

  const baseClassName = className.replace(/border-gray-\d+/, '').replace(/border-red-\d+/, '').replace(/border\b/, '');
  const borderClass = hasError ? 'border-2 border-red-500' : 'border border-gray-300';

  return (
    <input
      type="email"
      id={id}
      name={name}
      value={email}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className={`${baseClassName} ${borderClass}`}
    />
  );
}
