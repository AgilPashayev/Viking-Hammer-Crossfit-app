import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import './src/i18n/i18n.config'; // Initialize i18n
import LandingScreen from './src/screens/LandingScreen';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState('landing');

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    console.log('Navigate to:', page);
  };

  const handleGetStarted = () => {
    console.log('Get Started clicked');
    // TODO: Navigate to registration
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('landing');
    console.log('User logged out');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LandingScreen
        user={user}
        onNavigate={handleNavigate}
        onGetStarted={handleGetStarted}
        onLogout={handleLogout}
      />
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
});
