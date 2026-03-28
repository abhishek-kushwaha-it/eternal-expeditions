import './BecomeGuidePage.css';

export default function BecomeGuidePage() {
  return (
    <main className="main" data-page="become-guide">
      <div className="become-guide-page">
        <div className="guide-content">
          <h1 className="guide-title">Become a Guide</h1>
          <p className="guide-intro">
            Join our team of expert guides and share your passion for adventure. Lead unforgettable
            expeditions and create memories that last a lifetime.
          </p>
          <div className="guide-requirements">
            <h2>Requirements</h2>
            <ul>
              <li>Experience in outdoor activities</li>
              <li>Strong leadership skills</li>
              <li>Passion for nature and adventure</li>
              <li>Excellent communication</li>
            </ul>
          </div>
          <div className="guide-contact">
            <p>
              Send your resume to: <strong>abhishek.kushwaha.it@gmail.com</strong>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
