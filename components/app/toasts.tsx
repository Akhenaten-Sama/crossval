"use client";

import { useCallback, useState } from "react";

type Toast = {
  id: string;
  message: string;
  tone: "success" | "error";
};

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}

export function ToastViewport({ dismissToast, toasts }: { toasts: Toast[]; dismissToast: (id: string) => void }) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <button type="button" className={`toast toast-${toast.tone}`} key={toast.id} onClick={() => dismissToast(toast.id)}>
          <span>{toast.message}</span>
        </button>
      ))}
    </div>
  );
}
