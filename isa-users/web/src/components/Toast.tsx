import { useEffect, useState } from 'react';

import { Icon } from './Icons';

type Message = { text: string; kind: 'success' | 'error' };

let setMessage: ((message: Message | null) => void) | undefined;

export function showError(text: string) {
  setMessage?.({ text, kind: 'error' });
}

export function showSuccess(text: string) {
  setMessage?.({ text, kind: 'success' });
}

export function Toast() {
  const [message, set] = useState<Message | null>(null);

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
    <div className={`toast ${message.kind}`} role="alert">
      <Icon name={message.kind === 'error' ? 'error' : 'check'} />
      <span>{message.text}</span>
      <button className="icon-button" onClick={() => set(null)} aria-label="Close">
        <Icon name="close" size={20} />
      </button>
    </div>
  );
}
