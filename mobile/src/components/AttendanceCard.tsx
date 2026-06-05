import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '../constants/theme';
import StatusBadge from './StatusBadge';

interface AttendanceRecord {
  id: string;
  date: string;
  dayLabel: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  totalHours: string;
  totalBreak: string;
  wifiVerified: boolean;
  deviceVerified: boolean;
}

export default function AttendanceCard({ record }: { record: AttendanceRecord }) {
  const isWeekend = record.status === 'WEEKEND';
  const isAbsent = record.status === 'ABSENT';
  const hasData = !isWeekend;

  return (
    <View style={[styles.card, isWeekend && styles.cardWeekend]}>
      <View style={styles.left}>
        <Text style={styles.dayLabel}>{record.dayLabel}</Text>
        <StatusBadge status={record.status} small />
      </View>
      {hasData && (
        <View style={styles.right}>
          {!isAbsent && record.status !== 'ON_LEAVE' ? (
            <>
              <View style={styles.timeRow}>
                <View style={styles.timeItem}>
                  <Ionicons name="log-in-outline" size={14} color={Colors.success} />
                  <Text style={styles.timeValue}>{record.checkIn ?? '—'}</Text>
                </View>
                <Ionicons name="arrow-forward" size={12} color={Colors.gray300} />
                <View style={styles.timeItem}>
                  <Ionicons name="log-out-outline" size={14} color={Colors.orange} />
                  <Text style={styles.timeValue}>{record.checkOut ?? '—'}</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <Text style={styles.stat}>{record.totalHours}</Text>
                <Text style={styles.statDot}>·</Text>
                <Text style={styles.stat}>Break {record.totalBreak}</Text>
              </View>
              {(record.wifiVerified || record.deviceVerified) && (
                <View style={styles.verRow}>
                  {record.wifiVerified && <Ionicons name="wifi" size={12} color={Colors.success} />}
                  {record.deviceVerified && <Ionicons name="phone-portrait" size={12} color={Colors.success} />}
                </View>
              )}
            </>
          ) : (
            <Text style={styles.noData}>{record.status === 'ON_LEAVE' ? 'On approved leave' : 'No record'}</Text>
          )}
        </View>
      )}
      {isWeekend && (
        <View style={styles.right}>
          <Text style={styles.noData}>Rest day</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, borderRadius: 14,
    padding: 14, flexDirection: 'row', alignItems: 'center',
    ...Shadow.sm,
  },
  cardWeekend: { backgroundColor: Colors.gray50, opacity: 0.7 },
  left: { width: 110, gap: 4 },
  dayLabel: { fontSize: 12, fontWeight: '600', color: Colors.gray600 },
  right: { flex: 1, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: Colors.gray100 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  timeItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeValue: { fontSize: 13, fontWeight: '700', color: Colors.gray800 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stat: { fontSize: 11, color: Colors.gray500 },
  statDot: { color: Colors.gray300 },
  verRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  noData: { fontSize: 13, color: Colors.gray400, fontStyle: 'italic' },
});
