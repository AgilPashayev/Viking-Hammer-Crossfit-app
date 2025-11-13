import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { landingStyles } from '../styles/landingStyles';

interface LandingScreenProps {
  user?: any;
  onNavigate: (page: string) => void;
  onGetStarted: () => void;
  onLogout: () => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({
  user,
  onNavigate,
  onGetStarted,
  onLogout,
}) => {
  const { t } = useTranslation();
  const [logoError, setLogoError] = useState(false);

  // Gallery images - matching web version
  const galleryImages = [
    {
      id: 1,
      alt: t('admin.landingPage.gallery.imageAlt.gym1'),
      fallback: true,
    },
    {
      id: 2,
      alt: t('admin.landingPage.gallery.imageAlt.gym2'),
      fallback: true,
    },
    {
      id: 3,
      alt: t('admin.landingPage.gallery.imageAlt.gym3'),
      fallback: true,
    },
    {
      id: 4,
      alt: t('admin.landingPage.gallery.imageAlt.gym4'),
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
    <ScrollView style={landingStyles.container}>
      {/* Header */}
      <View style={landingStyles.header}>
        <View style={landingStyles.headerContent}>
          <View style={landingStyles.logo}>
            <Text style={landingStyles.logoIcon}>🔨</Text>
            <Text style={landingStyles.logoText}>{t('admin.landingPage.header.brandName')}</Text>
          </View>
          {user ? (
            <View style={landingStyles.userMenu}>
              <Text style={landingStyles.welcomeText}>
                {t('admin.landingPage.header.welcome')}, {user.firstName}!
              </Text>
              <TouchableOpacity
                style={[landingStyles.navBtn, landingStyles.navBtnPrimary]}
                onPress={() => onNavigate('dashboard')}
              >
                <Text style={landingStyles.navBtnText}>
                  {t('admin.landingPage.header.dashboard')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[landingStyles.navBtn, landingStyles.navBtnSecondary]}
                onPress={onLogout}
              >
                <Text style={landingStyles.navBtnTextSecondary}>
                  {t('admin.landingPage.header.logout')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={landingStyles.authButtons}>
              <TouchableOpacity
                style={[landingStyles.navBtn, landingStyles.navBtnSecondary]}
                onPress={() => onNavigate('auth')}
              >
                <Text style={landingStyles.navBtnTextSecondary}>
                  {t('admin.landingPage.header.login')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[landingStyles.navBtn, landingStyles.navBtnPrimary]}
                onPress={onGetStarted}
              >
                <Text style={landingStyles.navBtnText}>{t('admin.landingPage.header.signup')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Hero Section */}
      <LinearGradient colors={['#0a0e27', '#16213e', '#0f3460']} style={landingStyles.heroSection}>
        <View style={landingStyles.heroContent}>
          <Text style={landingStyles.heroTitle}>{t('admin.landingPage.hero.title')}</Text>
          <Text style={landingStyles.heroLocation}>{t('admin.landingPage.hero.location')}</Text>
          <Text style={landingStyles.heroTagline}>{t('admin.landingPage.hero.tagline')}</Text>
          <Text style={landingStyles.heroDescription}>
            {t('admin.landingPage.hero.description')}
          </Text>
          <TouchableOpacity
            style={landingStyles.heroBtnPrimary}
            onPress={!user ? onGetStarted : () => onNavigate('dashboard')}
          >
            <LinearGradient colors={['#667eea', '#764ba2']} style={landingStyles.heroBtnGradient}>
              <Text style={landingStyles.btnIcon}>{!user ? '✓' : '🏋️'}</Text>
              <Text style={landingStyles.heroBtnText}>
                {!user
                  ? t('admin.landingPage.hero.getStarted')
                  : t('admin.landingPage.header.dashboard')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Scroll Indicator */}
          <View style={landingStyles.scrollIndicator}>
            <Text style={landingStyles.scrollText}>{t('admin.landingPage.hero.scrollText')}</Text>
            <Text style={landingStyles.scrollArrow}>↓</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Section */}
      <View style={landingStyles.statsSection}>
        <View style={landingStyles.statsContainer}>
          <View style={landingStyles.statCard}>
            <Text style={landingStyles.statNumber}>500+</Text>
            <Text style={landingStyles.statLabel}>
              {t('admin.landingPage.stats.activeMembers')}
            </Text>
          </View>
          <View style={landingStyles.statCard}>
            <Text style={landingStyles.statNumber}>50+</Text>
            <Text style={landingStyles.statLabel}>{t('admin.landingPage.stats.dailyClasses')}</Text>
          </View>
          <View style={landingStyles.statCard}>
            <Text style={landingStyles.statNumber}>10+</Text>
            <Text style={landingStyles.statLabel}>
              {t('admin.landingPage.stats.expertTrainers')}
            </Text>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View style={landingStyles.featuresSection}>
        <View style={landingStyles.sectionContainer}>
          <View style={landingStyles.sectionTitleContainer}>
            <Text style={landingStyles.titleIcon}>💪</Text>
            <Text style={landingStyles.sectionTitle}>{t('admin.landingPage.features.title')}</Text>
          </View>
          <View style={landingStyles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={landingStyles.featureCard}>
                <Text style={landingStyles.featureIcon}>{feature.icon}</Text>
                <Text style={landingStyles.featureTitle}>{feature.title}</Text>
                <Text style={landingStyles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Why Choose Us */}
      <View style={landingStyles.whySection}>
        <View style={landingStyles.sectionContainer}>
          <View style={landingStyles.sectionTitleContainer}>
            <Text style={landingStyles.titleIcon}>✓</Text>
            <Text style={landingStyles.sectionTitle}>
              {t('admin.landingPage.whyChooseUs.title')}
            </Text>
          </View>
          <View style={landingStyles.whyGrid}>
            {whyChooseUs.map((item, index) => (
              <View key={index} style={landingStyles.whyItem}>
                <Text style={landingStyles.whyIcon}>{item.icon}</Text>
                <Text style={landingStyles.whyText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Gallery Section - Simplified for mobile */}
      <View style={landingStyles.gallerySection}>
        <View style={landingStyles.sectionContainer}>
          <View style={landingStyles.sectionTitleContainer}>
            <Text style={landingStyles.titleIcon}>📸</Text>
            <Text style={landingStyles.sectionTitle}>{t('admin.landingPage.gallery.title')}</Text>
          </View>
          <Text style={landingStyles.gallerySubtitle}>
            {t('admin.landingPage.gallery.subtitle')}
          </Text>
          <View style={landingStyles.galleryGrid}>
            {galleryImages.map((image) => (
              <LinearGradient
                key={image.id}
                colors={['rgba(102, 126, 234, 0.2)', 'rgba(118, 75, 162, 0.2)']}
                style={landingStyles.galleryItem}
              >
                <View style={landingStyles.galleryPlaceholder}>
                  <Text style={landingStyles.placeholderIcon}>🏋️</Text>
                  <Text style={landingStyles.placeholderText}>{image.alt}</Text>
                </View>
              </LinearGradient>
            ))}
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={landingStyles.footer}>
        <Text style={landingStyles.footerText}>
          © 2025 Viking Hammer CrossFit. {t('admin.landingPage.footer.rights')}
        </Text>
      </View>
    </ScrollView>
  );
};

export default LandingScreen;
