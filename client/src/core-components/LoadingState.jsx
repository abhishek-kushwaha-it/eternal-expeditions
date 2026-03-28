import './LoadingState.css';

export default function LoadingState({ message = 'Loading...', minHeight = '500px' }) {
  return (
    <main className="main">
      <div className="loading-state" style={{ minHeight }}>
        <div className="loading-state__spinner"></div>
        <p className="loading-state__text">{message}</p>
      </div>
    </main>
  );
}
