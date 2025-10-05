import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import MainScreen from './src/screens/MainScreen';
import MemberDashboard from './src/screens/MemberDashboard';

export default function App() {
  const [screen, setScreen] = useState<'main' | 'dashboard'>('main');

  return (
    <View style={styles.container}>
      {screen === 'main' ? (
        <MainScreen
          onStart={() => console.log('Book pressed')}
          onOpenDashboard={() => setScreen('dashboard')}
        />
      ) : (
        <MemberDashboard />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
