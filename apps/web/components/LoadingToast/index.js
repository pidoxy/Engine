import { useEffect, useState } from 'react';
import styles from './LoadingToast.module.css';

const LoadingToast = ({ isVisible, message = 'Processing...', type = 'loading' }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      // Auto-hide non-loading messages (success/error/info); loading persists
      // until the caller clears it.
      if (type !== 'loading') {
        const timer = setTimeout(() => {
          setShow(false);
        }, type === 'error' ? 5000 : 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setShow(false);
    }
  }, [isVisible, type]);

  if (!show) return null;

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      {type === 'loading' && (
        <div className={styles.spinner} />
      )}
      <span>{message}</span>
    </div>
  );
};

export default LoadingToast; 