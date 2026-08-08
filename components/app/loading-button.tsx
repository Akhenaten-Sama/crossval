"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  children: ReactNode;
};

export default function LoadingButton({ children, disabled, loading = false, ...props }: LoadingButtonProps) {
  return (
    <button {...props} disabled={disabled || loading}>
      {loading ? <span className="button-spinner" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}
