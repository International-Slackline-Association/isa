import { useState } from 'react';

import { User } from '../api';

// What each app receives mirrors its client in infra/lib/identity-stack.ts and its scopes in
// infra/lib/config.ts; change this list with them.
const profile = ['Name', 'Email', 'Picture', 'Gender', 'Birth date', 'Phone', 'City', 'Country'];

const apps: {
  name: string;
  clientId: string;
  about: string;
  url: string;
  host: string;
  sees: string[];
}[] = [
  {
    name: 'SlackMap',
    clientId: '4f7vphq9s9ava93irhh2e7pieh',
    about: 'Find and share slacklines, spots and access info around the world.',
    url: 'https://slackmap.com',
    host: 'slackmap.com',
    sees: profile,
  },
  {
    name: 'Slackline Sport Hub',
    clientId: '13n3pj9pc57077813tcukvo004',
    about: 'Contests, rankings and athletes of slackline sport.',
    url: 'https://slacklinesport.org',
    host: 'slacklinesport.org',
    sees: profile,
  },
  {
    name: 'SlackData',
    clientId: '2snjdh8i6md0m5n6h9te1hlor1',
    about: 'Slackline data collected by the community.',
    url: 'https://slackdata.org',
    host: 'slackdata.org',
    sees: ['Name', 'Email'],
  },
  {
    name: 'Highline Freestyle',
    clientId: '3m6hnjj56lh6rqc50gluhud2gl',
    about: 'Freestyle highline tricks and combos.',
    url: 'https://freestyledb.com',
    host: 'freestyledb.com',
    sees: ['Name', 'Email', 'ISA ID'],
  },
  {
    name: 'Slack Rescue Competition',
    clientId: '7amt32acja8gi3m7kb7dl6mp0m',
    about: 'The slackline rescue competition.',
    url: 'https://slackrescue.online',
    host: 'slackrescue.online',
    sees: ['Email'],
  },
];

const hues = ['teal', 'blue', 'orange', 'violet', 'pink'];

function Mark({ index, name }: { index: number; name: string }) {
  const hue = hues[index % hues.length];
  return (
    <span
      className="app-mark"
      style={{
        background: `var(--isa-color-category-${hue}-bg)`,
        color: `var(--isa-color-category-${hue}-fg)`,
      }}
    >
      {name.replace(/[^A-Z]/g, '').slice(0, 2)}
    </span>
  );
}

export function Apps({ user }: { user: User }) {
  const [open, setOpen] = useState<string>();
  const used = apps.filter((app) => user.appsUsed?.includes(app.clientId));
  const others = apps.filter((app) => !user.appsUsed?.includes(app.clientId));

  return (
    <>
      <section className="card">
        <h2>Apps you signed in to</h2>
        {used.length === 0 ? (
          <p className="caption">None yet. Your ISA account works on every app below.</p>
        ) : (
          <>
            <p className="caption">Open an app to see what it gets from your account.</p>
            <ul className="app-list">
              {used.map((app) => {
                const isOpen = open === app.clientId;
                return (
                  <li key={app.clientId}>
                    <button
                      className="app-row"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? undefined : app.clientId)}
                    >
                      <Mark index={apps.indexOf(app)} name={app.name} />
                      <span className="app-name">
                        <b>{app.name}</b>
                        <span className="caption">{app.host}</span>
                      </span>
                      <span className="app-toggle" aria-hidden="true">
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="app-details">
                        <p>{app.about}</p>
                        <p className="caption">What it gets from your account</p>
                        <ul className="chips">
                          {app.sees.map((field) => (
                            <li key={field}>{field}</li>
                          ))}
                        </ul>
                        <a href={app.url} target="_blank" rel="noopener noreferrer">
                          Go to {app.host} →
                        </a>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
      <section className="other-apps">
        <h3>Other ISA apps</h3>
        <p className="caption">Same account, no new password.</p>
        <ul>
          {others.map((app) => (
            <li key={app.clientId}>
              <a href={app.url} target="_blank" rel="noopener noreferrer">
                {app.name}
              </a>{' '}
              <span className="secondary">· {app.about}</span>
            </li>
          ))}
        </ul>
        <p className="caption">
          Your certificates come from ISA Tools, which only gets your ISA ID and email to find them.
        </p>
      </section>
    </>
  );
}
