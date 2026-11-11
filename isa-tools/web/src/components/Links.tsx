import { ExternalLink } from './DetailDialog';

export function Links({ link1, link2 }: { link1?: string; link2?: string }) {
  return (
    <>
      {link1 && <ExternalLink href={link1}>Link 1</ExternalLink>}
      {link1 && link2 && ', '}
      {link2 && <ExternalLink href={link2}>Link 2</ExternalLink>}
    </>
  );
}
