import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActiveLoan, Payment, UserProfile, userApi } from '@/api/user';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useDashboard } from '@/hooks/useDashboard';

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) => `₦${Number(n || 0).toLocaleString('en-NG')}`;

// Compact format for tight stat boxes: ₦1.5M, ₦250K, ₦8,500
const fmtCompact = (n: number) => {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(1)}K`;
  return `₦${v.toLocaleString('en-NG')}`;
};

const fmtDate = (s: string) => {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// ─── Gate Cards ──────────────────────────────────────────────────────────────

function FeeGateCard() {
  return (
    <View style={styles.gateCard}>
      <View style={styles.gateIconWrap}>
        <Ionicons name="receipt-outline" size={52} color={Colors.primary} />
      </View>
      <Text style={styles.gateTitle}>Application Fee Required</Text>
      <Text style={styles.gateBody}>
        To begin your KYC verification and access autopay plans, you need to pay a one-time application fee.
      </Text>
      <TouchableOpacity
        style={styles.gateBtn}
        onPress={() => router.push('/(main)/(vehicles)/application-fee')}
        activeOpacity={0.85}
      >
        <Ionicons name="card-outline" size={18} color="#fff" />
        <Text style={styles.gateBtnTxt}>Pay Application Fee</Text>
      </TouchableOpacity>
    </View>
  );
}

function KycGateCard() {
  return (
    <View style={styles.gateCard}>
      <View style={styles.gateIconWrap}>
        <Ionicons name="shield-checkmark-outline" size={52} color={Colors.primary} />
      </View>
      <Text style={styles.gateTitle}>Complete Your KYC</Text>
      <Text style={styles.gateBody}>
        Verify your identity to unlock autopay plans and full access to Moses Transportation services.
      </Text>
      <TouchableOpacity
        style={styles.gateBtn}
        onPress={() => router.push('/(main)/(profile)/kyc/intro')}
        activeOpacity={0.85}
      >
        <Ionicons name="arrow-forward-circle-outline" size={18} color="#fff" />
        <Text style={styles.gateBtnTxt}>Complete KYC</Text>
      </TouchableOpacity>
    </View>
  );
}

function TrackKycCard({ status }: { status: string }) {
  const rejected = status === 'rejected';
  return (
    <View style={styles.gateCard}>
      <View style={[styles.gateIconWrap, rejected && styles.gateIconWrapRed]}>
        <Ionicons
          name={rejected ? 'warning-outline' : 'time-outline'}
          size={52}
          color={rejected ? '#DC2626' : Colors.primary}
        />
      </View>
      <Text style={[styles.gateTitle, rejected && styles.gateTitleRed]}>
        {rejected ? 'KYC Action Required' : 'KYC Under Review'}
      </Text>
      <Text style={styles.gateBody}>
        {rejected
          ? 'Your submission was not approved. Review the admin feedback and resubmit to continue.'
          : 'Your documents have been submitted and are currently being reviewed. We will notify you once a decision is made.'}
      </Text>
      <TouchableOpacity
        style={[styles.gateBtn, rejected && styles.gateBtnRed]}
        onPress={() => router.push('/(main)/(profile)/kyc/pending')}
        activeOpacity={0.85}
      >
        <Ionicons name={rejected ? 'create-outline' : 'search-outline'} size={18} color="#fff" />
        <Text style={styles.gateBtnTxt}>
          {rejected ? 'View Feedback & Fix' : 'Track My Application'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Account Card ────────────────────────────────────────────────────────────

function AccountCard({ user, loan }: { user: UserProfile; loan: ActiveLoan | null }) {
  const [copied, setCopied] = useState(false);

  if (!user.virtual_account_number) return null;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(user.virtual_account_number!);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const walletBalance = user.wallet_balance ?? 0;

  return (
    <View style={styles.accountCard}>
      {/* Top row: label + bank name */}
      <View style={styles.accountTopRow}>
        <View style={styles.accountLabelRow}>
          <View style={styles.accountIconWrap}>
            <Ionicons name="wallet" size={13} color={Colors.primary} />
          </View>
          <Text style={styles.accountLabel}>Payment Account</Text>
        </View>
        <Text style={styles.bankName}>{user.virtual_bank_name ?? 'Bank'}</Text>
      </View>

      {/* Account number + copy */}
      <View style={styles.accountNumRow}>
        <Text style={styles.accountNum} numberOfLines={1}>{user.virtual_account_number}</Text>
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14}
            color={copied ? '#86EFAC' : 'rgba(255,255,255,0.8)'} />
          <Text style={[styles.copyTxt, copied && styles.copyTxtDone]}>
            {copied ? 'Copied!' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Account holder name */}
      {user.virtual_account_name ? (
        <Text style={styles.accountHolderName}>{user.virtual_account_name}</Text>
      ) : null}

      {/* Fee note */}
      <Text style={styles.feeNote}>₦100 processing fee applies per deposit</Text>

      {/* Divider */}
      <View style={styles.accountDivider} />

      {/* Wallet balance + loan balance */}
      <View style={styles.balanceRow}>
        <View style={styles.balanceStat}>
          <Text style={styles.balanceLabel}>Wallet Balance</Text>
          <Text style={styles.balanceValue}>{fmt(walletBalance)}</Text>
        </View>
        {loan && (
          <>
            <View style={styles.balanceStatSep} />
            <View style={styles.balanceStat}>
              <Text style={styles.balanceLabel}>Autopay Balance</Text>
              <Text style={[styles.balanceValue, styles.balanceValueRed]}>
                {fmt(loan.total_balance)}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

// ─── Loan Card ───────────────────────────────────────────────────────────────

function LoanCard({ loan }: { loan: ActiveLoan }) {
  const progress = loan.total_repayable > 0
    ? Math.min(loan.total_paid / loan.total_repayable, 1) : 0;
  const pct = Math.round(progress * 100);
  const overdue = loan.consecutive_missed_days > 0;

  return (
    <View style={styles.loanCard}>
      {/* Vehicle header */}
      <View style={styles.loanHeader}>
        <View style={styles.loanVehicleIcon}>
          <Ionicons name="bicycle" size={22} color={Colors.primary} />
        </View>
        <View style={styles.loanHeaderText}>
          <Text style={styles.loanVehicleName} numberOfLines={1}>
            {loan.assets?.brand} {loan.assets?.model}
          </Text>
          <Text style={styles.loanVehicleType}>{loan.assets?.type} · {loan.assets?.plate_number || loan.loan_code}</Text>
        </View>
        <View style={styles.activePill}>
          <View style={styles.activeDot} />
          <Text style={styles.activePillText}>Active</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressPaid}>{fmt(loan.total_paid)} paid</Text>
          <Text style={styles.progressPct}>{pct}%</Text>
          <Text style={styles.progressTotal}>{fmt(loan.total_repayable)} total</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal} numberOfLines={1} adjustsFontSizeToFit>
            {fmtCompact(loan.daily_payment)}
          </Text>
          <Text style={styles.statLbl}>Daily</Text>
        </View>
        <View style={styles.statSep} />
        <View style={styles.statBox}>
          <Text style={styles.statVal} numberOfLines={1} adjustsFontSizeToFit>
            {fmtCompact(loan.total_balance)}
          </Text>
          <Text style={styles.statLbl}>Balance left</Text>
        </View>
        <View style={styles.statSep} />
        <View style={styles.statBox}>
          <Text style={[styles.statVal, overdue && styles.statValDanger]} numberOfLines={1}>
            {loan.consecutive_missed_days}
          </Text>
          <Text style={styles.statLbl}>Missed days</Text>
        </View>
      </View>

      {/* Next payment date — prominent */}
      <View style={[styles.nextPayRow, overdue && styles.nextPayRowDanger]}>
        <View style={styles.nextPayLeft}>
          <Ionicons
            name={overdue ? 'warning-outline' : 'calendar'}
            size={16}
            color={overdue ? Colors.error : Colors.primary}
          />
          <Text style={styles.nextPayLabel}>
            {overdue ? 'Overdue' : 'Next payment'}
          </Text>
        </View>
        <Text style={[styles.nextPayDate, overdue && styles.nextPayDateDanger]}>
          {overdue
            ? `${loan.consecutive_missed_days} day${loan.consecutive_missed_days > 1 ? 's' : ''} behind`
            : fmtDate(loan.next_due_date)}
        </Text>
      </View>
    </View>
  );
}

// ─── No Loan Card ─────────────────────────────────────────────────────────────

function NoLoanCard() {
  return (
    <View style={styles.noLoanCard}>
      <View style={styles.noLoanIllustration}>
        <Ionicons name="bicycle-outline" size={44} color={Colors.primary} />
      </View>
      <Text style={styles.noLoanTitle}>No active autopay</Text>
      <Text style={styles.noLoanSub}>
        Browse available vehicles and apply for a daily or weekly autopay plan.
      </Text>

    </View>
  );
}

// ─── Payment Item ─────────────────────────────────────────────────────────────

function PaymentItem({ payment, last }: { payment: Payment; last: boolean }) {
  const missed = payment.status === 'missed';
  return (
    <>
      <View style={styles.payItem}>
        <View style={[styles.payIconWrap, missed && styles.payIconWrapMissed]}>
          <Ionicons
            name={missed ? 'close' : 'checkmark'}
            size={13}
            color={missed ? Colors.error : Colors.success}
          />
        </View>
        <View style={styles.payInfo}>
          <Text style={styles.payCode}>{payment.payment_code}</Text>
          <Text style={styles.payDate}>{fmtDate(payment.payment_date)}</Text>
        </View>
        <View style={styles.payRight}>
          <Text style={[styles.payAmt, missed && styles.payAmtMissed]}>
            {missed ? 'Missed' : fmt(payment.amount)}
          </Text>
          <Text style={styles.payMethod}>{payment.method}</Text>
        </View>
      </View>
      {!last && <View style={styles.payDivider} />}
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

// ─── Congratulations Modal ───────────────────────────────────────────────────

function CongratulationsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(ring1, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(ring1, { toValue: 0, duration: 0, useNativeDriver: true }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.delay(400),
            Animated.timing(ring2, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(ring2, { toValue: 0, duration: 0, useNativeDriver: true }),
          ])
        ),
      ]).start();
    } else {
      scale.setValue(0);
      opacity.setValue(0);
      ring1.setValue(0);
      ring2.setValue(0);
    }
  }, [visible]);

  const ringStyle = (anim: Animated.Value) => ({
    position: 'absolute' as const,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Colors.success,
    opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.8, 0.5, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.modalBackdrop, { opacity }]}>
        <Animated.View style={[styles.modalCard, { transform: [{ scale }] }]}>
          {/* Pulsing rings */}
          <View style={styles.iconWrap}>
            <Animated.View style={ringStyle(ring1)} />
            <Animated.View style={ringStyle(ring2)} />
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={44} color="#fff" />
            </View>
          </View>

          <Text style={styles.congratsTitle}>Autopay Cleared! 🎉</Text>
          <Text style={styles.congratsSub}>
            Congratulations! You have successfully completed your autopay plan. Thank you for choosing Moses Transportation!
          </Text>

          <TouchableOpacity style={styles.congratsBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.congratsBtnTxt}>Awesome, thanks!</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { data, loading, refreshing, error, refetch, onRefresh } = useDashboard();
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState<string | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const handlePayNow = async () => {
    setPaying(true);
    setPayMsg(null);
    try {
      const { data: res } = await userApi.payNow();
      if (res.loanCompleted) {
        setShowCongrats(true);
      } else {
        const msg = res.isPartial
          ? `Partial payment of ${fmt(res.deducted)} made. Please top up your wallet.`
          : `${fmt(res.deducted)} paid. Loan balance: ${fmt(res.loanBalance)}`;
        setPayMsg(msg);
      }
      onRefresh();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Payment failed. Try again.';
      setPayMsg(msg);
    } finally {
      setPaying(false);
    }
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={52} color={Colors.secondary} />
        <Text style={styles.errTitle}>Could not load dashboard</Text>
        <Text style={styles.errSub}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryTxt}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { user, loan, recentPayments } = data!;
  const firstName = user.full_name?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView style={styles.container}>
      <CongratulationsModal
        visible={showCongrats}
        onClose={() => { setShowCongrats(false); onRefresh(); }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* ── Greeting ── */}
        <View style={styles.greetRow}>
          <View>
            <Text style={styles.greetSub}>{greeting()},</Text>
            <Text style={styles.greetName}>{firstName} 👋</Text>
          </View>
        </View>

        <View style={styles.content}>
          {!user.application_fee_paid ? (
            /* ── Fee gate ── */
            <FeeGateCard />
          ) : user.kyc_status === 'not_submitted' ? (
            /* ── KYC gate ── */
            <KycGateCard />
          ) : user.kyc_status === 'pending' ? (
            /* ── KYC pending — only show tracking card ── */
            <TrackKycCard status="pending" />
          ) : user.kyc_status === 'rejected' ? (
            /* ── KYC rejected — only show tracking card ── */
            <TrackKycCard status="rejected" />
          ) : (
            /* ── Approved — full dashboard ── */
            <>
              <AccountCard user={user} loan={loan} />
              {loan && (
                <View style={styles.payNowWrap}>
                  {payMsg ? <Text style={styles.payNowMsg}>{payMsg}</Text> : null}
                  <TouchableOpacity
                    style={[styles.payNowBtn, paying && styles.payNowBtnDisabled]}
                    onPress={handlePayNow}
                    disabled={paying}
                    activeOpacity={0.85}
                  >
                    {paying ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="flash" size={16} color="#fff" />}
                    <Text style={styles.payNowTxt}>{paying ? 'Processing...' : 'Pay Now'}</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Active Autopay</Text>
              </View>
              {loan ? <LoanCard loan={loan} /> : <NoLoanCard />}
              {recentPayments.length > 0 && (
                <>
                  <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Recent Payments</Text>
                    <TouchableOpacity onPress={() => router.push('/(main)/(payment)')}>
                      <Text style={styles.seeAll}>See all</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.payCard}>
                    {recentPayments.map((p, i) => (
                      <PaymentItem key={p.id} payment={p} last={i === recentPayments.length - 1} />
                    ))}
                  </View>
                </>
              )}
              {recentPayments.length === 0 && loan && (
                <View style={styles.noPayments}>
                  <Ionicons name="receipt-outline" size={28} color={Colors.secondary} />
                  <Text style={styles.noPaymentsTxt}>No payments yet</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  centered: {
    flex: 1, backgroundColor: '#F5F7FA',
    justifyContent: 'center', alignItems: 'center',
    gap: Spacing.md, padding: Spacing.xl,
  },
  errTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold, color: Colors.text },
  errSub: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.primary,
  },
  retryTxt: { color: Colors.primary, fontWeight: Typography.weights.semibold },

  // Greeting
  greetRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs,
  },
  greetSub: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  greetName: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.primary, marginTop: 1 },

  content: { paddingHorizontal: Spacing.sm, paddingBottom: 100, gap: Spacing.sm },

  // Section
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs },
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.text },
  seeAll: { fontSize: Typography.sizes.sm, color: Colors.primary, fontWeight: Typography.weights.medium },

  // Gate cards (fee / kyc not submitted)
  gateCard: {
    backgroundColor: '#fff', borderRadius: BorderRadius.xl,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm,
    marginTop: Spacing.sm,
  },
  gateIconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.cardGreen,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  gateTitle: {
    fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold,
    color: Colors.primary, textAlign: 'center',
  },
  gateBody: {
    fontSize: Typography.sizes.base, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.sm,
  },
  gateIconWrapRed: { backgroundColor: '#FEE2E2' },
  gateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: 13,
    marginTop: Spacing.xs, ...Shadows.sm,
  },
  gateBtnRed: { backgroundColor: '#DC2626' },
  gateBtnTxt: { color: '#fff', fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },
  gateTitleRed: { color: '#991B1B' },

  // Account card
  accountCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  accountTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accountLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  accountIconWrap: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  accountLabel: { fontSize: Typography.sizes.xs, color: 'rgba(255,255,255,0.6)', fontWeight: Typography.weights.medium, letterSpacing: 0.4 },
  bankName: { fontSize: Typography.sizes.xs, color: 'rgba(255,255,255,0.6)', fontWeight: Typography.weights.medium },
  accountNumRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accountNum: { fontSize: 24, fontWeight: Typography.weights.bold, color: '#fff', letterSpacing: 3 },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  copyTxt: { fontSize: Typography.sizes.xs, color: 'rgba(255,255,255,0.85)', fontWeight: Typography.weights.medium },
  copyTxtDone: { color: '#86EFAC' },
  accountHolderName: { fontSize: Typography.sizes.sm, color: 'rgba(255,255,255,0.85)', fontWeight: Typography.weights.semibold, letterSpacing: 0.2 },
  feeNote: { fontSize: Typography.sizes.xs, color: 'rgba(255,255,255,0.45)', marginTop: 3 },
  accountDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 2 },
  balanceRow: { flexDirection: 'row' },
  balanceStat: { flex: 1, alignItems: 'center', gap: 3 },
  balanceStatSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  balanceLabel: { fontSize: Typography.sizes.xs, color: 'rgba(255,255,255,0.55)', fontWeight: Typography.weights.medium },
  balanceValue: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: '#fff' },
  balanceValueRed: { color: '#FCA5A5' },
  accountNote: { fontSize: Typography.sizes.xs, color: 'rgba(255,255,255,0.5)', lineHeight: 16 },

  // Loan card
  loanCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  loanHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  loanVehicleIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.cardGreen, justifyContent: 'center', alignItems: 'center',
  },
  loanHeaderText: { flex: 1 },
  loanVehicleName: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.text },
  loanVehicleType: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 1, textTransform: 'capitalize' },
  activePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#DCFCE7', borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  activePillText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold, color: Colors.success },

  // Progress
  progressWrap: { gap: 6 },
  progressTrack: {
    height: 8, backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: BorderRadius.full },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressPaid: { fontSize: Typography.sizes.xs, color: Colors.success, fontWeight: Typography.weights.medium },
  progressPct: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.primary },
  progressTotal: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },

  // Stats
  statsRow: {
    flexDirection: 'row', backgroundColor: '#F8FAF9',
    borderRadius: BorderRadius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 3 },
  statSep: { width: 1, backgroundColor: Colors.border },
  statVal: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.text },
  statValDanger: { color: Colors.error },
  statLbl: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, textAlign: 'center' },

  // Next payment row
  nextPayRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#EEF6FF', borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  nextPayRowDanger: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  nextPayLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nextPayLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
  nextPayDate: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.primary },
  nextPayDateDanger: { color: Colors.error },

  // No loan
  noLoanCard: {
    backgroundColor: '#fff', borderRadius: BorderRadius.xl,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm,
  },
  noLoanIllustration: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.cardGreen, justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  noLoanTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.text },
  noLoanSub: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: Spacing.md },
  browseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: 10, marginTop: Spacing.xs,
  },
  browseBtnTxt: { color: '#fff', fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },

  // Payments
  payCard: {
    backgroundColor: '#fff', borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.borderLight,
    overflow: 'hidden', ...Shadows.sm,
  },
  payItem: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 12,
  },
  payIconWrap: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center',
  },
  payIconWrapMissed: { backgroundColor: '#FEE2E2' },
  payInfo: { flex: 1 },
  payCode: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.text },
  payDate: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 2 },
  payRight: { alignItems: 'flex-end' },
  payAmt: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.success },
  payAmtMissed: { color: Colors.error },
  payMethod: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  payDivider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.md },

  noPayments: {
    alignItems: 'center', gap: 6, paddingVertical: Spacing.lg,
    backgroundColor: '#fff', borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  noPaymentsTxt: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },

  // Congratulations modal
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: BorderRadius.xxl,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.md,
    width: '100%', ...Shadows.lg,
  },
  iconWrap: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  successCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.success, justifyContent: 'center', alignItems: 'center',
    ...Shadows.md,
  },
  congratsTitle: {
    fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.extrabold,
    color: Colors.text, textAlign: 'center',
  },
  congratsSub: {
    fontSize: Typography.sizes.sm, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 20,
  },
  congratsBtn: {
    backgroundColor: Colors.success, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: 13,
    marginTop: Spacing.xs, ...Shadows.sm,
  },
  congratsBtnTxt: { color: '#fff', fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },

  // Pay Now
  payNowWrap: { gap: Spacing.xs },
  payNowMsg: {
    fontSize: Typography.sizes.sm, color: Colors.text, textAlign: 'center',
    backgroundColor: '#fff', borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  payNowBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md, paddingVertical: 13,
    ...Shadows.sm,
  },
  payNowBtnDisabled: { opacity: 0.6 },
  payNowTxt: { color: '#fff', fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },
});
