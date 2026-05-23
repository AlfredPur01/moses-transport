import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useLoanDetails } from '@/hooks/useLoanDetails';

const fmt = (n?: number) =>
  n !== undefined ? `₦${Number(n).toLocaleString('en-NG')}` : '—';

const fmtDate = (s?: string) => {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const fmtPct = (n?: number) =>
  n !== undefined ? `${n}%` : '—';

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  active:    { bg: '#D1FAE5', text: Colors.success },
  completed: { bg: '#DBEAFE', text: '#1E40AF' },
  defaulted: { bg: '#FEE2E2', text: Colors.error },
  suspended: { bg: '#FEF3C7', text: '#92400E' },
};

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && styles.detailHighlight]}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function LoanDetailsScreen() {
  const { loan, loading, refreshing, error, refetch, onRefresh } = useLoanDetails();

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading loan details…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={52} color={Colors.secondary} />
        <Text style={styles.errTitle}>Could not load loan</Text>
        <Text style={styles.errSub}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryTxt}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!loan) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="document-outline" size={52} color={Colors.secondary} />
        <Text style={styles.errTitle}>No active autopay</Text>
        <Text style={styles.errSub}>You don't have an active autopay at this time.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnTxt}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusCfg = STATUS_COLOR[loan.status] ?? { bg: Colors.borderLight, text: Colors.textSecondary };
  const progress = loan.total_repayable > 0
    ? Math.min(loan.total_paid / loan.total_repayable, 1) : 0;
  const pct = Math.round(progress * 100);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Autopay Details</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.statusText, { color: statusCfg.text }]}>
            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Progress card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.loanCode}>{loan.loan_code}</Text>
            <Text style={styles.progressPct}>{pct}% repaid</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.progressPaid}>{fmt(loan.total_paid)} paid</Text>
            <Text style={styles.progressTotal}>{fmt(loan.total_repayable)} total</Text>
          </View>
        </View>

        {/* Financial breakdown */}
        <Section title="Financial Breakdown">
          {loan.asset_price  !== undefined && <DetailRow label="Asset Price"       value={fmt(loan.asset_price)} />}
          {loan.down_payment !== undefined && <DetailRow label="Down Payment"      value={fmt(loan.down_payment)} />}
          {loan.loan_amount  !== undefined && <DetailRow label="Loan Amount"       value={fmt(loan.loan_amount)} />}
          {loan.interest_rate!== undefined && <DetailRow label="Interest Rate"     value={fmtPct(loan.interest_rate)} />}
          <DetailRow label="Total Repayable"   value={fmt(loan.total_repayable)} />
          <View style={styles.divider} />
          <DetailRow label="Total Paid"        value={fmt(loan.total_paid)} />
          <DetailRow label="Balance Remaining" value={fmt(loan.total_balance)} highlight />
        </Section>

        {/* Repayment schedule */}
        <Section title="Repayment Schedule">
          {loan.payment_frequency && (
            <DetailRow label="Frequency"      value={loan.payment_frequency.charAt(0).toUpperCase() + loan.payment_frequency.slice(1)} />
          )}
          <DetailRow label="Daily Payment"    value={fmt(loan.daily_payment)} />
          <DetailRow label="Start Date"       value={fmtDate(loan.start_date)} />
          <DetailRow label="Expected End"     value={fmtDate(loan.expected_end_date)} />
          {loan.actual_end_date && (
            <DetailRow label="Actual End"     value={fmtDate(loan.actual_end_date)} />
          )}
          <DetailRow label="Next Due Date"    value={fmtDate(loan.next_due_date)} />
          {loan.last_payment_date && (
            <DetailRow label="Last Payment"   value={fmtDate(loan.last_payment_date)} />
          )}
        </Section>

        {/* Performance */}
        <Section title="Performance">
          <DetailRow label="Consecutive Missed" value={`${loan.consecutive_missed_days} day(s)`} />
          {loan.total_missed_days !== undefined && (
            <DetailRow label="Total Missed Days" value={`${loan.total_missed_days} day(s)`} />
          )}
          <DetailRow label="Loan Status"      value={loan.status.charAt(0).toUpperCase() + loan.status.slice(1)} />
        </Section>

        {/* Asset */}
        {loan.assets && (
          <Section title="Vehicle">
            <DetailRow label="Type"           value={loan.assets.type} />
            <DetailRow label="Brand & Model"  value={`${loan.assets.brand} ${loan.assets.model}`} />
            <DetailRow label="Color"          value={loan.assets.color} />
            <DetailRow label="Plate Number"   value={loan.assets.plate_number || '—'} />
            <DetailRow label="Condition"      value={loan.assets.condition} />
          </Section>
        )}

        {/* View My Vehicle button */}
        <TouchableOpacity
          style={styles.assetBtn}
          onPress={() => router.push('/(main)/(home)/my-asset')}
          activeOpacity={0.85}
        >
          <Ionicons name="bicycle-outline" size={18} color={Colors.primary} />
          <Text style={styles.assetBtnTxt}>View My Vehicle Details</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
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
  retryTxt: { color: Colors.primary, fontWeight: Typography.weights.semibold },
  backBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, backgroundColor: Colors.primary,
  },
  backBtnTxt: { color: '#fff', fontWeight: Typography.weights.semibold },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  backIcon: { padding: 4 },
  headerTitle: {
    flex: 1, fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold, color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },

  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxxl },

  // Progress card
  progressCard: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, gap: Spacing.sm, ...Shadows.md,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  loanCode: { fontSize: Typography.sizes.sm, color: 'rgba(255,255,255,0.7)', fontWeight: Typography.weights.medium },
  progressPct: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: '#fff' },
  progressTrack: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: BorderRadius.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#86EFAC', borderRadius: BorderRadius.full },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  progressPaid:  { fontSize: Typography.sizes.xs, color: 'rgba(255,255,255,0.75)', fontWeight: Typography.weights.medium },
  progressTotal: { fontSize: Typography.sizes.xs, color: 'rgba(255,255,255,0.55)' },

  // Section
  section: { gap: Spacing.xs },
  sectionTitle: {
    fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: '#fff', borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.borderLight,
    paddingVertical: Spacing.xs, ...Shadows.sm,
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 11,
  },
  detailLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  detailValue: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.text },
  detailHighlight: { color: Colors.error, fontSize: Typography.sizes.base },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.md },

  assetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.cardGreen, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '30',
    ...Shadows.sm,
  },
  assetBtnTxt: {
    flex: 1, fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold, color: Colors.primary,
  },
});
