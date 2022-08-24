import { FaGithub } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import { signIn, signOut, useSession } from 'next-auth/react';

import styles from './styles.module.scss';

export function SignInButton() {
  const { data: session, status } = useSession();

  const isUserLoggedIn = status === 'authenticated';
  const buttonColor = isUserLoggedIn ? '#84d361' : '#eba417';

  return (
    <button
      type="button"
      className={styles.signInButton}
      onClick={() => (isUserLoggedIn ? signOut() : signIn('github'))}
    >
      <FaGithub color={buttonColor} />

      {session?.user?.name || 'Sign in with Github'}

      {isUserLoggedIn && <FiX color="#737380" className={styles.closeIcon} />}
    </button>
  );
}
