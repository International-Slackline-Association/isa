import { ReactNode, useEffect, useRef, useState } from 'react';

interface Details {
  title: string;
  content: ReactNode;
}

export const useDetailDialog = () => {
  const [details, setDetails] = useState<Details | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (details && dialog && !dialog.open) dialog.showModal();
  }, [details]);

  const close = () => dialogRef.current?.close();

  const dialog = (
    <dialog
      ref={dialogRef}
      className="detail-dialog"
      onClose={() => setDetails(null)}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <h2>{details?.title}</h2>
      <div className="detail-content">{details?.content}</div>
      <div className="detail-actions">
        <button onClick={close}>Close</button>
      </div>
    </dialog>
  );

  return { dialog, showDetails: setDetails };
};

export function DetailLabel({ label, value }: { label: string; value: ReactNode }) {
  return (
    <p className="detail">
      <b>{label}</b>: {value}
    </p>
  );
}

export function ExternalLink({ href, children }: { href?: string; children: ReactNode }) {
  return (
    <a className="link" href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
