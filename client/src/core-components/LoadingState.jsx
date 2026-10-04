import styles from './LoadingState.module.css';

export default function LoadingState({
  message = 'Loading...',
  minHeight = '500px',
  className = '',
  animated = false,
}) {
  return (
    <main className={`main ${className}`.trim()}>
      <div
        className={`${styles['loading-state']} ${animated ? styles['loading-state--animated'] : ''}`.trim()}
        style={{ minHeight }}
      >
        <div className={styles['loading-state__spinner']}></div>
        <p className={styles['loading-state__text']}>{message}</p>
      </div>
    </main>
  );
}
