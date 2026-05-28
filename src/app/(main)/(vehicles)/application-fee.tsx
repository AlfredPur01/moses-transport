import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeeInitResponse, VehicleType, userApi } from '@/api/user';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { getApiErrorMessage } from '@/utils/error';

const fmt = (n: number) => `₦${Number(n).toLocaleString('en-NG')}`;

const VEHICLE_OPTIONS: { type: VehicleType; label: string; fee: number; icon: any; description: string }[] = [
  { type: 'motorcycle', label: 'Motorcycle', fee: 6000,  icon: 'bicycle', description: 'Okada / dispatch rider' },
  { type: 'tricycle',   label: 'Tricycle',   fee: 10000, icon: 'car',     description: 'Keke / cargo tricycle'  },
];

export default function ApplicationFeeScreen() {
  const [paid,         setPaid]         = useState<boolean | null>(null);
  const [selectedType, setSelected]     = useState<VehicleType | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [requesting,   setRequesting]   = useState(false);
  const [verifying,    setVerifying]    = useState(false);
  const [transferInfo, setTransferInfo] = useState<FeeInitResponse | null>(null);
  const [copied,       setCopied]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    userApi.getProfile()
      .then(({ data }) => {
        const alreadyPaid = data.application_fee_paid ?? false;
        if (alreadyPaid) {
          router.replace('/(main)/(profile)/kyc/intro');
        } else {
          setPaid(false);
        }
      })
      .catch(err => setError(getApiErrorMessage(err) ?? 'Could not load status.'))
      .finally(() => setLoading(false));
  }, []);

  // Stop polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const startPolling = (reference: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await userApi.verifyFeePayment(reference);
        if (data.paid) {
          clearInterval(pollRef.current!);
          router.replace('/(main)/(profile)/kyc/intro');
        }
      } catch {
        // network hiccup — keep polling
      }
    }, 5000);
  };

  const handleRequestAccount = async () => {
    if (!selectedType) return;
    setRequesting(true);
    setError(null);
    try {
      const { data } = await userApi.initializeFeePayment(selectedType);
      setTransferInfo(data);
      startPolling(data.reference);
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Could not generate account. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  const handleManualCheck = async () => {
    if (!transferInfo) return;
    setVerifying(true);
    setError(null);
    try {
      const { data } = await userApi.verifyFeePayment(transferInfo.reference);
      if (data.paid) {
        if (pollRef.current) clearInterval(pollRef.current);
        router.replace('/(main)/(profile)/kyc/intro');
      } else {
        setError('Transfer not yet received. Please wait a moment and try again.');
      }
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Could not check payment. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCopy = async (value: string) => {
    await Clipboard.setStringAsync(value);
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

  // ── Already paid ─────────────────────────────────────────────────────
  if (paid) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Application Fee</Text>
        </View>
        <View style={styles.content}>
          <View style={[styles.iconCircle, styles.iconCirclePaid]}>
            <Ionicons name="checkmark-circle" size={52} color={Colors.success} />
          </View>
          <Text style={styles.title}>Fee Paid</Text>
          <Text style={styles.sub}>
            Your application fee has been confirmed. You can now complete your KYC verification.
          </Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/(main)/(profile)/kyc/intro')} activeOpacity={0.85}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
            <Text style={styles.ctaTxt}>Continue to KYC</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Waiting for transfer ──────────────────────────────────────────────
  if (transferInfo) {
    const expiresAt = new Date(transferInfo.account_expires_at);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Make Transfer</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Amount */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Transfer exactly</Text>
            <Text style={styles.amountValue}>{fmt(transferInfo.amount)}</Text>
            <Text style={styles.amountNote}>
              {transferInfo.vehicle_type === 'motorcycle' ? 'Motorcycle' : 'Tricycle'} application fee · one-time
            </Text>
          </View>

          {/* Account details */}
          <View style={styles.accountCard}>
            <Text style={styles.accountCardTitle}>Transfer to this account</Text>

            <View style={styles.accountRow}>
              <View style={styles.accountField}>
                <Text style={styles.fieldLabel}>Bank</Text>
                <Text style={styles.fieldValue}>{transferInfo.bank_name}</Text>
              </View>
            </View>

            <View style={styles.accountRow}>
              <View style={styles.accountField}>
                <Text style={styles.fieldLabel}>Account Name</Text>
                <Text style={styles.fieldValue}>{transferInfo.account_name}</Text>
              </View>
            </View>

            <View style={styles.accountRow}>
              <View style={[styles.accountField, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Account Number</Text>
                <Text style={[styles.fieldValue, styles.accountNum]}>{transferInfo.account_number}</Text>
              </View>
              <TouchableOpacity style={styles.copyBtn} onPress={() => handleCopy(transferInfo.account_number)} activeOpacity={0.7}>
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color={copied ? Colors.success : Colors.primary} />
                <Text style={[styles.copyTxt, copied && styles.copyTxtDone]}>{copied ? 'Copied!' : 'Copy'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.expireRow}>
              <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.expireText}>
                Account expires at {expiresAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          {/* Waiting indicator */}
          <View style={styles.waitingCard}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.waitingText}>Waiting for transfer confirmation…</Text>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          ) : null}

          {/* Manual check button */}
          <TouchableOpacity
            style={[styles.ctaBtn, verifying && styles.ctaBtnDisabled]}
            onPress={handleManualCheck}
            disabled={verifying}
            activeOpacity={0.85}
          >
            {verifying
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />}
            <Text style={styles.ctaTxt}>
              {verifying ? 'Checking…' : "I've Transferred"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Once your transfer is received, this screen will automatically proceed to KYC. Make sure to transfer the exact amount shown.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Select vehicle type ───────────────────────────────────────────────
  const selectedOption = VEHICLE_OPTIONS.find(o => o.type === selectedType);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application Fee</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="card-outline" size={48} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Select Vehicle Type</Text>
        <Text style={styles.sub}>
          Choose the type of vehicle you want to apply for. The fee varies by type.
        </Text>

        <View style={styles.optionsRow}>
          {VEHICLE_OPTIONS.map(opt => {
            const active = selectedType === opt.type;
            return (
              <TouchableOpacity
                key={opt.type}
                style={[styles.optionCard, active && styles.optionCardActive]}
                onPress={() => setSelected(opt.type)}
                activeOpacity={0.8}
              >
                <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                  <Ionicons name={opt.icon} size={32} color={active ? '#fff' : Colors.primary} />
                </View>
                <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{opt.label}</Text>
                <Text style={[styles.optionDesc,  active && styles.optionDescActive]}>{opt.description}</Text>
                <Text style={[styles.optionFee,   active && styles.optionFeeActive]}>{fmt(opt.fee)}</Text>
                {active && <View style={styles.optionCheck}><Ionicons name="checkmark-circle" size={18} color="#fff" /></View>}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedOption && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>You will transfer</Text>
            <Text style={styles.summaryAmount}>{fmt(selectedOption.fee)}</Text>
            <Text style={styles.summaryNote}>One-time, non-refundable application fee</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.ctaBtn, (!selectedType || requesting) && styles.ctaBtnDisabled]}
          onPress={handleRequestAccount}
          disabled={!selectedType || requesting}
          activeOpacity={0.85}
        >
          {requesting
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="arrow-forward-circle-outline" size={18} color="#fff" />}
          <Text style={styles.ctaTxt}>{requesting ? 'Generating account…' : 'Get Account Number'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkTxt}>Go back</Text>
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

  scroll:  { padding: Spacing.md, gap: Spacing.lg, paddingBottom: Spacing.xxxl },
  content: { flex: 1, padding: Spacing.lg, gap: Spacing.md, alignItems: 'center' },

  iconCircle:     { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.cardGreen, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.sm },
  iconCirclePaid: { backgroundColor: '#D1FAE5' },

  title: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.text, textAlign: 'center' },
  sub:   { fontSize: Typography.sizes.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  // Amount card
  amountCard: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, alignItems: 'center', gap: 4, width: '100%', ...Shadows.md,
  },
  amountLabel: { fontSize: Typography.sizes.sm, color: 'rgba(255,255,255,0.75)' },
  amountValue: { fontSize: 36, fontWeight: Typography.weights.extrabold, color: '#fff' },
  amountNote:  { fontSize: Typography.sizes.xs, color: 'rgba(255,255,255,0.6)' },

  // Account card
  accountCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.primary + '30', width: '100%', ...Shadows.sm,
  },
  accountCardTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.text, marginBottom: 4 },
  accountRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accountField:{ flex: 1 },
  fieldLabel:  { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginBottom: 2 },
  fieldValue:  { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.text },
  accountNum:  { fontSize: Typography.sizes.xl, letterSpacing: 2, color: Colors.primary },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  copyTxt:    { fontSize: Typography.sizes.xs, color: Colors.primary, fontWeight: Typography.weights.medium },
  copyTxtDone:{ color: Colors.success },
  expireRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  expireText: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },

  // Waiting
  waitingCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.cardGreen, borderRadius: BorderRadius.lg,
    padding: Spacing.md, width: '100%',
    borderWidth: 1, borderColor: Colors.primary + '20',
  },
  waitingText: { fontSize: Typography.sizes.sm, color: Colors.primary, fontWeight: Typography.weights.medium, flex: 1 },
  hint: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },

  // Vehicle selector
  optionsRow:        { flexDirection: 'row', gap: Spacing.md, width: '100%' },
  optionCard:        { flex: 1, alignItems: 'center', gap: Spacing.xs, backgroundColor: '#fff', borderRadius: BorderRadius.xl, padding: Spacing.md, borderWidth: 2, borderColor: Colors.borderLight, position: 'relative', ...Shadows.sm },
  optionCardActive:  { borderColor: Colors.primary, backgroundColor: Colors.primary },
  optionIcon:        { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.cardGreen, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  optionIconActive:  { backgroundColor: 'rgba(255,255,255,0.2)' },
  optionLabel:       { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.text },
  optionLabelActive: { color: '#fff' },
  optionDesc:        { fontSize: Typography.sizes.xs, color: Colors.textSecondary, textAlign: 'center' },
  optionDescActive:  { color: 'rgba(255,255,255,0.7)' },
  optionFee:         { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.primary, marginTop: 4 },
  optionFeeActive:   { color: '#fff' },
  optionCheck:       { position: 'absolute', top: 8, right: 8 },

  summaryCard: {
    width: '100%', alignItems: 'center', backgroundColor: Colors.cardGreen,
    borderRadius: BorderRadius.lg, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    borderWidth: 1, borderColor: Colors.primary + '30', gap: 2,
  },
  summaryLabel:  { fontSize: Typography.sizes.sm, color: Colors.primary, fontWeight: Typography.weights.medium },
  summaryAmount: { fontSize: 32, fontWeight: Typography.weights.bold, color: Colors.primary },
  summaryNote:   { fontSize: Typography.sizes.xs, color: Colors.textSecondary },

  errorBanner: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: '#FEE2E2', borderRadius: BorderRadius.md, padding: Spacing.md },
  errorTxt:    { flex: 1, fontSize: Typography.sizes.sm, color: Colors.error },

  ctaBtn:         { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 16, ...Shadows.md },
  ctaBtnDisabled: { opacity: 0.45 },
  ctaTxt:         { color: '#fff', fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },

  backLink:    { paddingVertical: Spacing.sm },
  backLinkTxt: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, textDecorationLine: 'underline' },
});
