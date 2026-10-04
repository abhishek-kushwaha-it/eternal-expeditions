import { Card, Image } from '../core-components';
import youtubeIcon from '../assets/icons/youtube.svg';
import instagramIcon from '../assets/icons/instagram.svg';
import linkedInIcon from '../assets/icons/linkedIn.svg';
import styles from './ContactPage.module.css';

export default function ContactPage() {
  const contactInfo = [
    {
      id: 1,
      title: 'Email',
      value: 'abhishek.kushwaha.it@gmail.com',
      icon: '✉️',
    },
    {
      id: 2,
      title: 'Phone',
      value: '+91 6392333145',
      icon: '📱',
    },
    {
      id: 3,
      title: 'Address',
      value: 'A8 Kishan Nagar Kanpur Uttar Pradesh, 209304',
      icon: '📍',
    },
  ];

  const businessHours = [
    { day: 'Mon - Fri', hours: '9 AM - 6 PM (PST)' },
    { day: 'Saturday', hours: '10 AM - 4 PM (PST)' },
    { day: 'Sunday', hours: 'Closed' },
  ];

  const socialLinks = [
    {
      name: 'Youtube',
      url: 'https://www.youtube.com/eternalexpeditions',
      icon: youtubeIcon,
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/eternalexpeditions/',
      icon: instagramIcon,
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/company/eternal-expeditions/',
      icon: linkedInIcon,
    },
  ];

  return (
    <main className={`main ${styles['contact-root']}`}>
      <div className={styles['contact-page']}>
        <section className={styles['contact-left']}>
          <h1 className={styles['contact-title']}>Get in Touch</h1>
          <p className={styles['contact-intro']}>
            Reach out to us for tour inquiries, feedback, or any questions about our adventures.
          </p>

          <div className={styles['note-highlights']}>
            <div className={styles['highlight-item']}>
              <span className={styles['highlight-emoji']}>⚡</span>
              <div>
                <h4 className={styles['highlight-title']}>Quick Response</h4>
                <p className={styles['highlight-text']}>Within 24 hours</p>
              </div>
            </div>
            <div className={styles['highlight-item']}>
              <span className={styles['highlight-emoji']}>🌍</span>
              <div>
                <h4 className={styles['highlight-title']}>Global Support</h4>
                <p className={styles['highlight-text']}>Multiple time zones</p>
              </div>
            </div>
            <div className={styles['highlight-item']}>
              <span className={styles['highlight-emoji']}>✨</span>
              <div>
                <h4 className={styles['highlight-title']}>Expert Team</h4>
                <p className={styles['highlight-text']}>Travel consultants</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles['contact-right']}>
          <div>
            {/* Contact Cards */}
            <div className={styles['info-cards-group']}>
              {contactInfo.map((info) => (
                <Card key={info.id} className={styles['info-card']}>
                  <span className={styles['info-icon']}>{info.icon}</span>
                  <h3 className={styles['info-title']}>{info.title}</h3>
                  <p className={styles['info-value']}>{info.value}</p>
                </Card>
              ))}
            </div>

            {/* Hours & Social */}
            <div className={styles['hours-social-group']}>
              <Card className={styles['hours-card']}>
                <h3 className={styles['card-title']}>Hours</h3>
                <div className={styles['hours-list']}>
                  {businessHours.map((item, idx) => (
                    <div key={idx} className={styles['hours-item']}>
                      <span className={styles['hours-day']}>{item.day}</span>
                      <span className={styles['hours-time']}>{item.hours}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className={styles['social-card']}>
                <h3 className={styles['card-title']}>Follow</h3>
                {socialLinks.map((link, idx) => (
                  <div key={idx} className={styles['social-item']}>
                    <Image
                      src={link.icon}
                      alt={`${link.name} icon`}
                      className={styles['social-icon']}
                    />
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.name} @ eternalexpeditions
                    </a>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
