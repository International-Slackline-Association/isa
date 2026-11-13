import { ReactNode, useRef } from 'react';

export function Popup(props: { title: string; buttonClassName?: string; children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        className={props.buttonClassName ?? 'text-button'}
        onClick={() => dialogRef.current?.showModal()}
      >
        {props.title}
      </button>
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="dialog-content">{props.children}</div>
        <div className="dialog-actions">
          <button className="button" onClick={close}>
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}
