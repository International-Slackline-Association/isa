import { useEffect, useState } from 'react';

let setMessage: ((message: string | null) => void) | undefined;

export function showError(message: string) {
  setMessage?.(message);
}

export function Toast() {
  const [message, set] = useState<string | null>(null);

  useEffect(() => {
    setMessage = set;
    return () => {
      setMessage = undefined;
    };
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => set(null), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;
  return (
    <div className="toast" role="alert">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
      </svg>
      <span>{message}</span>
      <button onClick={() => set(null)} aria-label="Close">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
    </div>
  );
}
