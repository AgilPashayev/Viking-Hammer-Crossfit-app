import React, { useState } from 'react';
import './LandingPage.css';

interface LandingPageProps {
  user?: any;
  onNavigate: (page: string) => void;
  onGetStarted: () => void;
  onLogout: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ user, onNavigate, onGetStarted, onLogout }) => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [logoError, setLogoError] = useState(false);

  // Gallery images - you can add your own photos here
  const galleryImages = [
    { id: 1, url: '/images/gym1.jpg', alt: 'CrossFit Training Area', fallback: true },
    { id: 2, url: '/images/gym2.jpg', alt: 'Group Workout Session', fallback: true },
    { id: 3, url: '/images/gym3.jpg', alt: 'Personal Training', fallback: true },
    { id: 4, url: '/images/gym4.jpg', alt: 'Professional Gym Equipment', fallback: true },
    { id: 5, url: '/images/gym5.jpg', alt: 'Supportive Community', fallback: true },
    { id: 6, url: '/images/gym6.jpg', alt: 'Elite Athletes Training', fallback: true },
  ];

  const features = [
    {
      icon: '👥',
      title: 'Group Workouts',
      description: 'High-intensity, community-driven sessions that challenge and motivate.',
    },
    {
      icon: '🎯',
      title: 'Personal Training',
      description: 'Tailored programs designed for your individual goals and fitness level.',
    },
    {
      icon: '🏆',
      title: 'Athlete Development',
      description: 'Advanced training for professionals and competitors seeking peak performance.',
    },
    {
      icon: '💪',
      title: 'Supportive Community',
      description:
        'Train alongside like-minded athletes who push, inspire, and celebrate every milestone.',
    },
  ];

  const whyChooseUs = [
    { icon: '✅', text: 'Certified and experienced CrossFit coaches' },
    { icon: '🏋️', text: 'State-of-the-art equipment and safe training environment' },
    { icon: '💳', text: 'Flexible membership plans for every fitness journey' },
    { icon: '📈', text: 'Real results. Real progress. Real community.' },
  ];

  return (
    <div className="landing-page-new">
      {/* Header */}
      <header className="landing-header-new">
        <div className="header-content">
          <div className="logo-new">
            <span className="logo-icon">🔨</span>
            <span className="logo-text">Viking Hammer CrossFit</span>
          </div>
          <nav className="header-nav">
            {user ? (
              <div className="user-menu-new">
                <span className="welcome-text">Welcome, {user.firstName}!</span>
                <button onClick={() => onNavigate('dashboard')} className="nav-btn-new primary">
                  Dashboard
                </button>
                <button onClick={onLogout} className="nav-btn-new secondary">
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button onClick={() => onNavigate('auth')} className="nav-btn-new secondary">
                  Sign In
                </button>
                <button onClick={onGetStarted} className="nav-btn-new primary">
                  Get Started
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section-new">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          {/* Logo - Important Brand Identity */}
          {!logoError && (
            <div className="hero-logo">
              <img
                src="/vikings-hammer-logo.png"
                alt="Vikings Hammer CrossFit Logo"
                onError={() => setLogoError(true)}
              />
            </div>
          )}

          <h1 className="hero-title">VIKING HAMMER CROSSFIT</h1>
          <p className="hero-location">BAKU, AZERBAIJAN</p>
          <h2 className="hero-tagline">Unleash Your Inner Strength. Build the Warrior Within.</h2>
          <p className="hero-description">
            At Viking Hammer CrossFit, we believe strength is more than muscle — it's mindset,
            discipline, and community. Located in the heart of Baku, our box combines the power of
            CrossFit training, functional fitness, and personal coaching to help you become the best
            version of yourself.
          </p>
          <div className="hero-cta">
            {!user ? (
              <button className="hero-btn-primary" onClick={onGetStarted}>
                <span className="btn-icon">⚡</span>
                Start Your Journey
              </button>
            ) : (
              <button className="hero-btn-primary" onClick={() => onNavigate('dashboard')}>
                <span className="btn-icon">🏋️</span>
                Go to Dashboard
              </button>
            )}
          </div>

          {/* Scroll Indicator - Below Button */}
          <div className="scroll-indicator">
            <span className="scroll-text">Scroll to explore more</span>
            <span className="scroll-arrow">↓</span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-card-new">
            <div className="stat-number">500+</div>
            <div className="stat-label">Active Members</div>
          </div>
          <div className="stat-card-new">
            <div className="stat-number">50+</div>
            <div className="stat-label">Daily Classes</div>
          </div>
          <div className="stat-card-new">
            <div className="stat-number">10+</div>
            <div className="stat-label">Expert Trainers</div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="features-section">
        <div className="section-container">
          <h2 className="section-title">
            <span className="title-icon">💪</span>
            What We Offer
          </h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="why-section">
        <div className="section-container">
          <h2 className="section-title">
            <span className="title-icon">⚡</span>
            Why Choose Us
          </h2>
          <div className="why-grid">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="why-item">
                <span className="why-icon">{item.icon}</span>
                <span className="why-text">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="gallery-section">
        <div className="section-container">
          <h2 className="section-title">
            <span className="title-icon">📸</span>
            Our Gym
          </h2>
          <p className="gallery-subtitle">
            Get a glimpse of our world-class facility and vibrant community
          </p>
          <div className="gallery-grid">
            {galleryImages.map((image) => (
              <div
                key={image.id}
                className="gallery-item"
                onClick={() => setSelectedImage(image.id)}
                style={{
                  background: image.fallback
                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)'
                    : 'transparent',
                }}
              >
                {image.fallback ? (
                  <div className="gallery-placeholder">
                    <div className="placeholder-icon">🏋️</div>
                    <div className="placeholder-text">{image.alt}</div>
                    <div className="placeholder-hint">Add gym{image.id}.jpg to display</div>
                  </div>
                ) : (
                  <>
                    <img src={image.url} alt={image.alt} />
                    <div className="gallery-overlay">
                      <span className="view-icon">🔍</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="gallery-note">
            <span className="note-icon">💡</span>
            <span>
              Add your gym photos to <code>/public/images/</code> folder (gym1.jpg - gym6.jpg)
            </span>
          </div>
        </div>
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content">
            <button className="modal-close" onClick={() => setSelectedImage(null)}>
              ✕
            </button>
            <img
              src={galleryImages.find((img) => img.id === selectedImage)?.url}
              alt={galleryImages.find((img) => img.id === selectedImage)?.alt}
            />
          </div>
        </div>
      )}

      {/* Contact & Map Section */}
      <section className="contact-section">
        <div className="section-container">
          <h2 className="section-title">
            <span className="title-icon">📍</span>
            Visit Us
          </h2>
          <div className="contact-grid">
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon">📌</div>
                <div className="contact-details">
                  <h3>Address</h3>
                  <p>Genclik m., Olimpiya 6</p>
                  <p>Baku AZ1072, Azerbaijan</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📞</div>
                <div className="contact-details">
                  <h3>Phone</h3>
                  <a href="tel:+994503003323" className="contact-link">
                    +994 50 300 33 23
                  </a>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📸</div>
                <div className="contact-details">
                  <h3>Instagram</h3>
                  <a
                    href="https://www.instagram.com/vikings__hammer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-link instagram-link"
                  >
                    @vikings__hammer
                    <span className="external-icon">↗</span>
                  </a>
                </div>
              </div>
              <div className="social-buttons">
                <a
                  href="https://www.instagram.com/vikings__hammer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn instagram"
                >
                  <span className="social-icon">📸</span>
                  Follow us on Instagram
                </a>
              </div>
            </div>
            <div className="map-container">
              <iframe
                title="Viking Hammer CrossFit Location"
                src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=9VX4%2B6H+Baku,+Azerbaijan&zoom=17"
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: '12px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <span className="logo-icon">🔨</span>
            <span>Viking Hammer CrossFit</span>
          </div>
          <p className="footer-text">
            Transform your body, forge your spirit, and join the strongest community in Baku.
          </p>
          <p className="footer-copyright">© 2025 Viking Hammer CrossFit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
