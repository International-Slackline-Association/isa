import { ReactNode, useRef } from 'react';

export function Popup({ title, children }: { title: string; children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button className="text-button" onClick={() => dialogRef.current?.showModal()}>
        {title}
      </button>
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="dialog-content">{children}</div>
        <div className="dialog-actions">
          <button className="button" onClick={close}>
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}
