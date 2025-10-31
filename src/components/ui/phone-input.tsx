"use client";

import { useState } from "react";

interface PhoneInputProps {
  id?: string;
  name?: string;
  defaultValue?: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
  hasError?: boolean;
  onChange?: (value: string) => void;
}

export function PhoneInput({
  id,
  name,
  defaultValue = "",
  className = "",
  placeholder = "555-555-5555",
  required = false,
  hasError = false,
  onChange,
}: PhoneInputProps) {
  const [phone, setPhone] = useState(defaultValue);

  const formatPhoneNumber = (value: string) => {
    const numeric = value.replace(/\D/g, "");
    const limited = numeric.substring(0, 10);

    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 6) {
      return `${limited.slice(0, 3)}-${limited.slice(3)}`;
    } else {
      return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
    }
  };

  const handleChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhone(formatted);
    onChange?.(formatted);
  };

  const baseClassName = className.replace(/border-gray-\d+/, '').replace(/border-red-\d+/, '').replace(/border\b/, '');
  const borderClass = hasError ? 'border-2 border-red-500' : 'border border-gray-300';

  return (
    <input
      type="tel"
      id={id}
      name={name}
      value={phone}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className={`${baseClassName} ${borderClass}`}
    />
  );
}
