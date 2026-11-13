import { ChangeEvent, MouseEvent, useEffect, useRef, useState } from 'react';

import { uploadData } from 'aws-amplify/storage';

import { User, put } from '../api';
import { navigate } from '../router';
import { Icon, IconName } from './Icons';
import { Spinner } from './Spinner';
import { showError, showSuccess } from './Toast';

interface Props {
  user: User;
  refetchUser: () => void;
  path: string;
  open: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

const links: { title: string; href: string; icon: IconName }[] = [
  { title: 'Profile', href: '/user/profile', icon: 'account' },
  { title: 'Certificates', href: '/user/certificates', icon: 'certificate' },
];

export function Sidebar(props: Props) {
  const followLink = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(href);
  };

  return (
    <>
      {props.open && <div className="backdrop" onClick={props.onClose} />}
      <nav className={`sidebar ${props.open ? 'open' : ''}`}>
        <ProfileHeader user={props.user} refetchUser={props.refetchUser} />
        <hr />
        <ul className="nav-links">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={props.path === link.href ? 'active' : ''}
                onClick={(e) => followLink(e, link.href)}
              >
                <Icon name={link.icon} />
                {link.title}
              </a>
            </li>
          ))}
        </ul>
        <footer className="sidebar-footer">
          <a
            className="sidebar-logo"
            href="https://www.slacklineinternational.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img alt="ISA Logo" src="/images/logo-contrast.svg" width="100%" />
          </a>
          <div className="footer-links">
            <button className="small-link" onClick={props.onSignOut}>
              <Icon name="logout" size={16} />
              Logout
            </button>
            <a
              className="small-link"
              href={`mailto:account@slacklineinternational.org?subject=${encodeURIComponent('ISA Account Contact')}`}
            >
              <Icon name="email" size={16} />
              Contact
            </a>
          </div>
          <p className="copyright">
            Copyright © 2022 International Slackline Association. All rights reserved.
          </p>
        </footer>
      </nav>
    </>
  );
}

const allowedFileTypes = ['image/jpg', 'image/png', 'image/jpeg', 'image/heic', 'image/webp'];

function ProfileHeader({ user, refetchUser }: { user: User; refetchUser: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (e: Event) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [menuOpen]);

  const updatePicture = async (processingBucketKey: string | null) => {
    setIsUpdating(true);
    try {
      await put('user/profilePicture', { processingBucketKey });
      showSuccess('Saved Changes');
      refetchUser();
    } catch {
      // put shows the error
    } finally {
      setIsUpdating(false);
    }
  };

  const onFileChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    setMenuOpen(false);
    if (!file) return;
    if (!allowedFileTypes.includes(file.type)) {
      showError(`Allowed image types are: ${allowedFileTypes.join(', ')}`);
      return;
    }
    const ext = file.type.split('/')[1];
    const randomId = Math.random().toString(36).substring(2, 8);
    const path = `public/isa-users/${user.userId}/${randomId}.${ext}`;
    setIsUpdating(true);
    try {
      await uploadData({ path, data: file, options: { contentType: file.type } }).result;
    } catch (error) {
      console.error(error);
      setIsUpdating(false);
      showError('Uploading failed for unknown reason: Try with a smaller image file please');
      return;
    }
    await updatePicture(path);
  };

  const pictureUrl = user.profilePictureS3Key
    ? `https://images.slacklineinternational.org/${user.profilePictureS3Key}`
    : undefined;

  return (
    <div className="profile-header">
      <div className="profile-row">
        <div className="avatar-menu" ref={menuRef}>
          <button
            className="avatar"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-label="Profile picture"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Spinner />
            ) : pictureUrl ? (
              <img alt="Profile" src={pictureUrl} />
            ) : (
              `${user.name?.substring(0, 1) ?? ''} ${user.surname?.substring(0, 1) ?? ''}`
            )}
          </button>
          {menuOpen && (
            <ul className="menu">
              <li>
                <label>
                  <Icon name="image" size={20} />
                  Upload Profile Picture
                  <input
                    type="file"
                    accept={allowedFileTypes.join(', ')}
                    onChange={onFileChosen}
                    hidden
                  />
                </label>
              </li>
              <li>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    updatePicture(null);
                  }}
                >
                  <Icon name="delete" size={20} />
                  Remove Profile Picture
                </button>
              </li>
            </ul>
          )}
        </div>
        <div className="profile-name">
          <span>{user.name}</span>
          <span>{user.surname}</span>
        </div>
      </div>
      <div className="isa-id">
        ISA ID: <b>{user.userId}</b>
        <button
          className="icon-button"
          title="Copy to clipboard"
          aria-label="Copy ISA ID"
          onClick={() => navigator.clipboard.writeText(user.userId)}
        >
          <Icon name="copy" size={16} />
        </button>
      </div>
    </div>
  );
}
