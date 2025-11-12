import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './LandingPage.css';

interface LandingPageProps {
  user?: any;
  onNavigate: (page: string) => void;
  onGetStarted: () => void;
  onLogout: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ user, onNavigate, onGetStarted, onLogout }) => {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [logoError, setLogoError] = useState(false);

  // Gallery images - you can add your own photos here
  const galleryImages = [
    {
      id: 1,
      url: '/images/gym1.jpg',
      alt: t('admin.landingPage.gallery.imageAlt.gym1'),
      fallback: true,
    },
    {
      id: 2,
      url: '/images/gym2.jpg',
      alt: t('admin.landingPage.gallery.imageAlt.gym2'),
      fallback: true,
    },
    {
      id: 3,
      url: '/images/gym3.jpg',
      alt: t('admin.landingPage.gallery.imageAlt.gym3'),
      fallback: true,
    },
    {
      id: 4,
      url: '/images/gym4.jpg',
      alt: t('admin.landingPage.gallery.imageAlt.gym4'),
      fallback: true,
    },
    {
      id: 5,
      url: '/images/gym5.jpg',
      alt: t('admin.landingPage.gallery.imageAlt.gym5'),
      fallback: true,
    },
    {
      id: 6,
      url: '/images/gym6.jpg',
      alt: t('admin.landingPage.gallery.imageAlt.gym6'),
      fallback: true,
    },
  ];

  const features = [
    {
      icon: '👥',
      title: t('admin.landingPage.features.groupWorkouts.title'),
      description: t('admin.landingPage.features.groupWorkouts.description'),
    },
    {
      icon: '🎯',
      title: t('admin.landingPage.features.personalTraining.title'),
      description: t('admin.landingPage.features.personalTraining.description'),
    },
    {
      icon: '🏆',
      title: t('admin.landingPage.features.athleteDevelopment.title'),
      description: t('admin.landingPage.features.athleteDevelopment.description'),
    },
    {
      icon: '💪',
      title: t('admin.landingPage.features.community.title'),
      description: t('admin.landingPage.features.community.description'),
    },
  ];

  const whyChooseUs = [
    { icon: '✅', text: t('admin.landingPage.whyChooseUs.item1') },
    { icon: '🏋️', text: t('admin.landingPage.whyChooseUs.item2') },
    { icon: '💳', text: t('admin.landingPage.whyChooseUs.item3') },
    { icon: '📈', text: t('admin.landingPage.whyChooseUs.item4') },
  ];

  return (
    <div className="landing-page-new">
      {/* Header */}
      <header className="landing-header-new">
        <div className="header-content">
          <div className="logo-new">
            <span className="logo-icon">🔨</span>
            <span className="logo-text">{t('admin.landingPage.header.brandName')}</span>
          </div>
          <nav className="header-nav">
            {user ? (
              <div className="user-menu-new">
                <span className="welcome-text">
                  {t('admin.landingPage.header.welcome')}, {user.firstName}!
                </span>
                <button onClick={() => onNavigate('dashboard')} className="nav-btn-new primary">
                  {t('admin.landingPage.header.dashboard')}
                </button>
                <button onClick={onLogout} className="nav-btn-new secondary">
                  {t('admin.landingPage.header.logout')}
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button onClick={() => onNavigate('auth')} className="nav-btn-new secondary">
                  {t('admin.landingPage.header.login')}
                </button>
                <button onClick={onGetStarted} className="nav-btn-new primary">
                  {t('admin.landingPage.header.signup')}
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

          <h1 className="hero-title">{t('admin.landingPage.hero.title')}</h1>
          <p className="hero-location">{t('admin.landingPage.hero.location')}</p>
          <h2 className="hero-tagline">{t('admin.landingPage.hero.tagline')}</h2>
          <p className="hero-description">{t('admin.landingPage.hero.description')}</p>
          <div className="hero-cta">
            {!user ? (
              <button className="hero-btn-primary" onClick={onGetStarted}>
                <span className="btn-icon">✓</span>
                {t('admin.landingPage.hero.getStarted')}
              </button>
            ) : (
              <button className="hero-btn-primary" onClick={() => onNavigate('dashboard')}>
                <span className="btn-icon">🏋️</span>
                {t('admin.landingPage.header.dashboard')}
              </button>
            )}
          </div>

          {/* Scroll Indicator - Below Button */}
          <div className="scroll-indicator">
            <span className="scroll-text">{t('admin.landingPage.hero.scrollText')}</span>
            <span className="scroll-arrow">↓</span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-card-new">
            <div className="stat-number">500+</div>
            <div className="stat-label">{t('admin.landingPage.stats.activeMembers')}</div>
          </div>
          <div className="stat-card-new">
            <div className="stat-number">50+</div>
            <div className="stat-label">{t('admin.landingPage.stats.dailyClasses')}</div>
          </div>
          <div className="stat-card-new">
            <div className="stat-number">10+</div>
            <div className="stat-label">{t('admin.landingPage.stats.expertTrainers')}</div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="features-section">
        <div className="section-container">
          <h2 className="section-title">
            <span className="title-icon">💪</span>
            {t('admin.landingPage.features.title')}
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
            <span className="title-icon">✓</span>
            {t('admin.landingPage.whyChooseUs.title')}
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
            {t('admin.landingPage.gallery.title')}
          </h2>
          <p className="gallery-subtitle">{t('admin.landingPage.gallery.subtitle')}</p>
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
                    <div className="placeholder-hint">
                      {t('admin.landingPage.gallery.addYourPhoto')}
                    </div>
                  </div>
                ) : (
                  <>
                    <img src={image.url} alt={image.alt} />
                    <div className="gallery-overlay">
                      <span className="view-icon">👁</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="gallery-note">
            <span className="note-icon">💡</span>
            <span>{t('admin.landingPage.gallery.addPhotosNote')}</span>
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
            {t('admin.landingPage.contact.title')}
          </h2>
          <div className="contact-grid">
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon">📌</div>
                <div className="contact-details">
                  <h3>{t('admin.landingPage.contact.addressLabel')}</h3>
                  <p>Genclik m., Olimpiya 6</p>
                  <p>{t('admin.landingPage.contact.address')}</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📞</div>
                <div className="contact-details">
                  <h3>{t('admin.landingPage.contact.phoneLabel')}</h3>
                  <a href="tel:+994503003323" className="contact-link">
                    {t('admin.landingPage.contact.phone')}
                  </a>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📸</div>
                <div className="contact-details">
                  <h3>{t('admin.landingPage.contact.followLabel')}</h3>
                  <a
                    href="https://www.instagram.com/vikings__hammer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-link instagram-link"
                  >
                    {t('admin.landingPage.contact.instagram')}
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
                  {t('admin.landingPage.contact.followButton')}
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
            <span>{t('admin.landingPage.footer.brandName')}</span>
          </div>
          <p className="footer-text">{t('admin.landingPage.footer.tagline')}</p>
          <p className="footer-copyright">{t('admin.landingPage.footer.copyright')}</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
