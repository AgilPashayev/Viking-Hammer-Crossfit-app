import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const stats = [
  { id: '1', label: 'Visits', value: '42' },
  { id: '2', label: 'Classes Booked', value: '7' },
  { id: '3', label: 'Membership', value: 'Active' },
];

const upcoming = [
  { id: 'a', title: 'Crossfit Basics', time: '2025-10-06 18:00' },
  { id: 'b', title: 'Advanced Lifting', time: '2025-10-08 19:00' },
];

export default function MemberDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Member Dashboard</Text>

      <View style={styles.stats}>
        {stats.map((s) => (
          <View key={s.id} style={styles.statItem}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Upcoming Classes</Text>
      <FlatList
        data={upcoming}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.upcomingItem}>
            <Text style={styles.upcomingTitle}>{item.title}</Text>
            <Text style={styles.upcomingTime}>{item.time}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '600' },
  statLabel: { fontSize: 12, color: '#666' },
  section: { fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 8 },
  upcomingItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  upcomingTitle: { fontSize: 14 },
  upcomingTime: { fontSize: 12, color: '#666' },
});
