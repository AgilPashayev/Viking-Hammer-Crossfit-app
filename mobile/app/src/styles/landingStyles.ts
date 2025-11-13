import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

/**
 * Landing Screen Styles - Mobile Conversion from Web
 * Following APPENDIX A (Design System) and APPENDIX B (CSS to RN Conversion)
 *
 * Color Palette (from APPENDIX A):
 * - Primary: #3da5ff
 * - Dark Navy: #0a0e27
 * - Orange Gradient: #ff5e4d → #ffa94d
 * - Purple Gradient: #667eea → #764ba2
 */

export const landingStyles = StyleSheet.create({
  // ========== CONTAINER ==========
  container: {
    flex: 1,
    backgroundColor: '#0a0e27', // Dark navy background
  },

  // ========== HEADER ==========
  header: {
    backgroundColor: 'rgba(10, 14, 39, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    // Shadow - iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    // Shadow - Android
    elevation: 8,
  },

  headerContent: {
    paddingHorizontal: 20, // padding: 20px 40px → paddingHorizontal
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  logo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoIcon: {
    fontSize: 32, // 2rem = 32pts
    textShadowColor: 'rgba(255, 94, 77, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginRight: 12,
  },

  logoText: {
    fontSize: 24, // 1.5rem = 24pts
    fontWeight: '800',
    color: '#ff5e4d',
    letterSpacing: 0.5,
  },

  userMenu: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  authButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  welcomeText: {
    color: '#cbd5e1',
    fontWeight: '500',
    fontSize: 14,
    marginRight: 12,
  },

  navBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    marginLeft: 8,
  },

  navBtnPrimary: {
    backgroundColor: '#667eea',
    // Shadow - iOS
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    // Shadow - Android
    elevation: 4,
  },

  navBtnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  navBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15, // 0.95rem ≈ 15pts
  },

  navBtnTextSecondary: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },

  // ========== HERO SECTION ==========
  heroSection: {
    minHeight: 600,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  heroContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 600,
  },

  heroTitle: {
    fontSize: 40, // 2.5rem = 40pts (reduced from 3.5rem for mobile)
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1.5, // Reduced from 3px for mobile
    lineHeight: 48,
  },

  heroLocation: {
    fontSize: 18, // 1.1rem ≈ 18pts (reduced from 1.3rem)
    color: '#ff5e4d',
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 20,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  heroTagline: {
    fontSize: 28, // 1.75rem = 28pts (reduced from 2.5rem)
    fontWeight: '800',
    color: '#ffa94d',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 36,
  },

  heroDescription: {
    fontSize: 16, // 1rem = 16pts
    lineHeight: 26, // 1.6 * 16
    color: '#e2e8f0',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 10,
  },

  heroBtnPrimary: {
    borderRadius: 12,
    overflow: 'hidden',
    // Shadow - iOS
    shadowColor: '#ff5e4d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    // Shadow - Android
    elevation: 8,
  },

  heroBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
  },

  heroBtnText: {
    color: '#ffffff',
    fontSize: 18, // 1.1rem ≈ 18pts
    fontWeight: '700',
    marginLeft: 12,
  },

  btnIcon: {
    fontSize: 24, // 1.5rem = 24pts
  },

  scrollIndicator: {
    marginTop: 50,
    alignItems: 'center',
  },

  scrollText: {
    fontSize: 14, // 0.875rem ≈ 14pts
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 10,
  },

  scrollArrow: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // ========== STATS SECTION ==========
  statsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingVertical: 40,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },

  statCard: {
    alignItems: 'center',
    minWidth: width / 3 - 30,
    marginBottom: 20,
  },

  statNumber: {
    fontSize: 40, // 2.5rem = 40pts
    fontWeight: '800',
    color: '#ffa94d',
    marginBottom: 8,
  },

  statLabel: {
    fontSize: 14, // 0.875rem ≈ 14pts
    color: '#cbd5e1',
    textAlign: 'center',
    fontWeight: '500',
  },

  // ========== SECTIONS ==========
  featuresSection: {
    backgroundColor: '#0f1629',
    paddingVertical: 60,
  },

  whySection: {
    backgroundColor: '#0a0e27',
    paddingVertical: 60,
  },

  gallerySection: {
    backgroundColor: '#0f1629',
    paddingVertical: 60,
  },

  sectionContainer: {
    paddingHorizontal: 20,
  },

  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },

  titleIcon: {
    fontSize: 32,
    marginRight: 12,
  },

  sectionTitle: {
    fontSize: 28, // 1.75rem = 28pts
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },

  // ========== FEATURES GRID ==========
  featuresGrid: {
    // gap removed - using marginBottom on cards instead
  },

  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 28,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  featureIcon: {
    fontSize: 48,
    marginBottom: 16,
    textAlign: 'center',
  },

  featureTitle: {
    fontSize: 20, // 1.25rem = 20pts
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },

  featureDescription: {
    fontSize: 15, // 0.95rem ≈ 15pts
    color: '#cbd5e1',
    lineHeight: 24,
    textAlign: 'center',
  },

  // ========== WHY CHOOSE US ==========
  whyGrid: {
    // gap removed - using marginBottom on items instead
  },

  whyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },

  whyIcon: {
    fontSize: 28,
    marginRight: 16,
  },

  whyText: {
    fontSize: 15,
    color: '#e2e8f0',
    fontWeight: '500',
    flex: 1,
  },

  // ========== GALLERY ==========
  gallerySubtitle: {
    fontSize: 15,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },

  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  galleryItem: {
    width: (width - 60) / 2, // 2 columns with padding
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },

  galleryPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  placeholderIcon: {
    fontSize: 40,
    marginBottom: 8,
  },

  placeholderText: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
    fontWeight: '500',
  },

  // ========== FOOTER ==========
  footer: {
    backgroundColor: '#0a0e27',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  footerText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
