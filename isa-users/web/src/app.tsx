import { ComponentType, useEffect, useState } from 'react';

import { User, useFetch } from './api';
import { useAuth } from './auth';
import { Icon } from './components/Icons';
import { Sidebar } from './components/Sidebar';
import { Spinner } from './components/Spinner';
import { Toast } from './components/Toast';
import { VerifyEmailBanner } from './components/VerifyEmailBanner';
import { Certificates } from './pages/Certificates';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Profile } from './pages/Profile';
import { SignIn } from './pages/SignIn';
import { TermsAndConditions } from './pages/TermsAndConditions';
import { navigate, usePath } from './router';

const pages: Record<string, ComponentType<{ user: User; refetchUser: () => void }>> = {
  '/user/profile': Profile,
  '/user/certificates': Certificates,
};

const publicPages: Record<string, ComponentType> = {
  '/privacy': PrivacyPolicy,
  '/terms': TermsAndConditions,
};

export function App() {
  const path = usePath();
  const PublicPage = publicPages[path];
  return PublicPage ? <PublicPage /> : <AccountApp />;
}

function AccountApp() {
  const auth = useAuth();

  return (
    <>
      {auth.state === 'loading' ? (
        <FullPageSpinner />
      ) : auth.state === 'signedOut' ? (
        <>
          <Topbar />
          <SignIn onSignIn={auth.signIn} />
        </>
      ) : (
        <SignedIn onSignOut={auth.signOut} />
      )}
      <Toast />
    </>
  );
}

function SignedIn({ onSignOut }: { onSignOut: () => void }) {
  const { data: user, refetch } = useFetch<User>('user/details');
  const path = usePath();
  const [menuOpen, setMenuOpen] = useState(false);
  const Page = pages[path];

  useEffect(() => {
    if (!Page) navigate('/user/profile', { replace: true });
  }, [Page]);

  useEffect(() => setMenuOpen(false), [path]);

  if (!user?.email || !Page) return <FullPageSpinner />;

  return (
    <div className="layout">
      <Topbar onMenu={() => setMenuOpen((open) => !open)} />
      <Sidebar
        user={user}
        refetchUser={refetch}
        path={path}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSignOut={onSignOut}
      />
      <main className="page">
        <VerifyEmailBanner />
        <Page user={user} refetchUser={refetch} />
      </main>
    </div>
  );
}

function Topbar({ onMenu }: { onMenu?: () => void }) {
  return (
    <header className="topbar">
      <a href="https://www.slacklineinternational.org" target="_blank" rel="noopener noreferrer">
        <img alt="ISA Logo" src="/images/logo-contrast.svg" height="32" />
      </a>
      {onMenu && (
        <button className="icon-button" onClick={onMenu} aria-label="Menu">
          <Icon name="menu" />
        </button>
      )}
    </header>
  );
}

function FullPageSpinner() {
  return (
    <div className="full-page-spinner">
      <Spinner size={64} />
    </div>
  );
}
