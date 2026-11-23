import { ReactNode, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router';

import { selectAuthState } from 'app/slices/app/selectors';
import { AuthState } from 'app/slices/app/types';
import { signInWithRedirect } from 'aws-amplify/auth';

export type ResumeAction = 'activate';

type Return = { to: string; resume?: ResumeAction };

// Kept in this tab, never in the login request: a target like "activate this line" must not reach
// the login, or it would tie the person to an activation.
const storageKey = 'slackmapSignInReturn';

// The hosted login always sends the browser back to the site root.
export const signIn = (target: Partial<Return> = {}) => {
  const to = target.to ?? window.location.pathname + window.location.search;
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({ to, resume: target.resume }));
  } catch (error) {
    console.warn('Sign-in return not kept', error);
  }
  signInWithRedirect();
};

const isReturningFromSignIn = (() => {
  const params = new URLSearchParams(window.location.search);
  return params.has('code') && params.has('state');
})();

const takeReturn = (): Return | undefined => {
  try {
    const stored = sessionStorage.getItem(storageKey);
    sessionStorage.removeItem(storageKey);
    if (!stored) return undefined;
    const parsed = JSON.parse(stored) as Return;
    if (typeof parsed.to !== 'string' || !parsed.to.startsWith('/')) throw new Error(`bad path ${parsed.to}`);
    return parsed;
  } catch (error) {
    console.warn('Sign-in return ignored', error);
    return undefined;
  }
};

// Holds the routes until a login return settles, so the page mounts where the person left it and
// the map takes its starting view from that URL.
export const SignInReturn = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const authState = useSelector(selectAuthState);
  const [released, setReleased] = useState(!isReturningFromSignIn);

  useEffect(() => {
    if (released || authState === AuthState.Loading) return;
    const target = takeReturn();
    if (target) {
      const resume = authState === AuthState.SignedIn ? target.resume : undefined;
      navigate(target.to, { replace: true, state: { resume } });
    }
    setReleased(true);
  }, [authState, released]);

  return released ? children : null;
};

// Runs once when the page was reached by a login started for this action, then forgets it so a
// reload does not run it again.
export const useResumeAfterSignIn = (action: ResumeAction, run: () => void) => {
  const location = useLocation();
  const navigate = useNavigate();
  const resume = (location.state as { resume?: ResumeAction } | null)?.resume;

  useEffect(() => {
    if (resume !== action) return;
    navigate(location.pathname + location.search, { replace: true, state: null });
    run();
  }, [resume]);
};
