import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';

const GUARANTOR_REQUIREMENTS = [
  { icon: 'person-outline' as const, title: 'Valid ID', desc: 'National ID, drivers licence, or international passport' },
  { icon: 'call-outline' as const, title: 'Reachable Phone', desc: 'An active phone number we can reach them on' },
  { icon: 'home-outline' as const, title: 'Residential Address', desc: 'Their current home address for our records' },
  { icon: 'business-outline' as const, title: 'Employment / Business', desc: 'Proof of stable income or business activity' },
];

export default function GuarantorScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guarantor Information</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="people" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Guarantors Required</Text>
          <Text style={styles.heroSub}>
            A guarantor vouches for your loan repayment. Moses Transport requires
            at least one guarantor when processing a loan application.
          </Text>
        </View>

        {/* What they need */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What your guarantor needs</Text>
          <View style={styles.card}>
            {GUARANTOR_REQUIREMENTS.map((req, i) => (
              <View key={i} style={[styles.reqRow, i > 0 && styles.rowBorder]}>
                <View style={styles.reqIcon}>
                  <Ionicons name={req.icon} size={18} color={Colors.primary} />
                </View>
                <View style={styles.reqText}>
                  <Text style={styles.reqTitle}>{req.title}</Text>
                  <Text style={styles.reqDesc}>{req.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <View style={styles.card}>
            <Text style={styles.infoText}>
              When you apply for a loan at our office, you will be asked to provide
              details of your guarantor(s). Our team will contact them to confirm
              their consent before the loan is approved.
            </Text>
            <View style={styles.noteBanner}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
              <Text style={styles.noteText}>
                Guarantor registration is handled at our office during loan application.
              </Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => router.push('/(main)/(profile)/guarantor/form')}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add-outline" size={20} color={Colors.textLight} />
          <Text style={styles.ctaBtnText}>Add Guarantor Details</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  headerSpacer: { width: 32 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl, gap: Spacing.lg },
  hero: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.cardGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.primary },
  heroSub: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.sizes.base * 1.6,
  },
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  reqRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.xs },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.borderLight },
  reqIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reqText: { flex: 1, gap: 2 },
  reqTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.text },
  reqDesc: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, lineHeight: Typography.sizes.sm * 1.5 },
  infoText: {
    fontSize: Typography.sizes.base,
    color: Colors.text,
    lineHeight: Typography.sizes.base * 1.6,
  },
  noteBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.cardGreen,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  noteText: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.primary, lineHeight: Typography.sizes.sm * 1.5 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
  },
  ctaBtnText: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.textLight },
});
