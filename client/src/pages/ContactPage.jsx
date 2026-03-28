import { Card, Image } from '../core-components';
import youtubeIcon from '../assets/icons/youtube.svg';
import instagramIcon from '../assets/icons/instagram.svg';
import linkedInIcon from '../assets/icons/linkedIn.svg';
import './ContactPage.css';

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
    <main className="main" data-page="contact">
      <div className="contact-page">
        <section className="contact-left">
          <h1 className="contact-title">Get in Touch</h1>
          <p className="contact-intro">
            Reach out to us for tour inquiries, feedback, or any questions about our adventures.
          </p>

          <div className="note-highlights">
            <div className="highlight-item">
              <span className="highlight-emoji">⚡</span>
              <div>
                <h4 className="highlight-title">Quick Response</h4>
                <p className="highlight-text">Within 24 hours</p>
              </div>
            </div>
            <div className="highlight-item">
              <span className="highlight-emoji">🌍</span>
              <div>
                <h4 className="highlight-title">Global Support</h4>
                <p className="highlight-text">Multiple time zones</p>
              </div>
            </div>
            <div className="highlight-item">
              <span className="highlight-emoji">✨</span>
              <div>
                <h4 className="highlight-title">Expert Team</h4>
                <p className="highlight-text">Travel consultants</p>
              </div>
            </div>
          </div>
        </section>

        <section className="contact-right">
          <div className="info-grid">
            {/* Contact Cards */}
            <div className="info-cards-group">
              {contactInfo.map((info) => (
                <Card key={info.id} className="info-card">
                  <span className="info-icon">{info.icon}</span>
                  <h3 className="info-title">{info.title}</h3>
                  <p className="info-value">{info.value}</p>
                </Card>
              ))}
            </div>

            {/* Hours & Social */}
            <div className="hours-social-group">
              <Card className="hours-card">
                <h3 className="card-title">Hours</h3>
                <div className="hours-list">
                  {businessHours.map((item, idx) => (
                    <div key={idx} className="hours-item">
                      <span className="hours-day">{item.day}</span>
                      <span className="hours-time">{item.hours}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="social-card">
                <h3 className="card-title">Follow</h3>
                {socialLinks.map((link, idx) => (
                  <div key={idx} className="social-item">
                    <Image src={link.icon} alt={`${link.name} icon`} className="social-icon" />
                    <a
                      href={link.url}
                      className="social-emoji"
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
