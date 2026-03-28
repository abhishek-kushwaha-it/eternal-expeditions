import { Link } from 'react-router-dom';
import { Button } from '../core-components';
import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <main className="main">
      <div className="not-found-container">
        <div className="not-found-content">
          <h1 className="not-found-title">404</h1>
          <h2 className="not-found-heading">Page Not Found</h2>
          <p className="not-found-message">
            Oops! We couldn't find the page you're looking for. It might have been moved or deleted.
          </p>

          <div className="not-found-illustration">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="90" fill="none" stroke="#55c57a" strokeWidth="2" />
              <path
                d="M 70 80 Q 70 70 80 70 Q 90 70 90 80"
                fill="none"
                stroke="#55c57a"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M 110 80 Q 110 70 120 70 Q 130 70 130 80"
                fill="none"
                stroke="#55c57a"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="75" cy="75" r="3" fill="#55c57a" />
              <circle cx="125" cy="75" r="3" fill="#55c57a" />
              <path
                d="M 80 110 Q 100 125 120 110"
                fill="none"
                stroke="#55c57a"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="not-found-actions">
            <Button as="a" href="/" variant="primary">
              Back to Home
            </Button>
            <Button as="a" href="/tours" variant="outline">
              View Tours
            </Button>
          </div>

          <div className="not-found-suggestions">
            <h3>What you can do:</h3>
            <ul>
              <li>
                Return to the <Link to="/">home page</Link>
              </li>
              <li>
                Browse <Link to="/tours">all available tours</Link>
              </li>
              <li>
                Check your <Link to="/me">account settings</Link>
              </li>
              <li>Contact our support team for help</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
