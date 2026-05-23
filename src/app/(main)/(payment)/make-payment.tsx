import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthUser } from '@/api/auth';
import { userApi } from '@/api/user';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { getApiErrorMessage } from '@/utils/error';

export default function FundWalletScreen() {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying]   = useState(false);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    userApi.getProfile()
      .then(({ data }) => setUser(data))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async () => {
    if (!user?.virtual_account_number) return;
    await Clipboard.setStringAsync(user.virtual_account_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayNow = async () => {
    Alert.alert(
      'Confirm Payment',
      'This will deduct your due autopay installment from your wallet balance. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: async () => {
            setPaying(true);
            try {
              const { data } = await userApi.payNow();
              const msg = data.isCompleted
                ? `Payment complete!\n\nDeducted: ₦${Number(data.deducted).toLocaleString('en-NG')}\nLoan fully paid off.`
                : `₦${Number(data.deducted).toLocaleString('en-NG')} deducted.\nNew loan balance: ₦${Number(data.newLoanBalance).toLocaleString('en-NG')}`;
              Alert.alert('Payment Successful', msg, [
                { text: 'OK', onPress: () => router.replace('/(main)/(home)') },
              ]);
            } catch (err) {
              const msg = getApiErrorMessage(err) ?? 'Payment failed. Please try again.';
              Alert.alert('Payment Failed', msg);
            } finally {
              setPaying(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const hasAccount = !!user?.virtual_account_number;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fund Wallet</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Wallet balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Wallet Balance</Text>
          <Text style={styles.balanceValue}>
            ₦{Number(user?.wallet_balance ?? 0).toLocaleString('en-NG')}
          </Text>
        </View>

        {/* How to fund */}
        <View style={styles.howToCard}>
          <Text style={styles.sectionTitle}>How to Fund Your Wallet</Text>
          <Text style={styles.sectionBody}>
            Transfer any amount to your dedicated virtual account below. Funds are credited to your wallet automatically once the deposit is received.
          </Text>

          {hasAccount ? (
            <View style={styles.accountBox}>
              <View style={styles.accountRow}>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountLabel}>
                    {user?.virtual_bank_name ?? 'Virtual Account'}
                  </Text>
                  <Text style={styles.accountNum}>{user?.virtual_account_number}</Text>
                  {user?.virtual_account_name ? (
                    <Text style={styles.accountName}>{user.virtual_account_name}</Text>
                  ) : null}
                </View>
                <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy-outline'}
                    size={14}
                    color={copied ? Colors.success : Colors.primary}
                  />
                  <Text style={[styles.copyTxt, copied && styles.copyTxtDone]}>
                    {copied ? 'Copied!' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.accountNote}>₦100 processing fee applies per deposit</Text>
            </View>
          ) : (
            <View style={styles.noAccountBox}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.noAccountTxt}>
                Your virtual account will be assigned once your KYC is approved.
              </Text>
            </View>
          )}
        </View>

        {/* Auto-deduction schedule */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <Ionicons name="time-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Auto-Deduction Schedule</Text>
          </View>
          {[
            { time: '08:00 AM', label: 'Morning run' },
            { time: '01:00 PM', label: 'Afternoon run' },
            { time: '06:00 PM', label: 'Evening run' },
          ].map((s) => (
            <View key={s.time} style={styles.scheduleRow}>
              <Ionicons name="radio-button-on" size={10} color={Colors.primary} />
              <Text style={styles.scheduleTime}>{s.time}</Text>
              <Text style={styles.scheduleLabel}>{s.label}</Text>
            </View>
          ))}
          <Text style={styles.scheduleNote}>Deductions run Sunday – Friday (WAT)</Text>
        </View>

        {/* Pay Now */}
        <View style={styles.payNowCard}>
          <Text style={styles.payNowTitle}>Already have wallet balance?</Text>
          <Text style={styles.payNowBody}>
            Trigger an immediate deduction of your due autopay installment from your current wallet balance.
          </Text>
          <TouchableOpacity
            style={[styles.payNowBtn, paying && styles.payNowBtnDisabled]}
            onPress={handlePayNow}
            disabled={paying}
            activeOpacity={0.85}
          >
            {paying
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="flash" size={18} color="#fff" />}
            <Text style={styles.payNowBtnTxt}>
              {paying ? 'Processing…' : 'Pay Installment Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: {
    flex: 1, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
  },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  backIcon:    { padding: 4 },
  headerTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.text },

  scroll: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: Spacing.xxxl },

  balanceCard: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, alignItems: 'center', gap: Spacing.xs,
    ...Shadows.md,
  },
  balanceLabel: { fontSize: Typography.sizes.sm, color: 'rgba(255,255,255,0.75)' },
  balanceValue: { fontSize: Typography.sizes.xxxl, fontWeight: Typography.weights.extrabold, color: '#fff' },

  howToCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm,
  },
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.text },
  sectionBody:  { fontSize: Typography.sizes.sm, color: Colors.textSecondary, lineHeight: 20 },

  accountBox: {
    backgroundColor: Colors.cardGreen, borderRadius: BorderRadius.md,
    padding: Spacing.md, gap: Spacing.xs,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  accountRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accountInfo: { flex: 1 },
  accountLabel:{ fontSize: Typography.sizes.xs, color: Colors.primary, fontWeight: Typography.weights.medium },
  accountNum:  { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.primary, letterSpacing: 2 },
  accountName: { fontSize: Typography.sizes.xs, color: Colors.primaryLight, marginTop: 2 },
  accountNote: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  copyTxt:    { fontSize: Typography.sizes.xs, color: Colors.primary, fontWeight: Typography.weights.medium },
  copyTxtDone:{ color: Colors.success },

  noAccountBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs,
    backgroundColor: '#F3F4F6', borderRadius: BorderRadius.md, padding: Spacing.sm,
  },
  noAccountTxt: { flex: 1, fontSize: Typography.sizes.xs, color: Colors.textSecondary, lineHeight: 18 },

  scheduleCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm,
  },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  scheduleRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingLeft: 4 },
  scheduleTime:   { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.text, width: 72 },
  scheduleLabel:  { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  scheduleNote:   { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: Spacing.xs },

  payNowCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm,
  },
  payNowTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.text },
  payNowBody:  { fontSize: Typography.sizes.sm, color: Colors.textSecondary, lineHeight: 20 },
  payNowBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg, paddingVertical: 15, ...Shadows.sm,
  },
  payNowBtnDisabled: { opacity: 0.6 },
  payNowBtnTxt: { color: '#fff', fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },
});
