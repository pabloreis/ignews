import { FaGithub } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';

import styles from './styles.module.scss';

export function SignInButton() {
  const isUserLoggedIn = true;
  const buttonColor = isUserLoggedIn ? '#84d361' : '#eba417';

  return (
    <button type="button" className={styles.signInButton}>
      <FaGithub color={buttonColor} />

      {isUserLoggedIn ? 'Pablo Reis' : 'Sign in with Github'}

      {isUserLoggedIn && <FiX color="#737380" className={styles.closeIcon} />}
    </button>
  );
}
