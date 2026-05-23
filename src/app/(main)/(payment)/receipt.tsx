import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { usePaymentReceipt } from '@/hooks/usePaymentReceipt';

const fmt = (n?: number) =>
  n !== undefined ? `₦${Number(n).toLocaleString('en-NG')}` : '—';

const fmtDate = (s?: string) => {
  if (!s) return '—';
  return new Date(s).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function PaymentReceiptScreen() {
  const { paymentCode } = useLocalSearchParams<{ paymentCode: string }>();
  const { payment, loading, error, refetch } = usePaymentReceipt(paymentCode ?? '');

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading receipt…</Text>
      </SafeAreaView>
    );
  }

  if (error || !payment) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="receipt-outline" size={52} color={Colors.secondary} />
        <Text style={styles.errTitle}>Receipt not found</Text>
        <Text style={styles.errSub}>{error ?? 'Could not load this payment.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryTxt}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(main)/(payment)')}>
          <Text style={styles.backLink}>Back to Payments</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isSuccess = payment.status === 'paid' || payment.status === 'confirmed';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Status badge */}
        <View style={styles.statusBlock}>
          <View style={[styles.statusCircle, isSuccess ? styles.statusCircleGreen : styles.statusCircleRed]}>
            <Ionicons
              name={isSuccess ? 'checkmark' : 'close'}
              size={44}
              color="#fff"
            />
          </View>
          <Text style={[styles.statusTitle, isSuccess ? styles.statusTitleGreen : styles.statusTitleRed]}>
            {isSuccess ? 'Payment Successful' : 'Payment Failed'}
          </Text>
          <Text style={styles.statusAmount}>{fmt(payment.amount)}</Text>
        </View>

        {/* Receipt card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Ionicons name="receipt-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.receiptHeaderTxt}>Payment Receipt</Text>
          </View>
          <View style={styles.divider} />

          <ReceiptRow label="Payment Code"  value={payment.payment_code} />
          <ReceiptRow label="Date"          value={fmtDate(payment.payment_date)} />
          <ReceiptRow label="Amount"        value={fmt(payment.amount)} />
          <ReceiptRow label="Method"        value={payment.method.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())} />
          <ReceiptRow label="Status"        value={payment.status.charAt(0).toUpperCase() + payment.status.slice(1)} />
          {payment.balance_after !== undefined && (
            <ReceiptRow label="Balance After" value={fmt(payment.balance_after)} />
          )}
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace('/(main)/(home)')}
          activeOpacity={0.85}
        >
          <Ionicons name="home-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnTxt}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() => router.replace('/(main)/(payment)')}
        >
          <Text style={styles.outlineBtnTxt}>View Payment History</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: {
    flex: 1, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
    gap: Spacing.md, padding: Spacing.xl,
  },
  loadingText: { fontSize: Typography.sizes.base, color: Colors.textSecondary },
  errTitle:   { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold, color: Colors.text },
  errSub:     { fontSize: Typography.sizes.sm, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.primary,
  },
  retryTxt:  { color: Colors.primary, fontWeight: Typography.weights.semibold },
  backLink:  { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: Spacing.xs },

  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxxl },

  statusBlock: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  statusCircle: {
    width: 96, height: 96, borderRadius: 48,
    justifyContent: 'center', alignItems: 'center', ...Shadows.md,
  },
  statusCircleGreen: { backgroundColor: Colors.success },
  statusCircleRed:   { backgroundColor: Colors.error },
  statusTitle:       { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  statusTitleGreen:  { color: Colors.success },
  statusTitleRed:    { color: Colors.error },
  statusAmount: {
    fontSize: Typography.sizes.xxxl, fontWeight: Typography.weights.extrabold,
    color: Colors.text,
  },

  receiptCard: {
    backgroundColor: '#fff', borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.borderLight,
    padding: Spacing.md, ...Shadows.sm,
  },
  receiptHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  receiptHeaderTxt: {
    fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginBottom: Spacing.sm },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  rowLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  rowValue: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.text },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg, paddingVertical: 15,
    ...Shadows.sm,
  },
  primaryBtnTxt: { color: '#fff', fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },
  outlineBtn: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: BorderRadius.lg, paddingVertical: 15,
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  outlineBtnTxt: { color: Colors.primary, fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
});
