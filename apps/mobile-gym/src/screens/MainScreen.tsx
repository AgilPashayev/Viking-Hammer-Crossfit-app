import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

type Props = {
  onStart?: () => void;
};

const mockedData = {
  gymName: 'Viking Hammer Crossfit',
  nextClass: 'Crossfit Basics - 6:00 PM',
  notifications: 3,
};

export default function MainScreen({ onStart }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mockedData.gymName}</Text>
      <Text style={styles.item}>Next: {mockedData.nextClass}</Text>
      <Text style={styles.item}>Notifications: {mockedData.notifications}</Text>
      <View style={styles.button}>
        <Button title="Book Class" onPress={onStart} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  item: { fontSize: 16, marginBottom: 8 },
  button: { marginTop: 16 },
});
