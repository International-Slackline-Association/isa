import { ReactNode } from 'react';

export function LegalPage(props: { title: string; effective: string; children: ReactNode }) {
  return (
    <main className="legal">
      <a href="/" className="legal-back">
        ← ISA Account
      </a>
      <article className="card">
        <h1>{props.title}</h1>
        <p className="caption">Effective: {props.effective}</p>
        {props.children}
      </article>
    </main>
  );
}
