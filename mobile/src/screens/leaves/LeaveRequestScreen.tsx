import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Shadow, Radius } from '../../constants/theme';
import { getLeaveBalances, submitLeaveRequest, LeaveBalance } from '../../services/leaveService';
import { LEAVE_TYPES } from '../../constants/types';

export default function LeaveRequestScreen() {
  const navigation = useNavigation<any>();
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [showTypePicker, setShowTypePicker] = useState(false);

  useEffect(() => {
    getLeaveBalances().then(setBalances).catch(() => {});
  }, []);

  const selectedBalance = balances.find((b) => b.type === leaveType);
  const selectedLabel = LEAVE_TYPES.find((t) => t.type === leaveType)?.label ?? leaveType;

  const calcDays = () => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate); const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
    return Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
  };
  const days = calcDays();

  const handleSubmit = async () => {
    if (!startDate || !endDate) { Alert.alert('Missing Dates', 'Please enter start and end dates (YYYY-MM-DD).'); return; }
    if (days <= 0) { Alert.alert('Invalid Dates', 'End date must be on or after start date.'); return; }
    if (!reason.trim()) { Alert.alert('Reason Required', 'Please provide a reason for your leave.'); return; }
    if (selectedBalance && days > selectedBalance.remaining) {
      Alert.alert('Insufficient Balance', `You only have ${selectedBalance.remaining} day(s) remaining for ${selectedLabel}.`);
      return;
    }
    setLoading(true);
    try {
      await submitLeaveRequest({ leaveType, startDate, endDate, reason });
      Alert.alert('Request Submitted', `Your ${selectedLabel} request for ${days} day(s) has been submitted and is pending admin approval.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Submission Failed', err?.message ?? 'Unable to submit leave request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.gray700} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Request Leave</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Leave Type */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Leave Type</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setShowTypePicker(!showTypePicker)}>
            <View style={[styles.selectorDot, { backgroundColor: selectedBalance?.color ?? Colors.primary }]} />
            <Text style={styles.selectorText}>{selectedLabel}</Text>
            <Ionicons name={showTypePicker ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.gray400} />
          </TouchableOpacity>
          {showTypePicker && (
            <View style={styles.picker}>
              {LEAVE_TYPES.map((lt) => {
                const bal = balances.find((b) => b.type === lt.type);
                return (
                  <TouchableOpacity key={lt.type} style={[styles.pickerItem, lt.type === leaveType && styles.pickerItemActive]} onPress={() => { setLeaveType(lt.type); setShowTypePicker(false); }}>
                    <View style={[styles.pickerDot, { backgroundColor: bal?.color ?? Colors.gray300 }]} />
                    <Text style={[styles.pickerText, lt.type === leaveType && { color: Colors.primary }]}>{lt.label}</Text>
                    <Text style={styles.pickerBalance}>{bal?.remaining ?? '—'}d left</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          {selectedBalance && (
            <View style={styles.balanceHint}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.primary} />
              <Text style={styles.balanceHintText}>Balance: {selectedBalance.remaining}/{selectedBalance.entitled} days remaining</Text>
            </View>
          )}
        </View>

        {/* Dates */}
        <View style={styles.dateRow}>
          {(['Start', 'End'] as const).map((label) => (
            <View key={label} style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>{label} Date</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="calendar-outline" size={18} color={Colors.gray400} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.gray300}
                  value={label === 'Start' ? startDate : endDate}
                  onChangeText={label === 'Start' ? setStartDate : setEndDate}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>
          ))}
        </View>

        {days > 0 && (
          <View style={styles.daysBadge}>
            <Ionicons name="time-outline" size={16} color={Colors.primary} />
            <Text style={styles.daysText}>{days} working day{days !== 1 ? 's' : ''} requested</Text>
          </View>
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Reason</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Briefly describe the reason for your leave..."
            placeholderTextColor={Colors.gray300}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{reason.length}/500</Text>
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.gray400} />
          <Text style={styles.noteText}>Your request will be reviewed by your administrator. You'll be notified once a decision is made.</Text>
        </View>

        <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="paper-plane-outline" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Request</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  backBtn: { padding: 6, backgroundColor: Colors.gray100, borderRadius: 10 },
  topTitle: { fontSize: 17, fontWeight: '700', color: Colors.gray800 },
  scroll: { padding: 20, paddingBottom: 40 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.gray700, marginBottom: 6 },
  selector: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.md, backgroundColor: Colors.gray50, paddingHorizontal: 12, height: 50 },
  selectorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  selectorText: { flex: 1, fontSize: 15, color: Colors.gray800 },
  picker: { backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.gray200, marginTop: 4, overflow: 'hidden', ...Shadow.sm },
  pickerItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  pickerItemActive: { backgroundColor: Colors.primaryBg },
  pickerDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  pickerText: { flex: 1, fontSize: 14, color: Colors.gray700 },
  pickerBalance: { fontSize: 12, color: Colors.gray400 },
  balanceHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  balanceHintText: { fontSize: 12, color: Colors.primary },
  dateRow: { flexDirection: 'row', gap: 12 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.md, backgroundColor: Colors.gray50, paddingHorizontal: 12, height: 50 },
  input: { flex: 1, fontSize: 15, color: Colors.gray800 },
  daysBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primaryBg, borderRadius: 8, padding: 10, marginBottom: 16 },
  daysText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  textarea: { borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.md, backgroundColor: Colors.gray50, padding: 12, fontSize: 14, color: Colors.gray800, minHeight: 100, lineHeight: 20 },
  charCount: { textAlign: 'right', fontSize: 11, color: Colors.gray400, marginTop: 4 },
  note: { flexDirection: 'row', gap: 8, backgroundColor: Colors.gray50, borderRadius: 10, padding: 12, marginBottom: 20 },
  noteText: { flex: 1, fontSize: 12, color: Colors.gray500, lineHeight: 16 },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...Shadow.lg },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
