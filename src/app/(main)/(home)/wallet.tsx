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
import { useWallet } from '@/hooks/useWallet';

const fmt = (n: number) => `₦${Number(n || 0).toLocaleString('en-NG')}`;

const fmtDate = (s: string) => {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: '#D1FAE5', text: Colors.success },
  pending:   { bg: Colors.badge.pending.bg, text: Colors.badge.pending.text },
  failed:    { bg: '#FEE2E2', text: Colors.error },
  reversed:  { bg: '#FEF3C7', text: '#92400E' },
};

function PaymentCard({ item }: { item: Payment }) {
  const isOk = item.status === 'confirmed';
  const sc = STATUS_COLOR[item.status] ?? { bg: Colors.borderLight, text: Colors.textSecondary };
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, isOk ? styles.iconOk : styles.iconFail]}>
        <Ionicons
          name={isOk ? 'checkmark-outline' : 'arrow-up-outline'}
          size={18}
          color={isOk ? Colors.success : Colors.error}
        />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardDesc} numberOfLines={1}>{item.payment_code}</Text>
        <Text style={styles.cardDate}>{fmtDate(item.payment_date)}</Text>
        <Text style={styles.cardMethod}>{item.method?.replace('_', ' ')}</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.cardAmount, !isOk && styles.cardAmountFail]}>
          -{fmt(item.amount)}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusTxt, { color: sc.text }]}>{item.status}</Text>
        </View>
        {item.balance_after != null && (
          <Text style={styles.cardBalance}>Bal: {fmt(item.balance_after)}</Text>
        )}
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Ionicons name="receipt-outline" size={56} color={Colors.secondary} />
      <Text style={styles.emptyTitle}>No payments yet</Text>
      <Text style={styles.emptySub}>Your autopay deductions will appear here once your plan is active.</Text>
    </View>
  );
}

export default function WalletScreen() {
  const { payments, total, loading, refreshing, error, onRefresh, refetch } = useWallet();

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading payment history…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={52} color={Colors.secondary} />
        <Text style={styles.errTitle}>Could not load history</Text>
        <Text style={styles.errSub}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryTxt}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const confirmed = payments.filter(p => p.status === 'confirmed').reduce((s, p) => s + p.amount, 0);
  const failed    = payments.filter(p => p.status === 'failed' || p.status === 'reversed').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        {total > 0 && <Text style={styles.headerCount}>{total} txns</Text>}
      </View>

      {/* Summary */}
      {payments.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Paid</Text>
            <Text style={[styles.summaryValue, styles.summaryOk]}>{fmt(confirmed)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Failed / Reversed</Text>
            <Text style={[styles.summaryValue, styles.summaryFail]}>{failed}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={payments}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PaymentCard item={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.xs }} />}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  {
    flex: 1, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center', gap: Spacing.md,
  },
  loadingText: { fontSize: Typography.sizes.base, color: Colors.textSecondary },
  errTitle:    { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold, color: Colors.text },
  errSub:      { fontSize: Typography.sizes.sm, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn:    { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.primary },
  retryTxt:    { color: Colors.primary, fontWeight: Typography.weights.semibold },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  backIcon:    { padding: 4 },
  headerTitle: { flex: 1, fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.text },
  headerCount: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },

  summary: {
    flexDirection: 'row', backgroundColor: Colors.card,
    marginHorizontal: Spacing.md, marginTop: Spacing.md,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm,
  },
  summaryItem:    { flex: 1, alignItems: 'center', gap: 4 },
  summaryLabel:   { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
  summaryValue:   { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },
  summaryOk:      { color: Colors.success },
  summaryFail:    { color: Colors.error },
  summaryDivider: { width: 1, backgroundColor: Colors.borderLight },

  list: { padding: Spacing.md, paddingBottom: Spacing.xxxl, flexGrow: 1 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm,
  },
  iconWrap:  { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  iconOk:    { backgroundColor: '#D1FAE5' },
  iconFail:  { backgroundColor: '#FEE2E2' },
  cardBody:  { flex: 1 },
  cardDesc:  { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.text },
  cardDate:  { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 2 },
  cardMethod:{ fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 1, textTransform: 'capitalize' },
  cardRight: { alignItems: 'flex-end', gap: 3 },
  cardAmount:     { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.error },
  cardAmountFail: { color: Colors.textSecondary },
  statusBadge: { borderRadius: BorderRadius.full, paddingHorizontal: 6, paddingVertical: 2 },
  statusTxt:   { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold, textTransform: 'capitalize' },
  cardBalance: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.xxxl },
  emptyTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold, color: Colors.text },
  emptySub:   { fontSize: Typography.sizes.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.lg },
});
