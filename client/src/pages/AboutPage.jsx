import './AboutPage.css';

export default function AboutPage() {
  const stats = [
    { number: '50+', label: 'Countries' },
    { number: '1000+', label: 'Happy Travelers' },
    { number: '4.8', label: 'Average Rating' },
    { number: '24/7', label: 'Support' },
  ];

  const services = [
    {
      icon: '🌍',
      title: 'Global Adventures',
      description: 'Explore tours across 50+ countries with expert local guides',
    },
    {
      icon: '💳',
      title: 'Secure Payments',
      description: 'Safe and secure booking with Stripe payment integration',
    },
    {
      icon: '⭐',
      title: 'Verified Reviews',
      description: 'Read authentic reviews from real travelers',
    },
    {
      icon: '👥',
      title: 'Expert Guides',
      description: 'Professional guides with years of experience',
    },
    {
      icon: '📧',
      title: 'Email Support',
      description: '24/7 customer support via email and in-app messaging',
    },
    {
      icon: '🔒',
      title: 'Secure Platform',
      description: 'Advanced security with JWT authentication and data protection',
    },
  ];

  const team = [
    {
      role: 'Travelers',
      description: 'Adventure seekers who book and review tours',
      icon: '🎒',
    },
    {
      role: 'Guides',
      description: 'Expert professionals leading expeditions',
      icon: '🥾',
    },
    {
      role: 'Admins',
      description: 'Platform managers ensuring quality service',
      icon: '⚙️',
    },
  ];

  return (
    <main className="main">
      <div className="about-page">
        {/* Hero Section */}
        <div className="about-hero">
          <div className="about-hero__content">
            <h1 className="about-hero__title">About Eternal Expeditions</h1>
            <p className="about-hero__subtitle">
              Connecting adventurers with unforgettable experiences worldwide. We make travel dreams
              come true through expertly crafted tours, trusted guides, and seamless booking.
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <section className="about-section">
          <h2 className="section-title">🎯 Our Mission</h2>
          <p className="mission-text">
            To create extraordinary travel experiences that inspire, educate, and connect people
            with the world's most beautiful destinations. We believe in responsible tourism that
            benefits local communities and preserves natural wonders.
          </p>
        </section>

        {/* Stats Section */}
        <section className="about-stats">
          <div className="stats-grid">
            {stats.map((stat, idx) => (
              <div key={idx} className="stat-card">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Services Section */}
        <section className="about-section">
          <h2 className="section-title">🚀 Our Services</h2>
          <div className="services-grid">
            {services.map((service, idx) => (
              <div key={idx} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section className="about-section">
          <h2 className="section-title">👥 Our Community</h2>
          <div className="team-grid">
            {team.map((member, idx) => (
              <div key={idx} className="team-card">
                <div className="team-icon">{member.icon}</div>
                <h3 className="team-role">{member.role}</h3>
                <p className="team-description">{member.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="about-cta">
          <div className="cta-content">
            <h2 className="cta-title">Ready for Your Adventure?</h2>
            <p className="cta-description">
              Join thousands of travelers who trust Eternal Expeditions for their dream vacations.
            </p>
            <p className="cta-contact">
              Questions? Contact us at <strong>abhishek.kushwaha.it@gmail.com</strong>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
