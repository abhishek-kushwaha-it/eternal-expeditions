import { Card, Button } from '../core-components';
import './CareersPage.css';

export default function CareersPage() {
  const positions = [
    {
      id: 1,
      title: 'Senior Tour Guide',
      emoji: '🥾',
      department: 'Operations',
      location: 'Global',
      description:
        'Lead unforgettable expeditions across diverse terrains. Mentor junior guides and create immersive travel experiences for groups of 10-30 travelers.',
      qualifications: [
        '5+ years experience',
        'First Aid certified',
        'Language skills',
        'Leadership abilities',
      ],
    },
    {
      id: 2,
      title: 'Customer Experience Manager',
      emoji: '💬',
      department: 'Customer Success',
      location: 'Remote',
      description:
        'Ensure every traveler has an exceptional experience. Handle inquiries, resolve issues, and gather feedback to improve our services continuously.',
      qualifications: [
        'Strong communication',
        'Problem-solving skills',
        'Empathy & patience',
        'CRM experience',
      ],
    },
    {
      id: 3,
      title: 'Digital Marketing Specialist',
      emoji: '📱',
      department: 'Marketing',
      location: 'Hybrid',
      description:
        'Grow our online presence and reach adventure seekers worldwide. Manage social media, create engaging content, and analyze campaign performance.',
      qualifications: [
        'Social media expertise',
        'Content creation',
        'Analytics knowledge',
        'Creative thinking',
      ],
    },
    {
      id: 4,
      title: 'Adventure Coordinator',
      emoji: '🎯',
      department: 'Planning',
      location: 'Headquarters',
      description:
        'Design and organize extraordinary tours. Collaborate with guides, handle logistics, and ensure every detail creates magical moments for our travelers.',
      qualifications: [
        'Project management',
        'Attention to detail',
        'Organizational skills',
        'Vendor relationships',
      ],
    },
  ];

  const perks = [
    {
      emoji: '💰',
      title: 'Competitive Compensation',
      description: 'Industry-leading salaries with performance bonuses and stock options',
    },
    {
      emoji: '✈️',
      title: 'Travel Benefits',
      description:
        'Discounted or free tours, travel insurance, and destination exploration opportunities',
    },
    {
      emoji: '📚',
      title: 'Professional Growth',
      description: 'Training programs, certifications, mentorship, and career advancement paths',
    },
    {
      emoji: '🏥',
      title: 'Wellness Support',
      description: 'Comprehensive health insurance, mental wellness, and fitness programs',
    },
    {
      emoji: '⏰',
      title: 'Flexible Work',
      description: 'Remote options, flexible schedules, and work-life balance initiatives',
    },
    {
      emoji: '🤝',
      title: 'Inclusive Culture',
      description: 'Diverse team, collaborative environment, and regular team events',
    },
  ];

  const stats = [
    { number: '500+', label: 'Team Members' },
    { number: '50+', label: 'Countries' },
    { number: '95%', label: 'Employee Satisfaction' },
    { number: '10yr+', label: 'Avg Tenure' },
  ];

  return (
    <main className="main">
      <div className="careers-page">
        {/* Hero Section */}
        <div className="careers-hero">
          <div className="careers-hero__content">
            <h1 className="careers-hero__title">Build a Career with Purpose</h1>
            <p className="careers-hero__subtitle">
              Join a team passionate about creating unforgettable travel experiences and exploring
              the world together
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <section className="careers-stats">
          <div className="stats-grid">
            {stats.map((stat, idx) => (
              <div key={idx} className="stat-card">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Open Positions */}
        <section className="careers-section">
          <h2 className="section-title">🏆 Open Positions</h2>
          <div className="positions-grid">
            {positions.map((position) => (
              <Card key={position.id} className="position-card">
                <div className="position-header">
                  <span className="position-emoji">{position.emoji}</span>
                  <span className="position-badge">{position.department}</span>
                </div>
                <h3 className="position-title">{position.title}</h3>
                <p className="position-location">📍 {position.location}</p>
                <p className="position-description">{position.description}</p>
                <div className="position-qualifications">
                  {position.qualifications.map((qual, idx) => (
                    <span key={idx} className="qualification-tag">
                      ✓ {qual}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Perks & Benefits */}
        <section className="careers-section">
          <h2 className="section-title">⭐ Why Join Eternal Expeditions?</h2>
          <div className="perks-grid">
            {perks.map((perk, idx) => (
              <div key={idx} className="perk-card">
                <div className="perk-icon">{perk.emoji}</div>
                <h3 className="perk-title">{perk.title}</h3>
                <p className="perk-description">{perk.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="careers-cta-section">
          <Card className="cta-card">
            <div className="cta-content">
              <h2 className="cta-title">Ready to Make a Difference?</h2>
              <p className="cta-contact">
                Apply now and become part of a global team creating unforgettable adventures: Send
                your resume to{' '}
                <strong
                  style={{
                    fontSize: '1.8rem',
                    color: 'white',
                  }}
                >
                  abhishek.kushwaha.it@gmail.com
                </strong>
              </p>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
