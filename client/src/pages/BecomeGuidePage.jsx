import styles from './BecomeGuidePage.module.css';

export default function BecomeGuidePage() {
  return (
    <main className={`main ${styles['become-guide-root']}`}>
      <div className={styles['become-guide-page']}>
        <div className={styles['guide-content']}>
          <h1 className={styles['guide-title']}>Become a Guide</h1>
          <p className={styles['guide-intro']}>
            Join our team of expert guides and share your passion for adventure. Lead unforgettable
            expeditions and create memories that last a lifetime.
          </p>
          <div className={styles['guide-requirements']}>
            <h2>Requirements</h2>
            <ul>
              <li>Experience in outdoor activities</li>
              <li>Strong leadership skills</li>
              <li>Passion for nature and adventure</li>
              <li>Excellent communication</li>
            </ul>
          </div>
          <div className={styles['guide-contact']}>
            <p>
              Send your resume to: <strong>abhishek.kushwaha.it@gmail.com</strong>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
