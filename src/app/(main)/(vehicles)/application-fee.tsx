import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { userApi } from '@/api/user';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { getApiErrorMessage } from '@/utils/error';

export default function ApplicationFeeScreen() {
  const [paid, setPaid]     = useState<boolean | null>(null);
  const [accountNumber, setAccountNumber] = useState<string | null>(null);
  const [bankName, setBankName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    userApi.getProfile()
      .then(({ data }) => {
        setPaid(data.application_fee_paid);
        setAccountNumber(data.virtual_account_number);
        setBankName(data.virtual_bank_name);
      })
      .catch(err => setError(getApiErrorMessage(err) ?? 'Could not load fee status. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async () => {
    if (!accountNumber) return;
    await Clipboard.setStringAsync(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application Fee</Text>
      </View>

      <View style={styles.content}>
        {/* Status icon */}
        <View style={[styles.iconCircle, paid && styles.iconCirclePaid]}>
          <Ionicons
            name={paid ? 'checkmark-circle' : 'receipt-outline'}
            size={52}
            color={paid ? Colors.success : Colors.primary}
          />
        </View>

        <Text style={styles.title}>
          {paid ? 'Fee Already Paid' : 'Pay Application Fee'}
        </Text>
        <Text style={styles.sub}>
          {paid
            ? 'Your application fee has been confirmed. You can now apply for a vehicle.'
            : 'A one-time application fee is required before you can apply for any vehicle on the platform.'}
        </Text>

        {/* How to pay */}
        {!paid && (
          <View style={styles.howToCard}>
            <Text style={styles.howToTitle}>How to pay</Text>
            <Text style={styles.howToBody}>
              Transfer the application fee to your assigned virtual account below. It will be confirmed automatically once received.
            </Text>

            {accountNumber ? (
              <View style={styles.accountBox}>
                <View style={styles.accountRow}>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountLabel}>{bankName ?? 'Virtual Account'}</Text>
                    <Text style={styles.accountNum}>{accountNumber}</Text>
                  </View>
                  <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
                    <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14}
                      color={copied ? Colors.success : Colors.primary} />
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
        )}

        {/* Benefits */}
        {!paid && (
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>What you get</Text>
            {[
              'Access to apply for any available vehicle',
              'Priority review of your application',
              'Full KYC verification support',
            ].map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={15} color={Colors.success} />
                <Text style={styles.benefitTxt}>{b}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
          <Text style={styles.ctaTxt}>Back to Vehicles</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  backIcon:    { padding: 4 },
  headerTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.text },

  content: { flex: 1, padding: Spacing.lg, gap: Spacing.lg, alignItems: 'center' },

  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.cardGreen,
    justifyContent: 'center', alignItems: 'center',
    marginTop: Spacing.lg,
  },
  iconCirclePaid: { backgroundColor: '#D1FAE5' },

  title: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.text, textAlign: 'center' },
  sub:   { fontSize: Typography.sizes.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  howToCard: {
    width: '100%', backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight, gap: Spacing.sm, ...Shadows.sm,
  },
  howToTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.text },
  howToBody:  { fontSize: Typography.sizes.sm, color: Colors.textSecondary, lineHeight: 20 },

  accountBox: {
    backgroundColor: Colors.cardGreen, borderRadius: BorderRadius.md,
    padding: Spacing.md, gap: Spacing.xs,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  accountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accountInfo:{ flex: 1 },
  accountLabel:{ fontSize: Typography.sizes.xs, color: Colors.primary, fontWeight: Typography.weights.medium },
  accountNum: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.primary, letterSpacing: 2 },
  accountNote:{ fontSize: Typography.sizes.xs, color: Colors.textSecondary },
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

  benefitsCard: {
    width: '100%', backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight, gap: Spacing.sm, ...Shadows.sm,
  },
  benefitsTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.text, marginBottom: 4 },
  benefitRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  benefitTxt:    { flex: 1, fontSize: Typography.sizes.sm, color: Colors.textSecondary },

  errorBanner: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: '#FEE2E2', borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  errorTxt: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.error },

  ctaBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg, paddingVertical: 16, ...Shadows.md,
  },
  ctaTxt: { color: '#fff', fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
});
