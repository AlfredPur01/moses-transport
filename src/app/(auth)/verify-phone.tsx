import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authApi } from '@/api/auth';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/utils/error';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function VerifyPhoneScreen() {
  const { setPhoneVerified } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const otp = digits.join('');
  const isComplete = otp.length === OTP_LENGTH && digits.every(d => d !== '');

  const handleDigitChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(null);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!isComplete) return;
    setLoading(true);
    setError(null);
    try {
      await authApi.verifyPhone(otp);
      await setPhoneVerified(true);
      // AuthNavigator in _layout.tsx will redirect to home automatically
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Verification failed. Please try again.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      await authApi.resendOtp();
      setCountdown(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Ionicons name="phone-portrait-outline" size={48} color={Colors.primary} />
          </View>

          <Text style={styles.title}>Verify Your Number</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to your phone number. Enter it below to continue.
          </Text>

          {/* OTP boxes */}
          <View style={styles.otpRow}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={ref => { inputRefs.current[i] = ref; }}
                style={[styles.otpBox, digit && styles.otpBoxFilled, error && styles.otpBoxError]}
                value={digit}
                onChangeText={text => handleDigitChange(text, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={i === 0}
              />
            ))}
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color={Colors.error} />
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          ) : null}

          {/* Verify button */}
          <TouchableOpacity
            style={[styles.btn, (!isComplete || loading) && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={!isComplete || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.btnTxt}>Verify</Text>
            }
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Did not receive the code? </Text>
            {countdown > 0 ? (
              <Text style={styles.resendCountdown}>Resend in {countdown}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                {resending
                  ? <ActivityIndicator size="small" color={Colors.primary} />
                  : <Text style={styles.resendLink}>Resend Code</Text>
                }
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl, gap: Spacing.md,
  },

  iconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.cardGreen,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold,
    color: Colors.primary, textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.base, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22, marginBottom: Spacing.sm,
  },

  otpRow: {
    flexDirection: 'row', gap: Spacing.sm, marginVertical: Spacing.md,
  },
  otpBox: {
    width: 46, height: 54, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    textAlign: 'center', fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold, color: Colors.text,
    backgroundColor: Colors.card, ...Shadows.sm,
  },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.cardGreen },
  otpBoxError:  { borderColor: Colors.error },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF2F2', borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderWidth: 1, borderColor: '#FECACA', alignSelf: 'stretch',
  },
  errorTxt: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.error },

  btn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: 14, alignSelf: 'stretch',
    alignItems: 'center', ...Shadows.sm,
  },
  btnDisabled: { opacity: 0.5 },
  btnTxt: { color: '#fff', fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },

  resendRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs },
  resendLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  resendCountdown: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
  resendLink: { fontSize: Typography.sizes.sm, color: Colors.primary, fontWeight: Typography.weights.semibold },
});
