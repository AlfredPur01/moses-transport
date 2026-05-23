import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Payment } from '@/api/user';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { usePaymentHistory } from '@/hooks/usePaymentHistory';

const formatCurrency = (amount: number) =>
  `₦${Number(amount || 0).toLocaleString('en-NG')}`;

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  confirmed: { bg: '#D1FAE5', color: Colors.success, label: 'Confirmed' },
  pending:   { bg: Colors.badge.pending.bg, color: Colors.badge.pending.text, label: 'Pending' },
  failed:    { bg: '#FEE2E2', color: Colors.error, label: 'Failed' },
  reversed:  { bg: '#FEF3C7', color: '#92400E', label: 'Reversed' },
};

function PaymentCard({ payment }: { payment: Payment }) {
  const isMissed = payment.status === 'failed';
  const statusCfg = STATUS_CONFIG[payment.status] ?? { bg: Colors.borderLight, color: Colors.textSecondary, label: payment.status };

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.iconWrap, { backgroundColor: isMissed ? '#FEE2E2' : '#D1FAE5' }]}>
          <Ionicons
            name={isMissed ? 'close-circle-outline' : 'checkmark-circle-outline'}
            size={22}
            color={isMissed ? Colors.error : Colors.success}
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.paymentCode}>{payment.payment_code}</Text>
          <Text style={styles.paymentDate}>{formatDate(payment.payment_date)}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.amount, isMissed && styles.amountMissed]}>
            {isMissed ? '—' : formatCurrency(payment.amount)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>
      </View>

      {!isMissed && (
        <View style={styles.cardBottom}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Method</Text>
            <Text style={styles.detailValue}>{payment.method}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Balance after</Text>
            <Text style={styles.detailValue}>{formatCurrency(payment.balance_after)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Ionicons name="receipt-outline" size={56} color={Colors.secondary} />
      <Text style={styles.emptyTitle}>No payments yet</Text>
      <Text style={styles.emptySub}>
        Your payment history will appear here once your autopay is active.
      </Text>
    </View>
  );
}

export default function PaymentHistoryScreen() {
  const {
    payments,
    total,
    loading,
    loadingMore,
    refreshing,
    error,
    loadMore,
    onRefresh,
  } = usePaymentHistory();

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading payments…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Payment History</Text>
          {total > 0 && <Text style={styles.headerCount}>{total} total</Text>}
        </View>
        <TouchableOpacity
          style={styles.makePayBtn}
          onPress={() => router.push('/(main)/(payment)/make-payment')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.makePayTxt}>Make Payment</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PaymentCard payment={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadMore}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : payments.length > 0 && payments.length >= total ? (
            <Text style={styles.endText}>All payments loaded</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: { fontSize: Typography.sizes.base, color: Colors.textSecondary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  headerCount: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  errorText: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.error },
  list: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    flexGrow: 1,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  paymentCode: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  paymentDate: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  amount: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.success,
  },
  amountMissed: { color: Colors.error },
  statusBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  statusText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  cardBottom: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 4,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
  detailValue: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.xxxl,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  emptySub: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  loadMore: { paddingVertical: Spacing.lg, alignItems: 'center' },
  endText: {
    textAlign: 'center',
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    paddingVertical: Spacing.lg,
  },
  makePayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  makePayTxt: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: '#fff',
  },
});
