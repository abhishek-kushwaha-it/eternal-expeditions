import { Card } from '../core-components';
import styles from './CareersPage.module.css';

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
    { number: '10+', label: 'Team Members' },
    { number: '5+', label: 'Countries' },
    { number: '95%', label: 'Employee Satisfaction' },
    { number: '3+ years', label: 'Avg Tenure' },
  ];

  return (
    <main className="main">
      <div className={styles['careers-page']}>
        {/* Hero Section */}
        <div className={styles['careers-hero']}>
          <div>
            <h1 className={styles['careers-hero__title']}>Build a Career with Purpose</h1>
            <p className={styles['careers-hero__subtitle']}>
              Join a team passionate about creating unforgettable travel experiences and exploring
              the world together
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <section className={styles['careers-stats']}>
          <div className={styles['stats-grid']}>
            {stats.map((stat, idx) => (
              <div key={idx} className={styles['stat-card']}>
                <div className={styles['stat-number']}>{stat.number}</div>
                <div className={styles['stat-label']}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Open Positions */}
        <section className={styles['careers-section']}>
          <h2 className={styles['section-title']}>🏆 Open Positions</h2>
          <div className={styles['positions-grid']}>
            {positions.map((position) => (
              <Card key={position.id} className={styles['position-card']}>
                <div className={styles['position-header']}>
                  <span className={styles['position-emoji']}>{position.emoji}</span>
                  <span className={styles['position-badge']}>{position.department}</span>
                </div>
                <h3 className={styles['position-title']}>{position.title}</h3>
                <p className={styles['position-location']}>📍 {position.location}</p>
                <p className={styles['position-description']}>{position.description}</p>
                <div className={styles['position-qualifications']}>
                  {position.qualifications.map((qual, idx) => (
                    <span key={idx} className={styles['qualification-tag']}>
                      ✓ {qual}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Perks & Benefits */}
        <section className={styles['careers-section']}>
          <h2 className={styles['section-title']}>⭐ Why Join Eternal Expeditions?</h2>
          <div className={styles['perks-grid']}>
            {perks.map((perk, idx) => (
              <div key={idx} className={styles['perk-card']}>
                <div className={styles['perk-icon']}>{perk.emoji}</div>
                <h3 className={styles['perk-title']}>{perk.title}</h3>
                <p className={styles['perk-description']}>{perk.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles['careers-cta-section']}>
          <Card className={styles['cta-card']}>
            <div className={styles['cta-content']}>
              <h2 className={styles['cta-title']}>Ready to Make a Difference?</h2>
              <p className={styles['cta-contact']}>
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
